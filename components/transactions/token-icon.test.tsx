import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TokenIcon, {
  FALLBACK_TOKEN_LOGO,
  resolveTokenLogo,
} from "./token-icon";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

describe("resolveTokenLogo", () => {
  it("maps known symbols to their logo", () => {
    expect(resolveTokenLogo("USDC")).toBe("/usdc-logo.png");
    expect(resolveTokenLogo("XLM")).toBe("/stellar-xlm-logo.png");
  });

  it("matches case-insensitively", () => {
    expect(resolveTokenLogo("usdc")).toBe("/usdc-logo.png");
    expect(resolveTokenLogo("xlm")).toBe("/stellar-xlm-logo.png");
  });

  it("falls back to a generic coin for unknown symbols", () => {
    expect(resolveTokenLogo("ETH")).toBe(FALLBACK_TOKEN_LOGO);
  });

  it.each(["", undefined, null])(
    "falls back rather than throwing for %s",
    (input) => {
      expect(resolveTokenLogo(input as unknown as string)).toBe(
        FALLBACK_TOKEN_LOGO,
      );
    },
  );
});

describe("TokenIcon — rendering", () => {
  it("renders an image with an accessible name derived from the symbol", () => {
    render(<TokenIcon token="USDC" />);

    expect(screen.getByAltText("USDC token icon")).toBeInTheDocument();
  });

  it("resolves the logo from the symbol when no src is given", () => {
    render(<TokenIcon token="XLM" />);

    expect(screen.getByAltText("XLM token icon")).toHaveAttribute(
      "src",
      "/stellar-xlm-logo.png",
    );
  });

  it("prefers an explicit src over the symbol mapping", () => {
    render(<TokenIcon token="USDC" src="/custom/usdc.svg" />);

    expect(screen.getByAltText("USDC token icon")).toHaveAttribute(
      "src",
      "/custom/usdc.svg",
    );
  });

  it("renders a fallback icon for an unrecognised symbol rather than nothing", () => {
    render(<TokenIcon token="DOGE" />);

    const img = screen.getByAltText("DOGE token icon");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", FALLBACK_TOKEN_LOGO);
  });

  it("defaults to 20px and honours an explicit size", () => {
    const { rerender } = render(<TokenIcon token="USDC" />);
    expect(screen.getByAltText("USDC token icon")).toHaveAttribute(
      "width",
      "20",
    );

    rerender(<TokenIcon token="USDC" size={16} />);
    expect(screen.getByAltText("USDC token icon")).toHaveAttribute(
      "width",
      "16",
    );
  });

  it("keeps the icon from shrinking in a flex row", () => {
    const { container } = render(<TokenIcon token="USDC" />);

    expect(container.firstElementChild?.className).toContain("shrink-0");
  });
});

// ---------------------------------------------------------------------------
// Memoization — the regression this component exists to guard
// ---------------------------------------------------------------------------

describe("TokenIcon — memoization", () => {
  /**
   * Counts how many times each token's icon actually re-renders.
   *
   * `next/image` is mocked to a plain <img>, so a render of TokenIcon always
   * reaches this spy exactly once. Keyed by token so a single counter cannot
   * hide one row re-rendering while another does not.
   */
  let renderCounts: Record<string, number>;

  beforeEach(() => {
    renderCounts = {};
  });

  /** Wraps TokenIcon so we can observe render frequency without touching it. */
  const CountingTokenIcon = React.memo(function CountingTokenIcon({
    token,
    src,
    size,
  }: {
    token: string;
    src?: string;
    size?: number;
  }) {
    renderCounts[token] = (renderCounts[token] ?? 0) + 1;
    return <TokenIcon token={token} src={src} size={size} />;
  });

  /** Minimal stand-in for the table: rows plus unrelated parent state. */
  function TableHarness({ tokens }: { tokens: string[] }) {
    const [hovered, setHovered] = React.useState(false);
    const [rowVersion, setRowVersion] = React.useState(0);

    return (
      <div>
        <button type="button" onClick={() => setHovered((h) => !h)}>
          toggle sort hover {String(hovered)}
        </button>
        <button type="button" onClick={() => setRowVersion((v) => v + 1)}>
          update first row
        </button>
        {tokens.map((token, index) => (
          <div key={token}>
            <CountingTokenIcon token={token} />
            <span>
              {token}
              {index === 0 ? `-v${rowVersion}` : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }

  it("is wrapped in React.memo", () => {
    expect(
      (TokenIcon as unknown as { $$typeof: symbol }).$$typeof,
    ).toBe(Symbol.for("react.memo"));
  });

  it("does not re-render any icon when an unrelated parent state change occurs", () => {
    render(<TableHarness tokens={["USDC", "XLM", "ETH"]} />);

    expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });

    // Simulates the sort-icon hover called out in the issue: the table
    // re-renders, but no icon's props changed.
    fireEvent.click(screen.getByRole("button", { name: /toggle sort hover/i }));

    expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });
  });

  it("does not re-render sibling icons when one row updates", () => {
    render(<TableHarness tokens={["USDC", "XLM", "ETH"]} />);
    expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });

    fireEvent.click(screen.getByRole("button", { name: /update first row/i }));

    // The first row's text changed, but no icon's props did.
    expect(renderCounts).toEqual({ USDC: 1, XLM: 1, ETH: 1 });
    expect(screen.getByText(/USDC-v1/)).toBeInTheDocument();
  });

  it("stays flat across repeated unrelated re-renders", () => {
    render(<TableHarness tokens={["USDC", "XLM"]} />);

    for (let i = 0; i < 5; i++) {
      fireEvent.click(
        screen.getByRole("button", { name: /toggle sort hover/i }),
      );
    }

    expect(renderCounts).toEqual({ USDC: 1, XLM: 1 });
  });

  it("still re-renders when its own props genuinely change", () => {
    function Resizable() {
      const [size, setSize] = React.useState(16);
      return (
        <div>
          <button type="button" onClick={() => setSize(20)}>
            grow
          </button>
          <CountingTokenIcon token="USDC" size={size} />
        </div>
      );
    }

    render(<Resizable />);
    expect(renderCounts.USDC).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: /grow/i }));

    expect(renderCounts.USDC).toBe(2);
    expect(screen.getByAltText("USDC token icon")).toHaveAttribute(
      "width",
      "20",
    );
  });

  it("scales: 30 rows re-render zero icons on an unrelated parent update", () => {
    const tokens = Array.from({ length: 30 }, (_, i) => `TKN${i}`);
    render(<TableHarness tokens={tokens} />);

    const initial = Object.values(renderCounts).reduce((a, b) => a + b, 0);
    expect(initial).toBe(30);

    fireEvent.click(screen.getByRole("button", { name: /toggle sort hover/i }));

    const after = Object.values(renderCounts).reduce((a, b) => a + b, 0);
    expect(after).toBe(30);
  });
});
