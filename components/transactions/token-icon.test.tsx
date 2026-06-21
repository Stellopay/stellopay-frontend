import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TokenIcon from "./token-icon";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span aria-label={alt} role="img" />,
}));

describe("TokenIcon", () => {
  it("renders the USDC logo for supported USDC tokens", () => {
    render(<TokenIcon token="USDC" />);

    expect(screen.getByRole("img", { name: "USDC" })).toBeInTheDocument();
  });

  it("renders the XLM logo for supported XLM tokens", () => {
    render(<TokenIcon token="XLM" />);

    expect(screen.getByRole("img", { name: "XLM" })).toBeInTheDocument();
  });

  it("renders a compact fallback label for unsupported tokens", () => {
    render(<TokenIcon token="EURC" />);

    expect(screen.getByLabelText("EURC token")).toHaveTextContent("EUR");
  });

  it("normalizes lowercase and symbol-heavy unsupported tokens", () => {
    render(<TokenIcon token=" usd+" />);

    expect(screen.getByLabelText("usd+ token")).toHaveTextContent("USD");
  });

  it("uses a safe placeholder when the token symbol is empty", () => {
    render(<TokenIcon token="   " />);

    expect(screen.getByLabelText("Unknown token")).toHaveTextContent("?");
  });
});
