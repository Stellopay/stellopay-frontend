/**
 * Tests for components/icons/bell-fill-icon.tsx
 *
 * Coverage checklist (per design/icons.md §Testing):
 *   ✓ Default render
 *   ✓ fill uses currentColor
 *   ✓ viewBox is "0 0 24 24"
 *   ✓ Default size (width=24, height=24)
 *   ✓ size prop overrides dimensions
 *   ✓ className forwarding
 *   ✓ Decorative: aria-hidden="true" by default (no label supplied)
 *   ✓ Meaningful: role="img" + aria-label when aria-label is supplied
 *   ✓ Meaningful: role="img" + aria-labelledby when aria-labelledby is supplied
 *   ✓ Explicit role forwarded as-is
 *   ✓ Color inheritance (light mode)
 *   ✓ Color inheritance (dark mode)
 *   ✓ forwardRef attaches to <svg>
 *   ✓ Arbitrary SVG props forwarded
 *   ✓ Both <path> children use fill="currentColor"
 *   ✓ displayName
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconBell } from "./bell-fill-icon";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBell(props: React.ComponentPropsWithRef<typeof IconBell> = {}) {
  return render(<IconBell {...props} />);
}

function getSvg(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("No <svg> found");
  return svg as unknown as SVGSVGElement;
}

// ---------------------------------------------------------------------------
// 1. Default render
// ---------------------------------------------------------------------------

describe("IconBell — default render", () => {
  it("renders without throwing", () => {
    expect(() => renderBell()).not.toThrow();
  });

  it("renders a single <svg> element", () => {
    const { container } = renderBell();
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
  });

  it("renders exactly 2 <path> children", () => {
    const { container } = renderBell();
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 2. Lucide convention — viewBox, size, fill
// ---------------------------------------------------------------------------

describe("IconBell — lucide convention compliance", () => {
  it('has viewBox="0 0 24 24"', () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it('has default width="24"', () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("width")).toBe("24");
  });

  it('has default height="24"', () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("height")).toBe("24");
  });

  it('has fill="currentColor" on the <svg> element', () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("fill")).toBe("currentColor");
  });

  it("all <path> elements inherit fill via currentColor (no hardcoded hex)", () => {
    const { container } = renderBell();
    const paths = container.querySelectorAll("path");
    // Paths should not set a different explicit fill
    for (const path of paths) {
      const fill = path.getAttribute("fill");
      // Either null/unset (inherits from svg) or explicitly "currentColor"
      expect(fill === null || fill === "currentColor").toBe(true);
    }
  });

  it("does not use a stroke (filled icon, no stroke convention)", () => {
    const { container } = renderBell();
    const stroke = getSvg(container).getAttribute("stroke");
    // stroke attribute should be absent or "none" — never a colour
    expect(stroke === null || stroke === "none").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. size prop
// ---------------------------------------------------------------------------

describe("IconBell — size prop", () => {
  it("sets width and height to the supplied size number", () => {
    const { container } = renderBell({ size: 16 });
    const svg = getSvg(container);
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("height")).toBe("16");
  });

  it("accepts a string size value", () => {
    const { container } = renderBell({ size: "2em" });
    const svg = getSvg(container);
    expect(svg.getAttribute("width")).toBe("2em");
    expect(svg.getAttribute("height")).toBe("2em");
  });

  it("width/height props override size when supplied", () => {
    // Explicit width/height spread after size, so they win (standard SVG spread)
    const { container } = renderBell({ size: 32, width: 20, height: 20 });
    const svg = getSvg(container);
    expect(svg.getAttribute("width")).toBe("20");
    expect(svg.getAttribute("height")).toBe("20");
  });
});

// ---------------------------------------------------------------------------
// 4. className forwarding
// ---------------------------------------------------------------------------

describe("IconBell — className", () => {
  it("applies a single className to the <svg>", () => {
    const { container } = renderBell({ className: "text-orange-400" });
    expect(getSvg(container)).toHaveClass("text-orange-400");
  });

  it("applies multiple classNames", () => {
    const { container } = renderBell({
      className: "text-white w-4 h-4",
    });
    const svg = getSvg(container);
    expect(svg).toHaveClass("text-white");
    expect(svg).toHaveClass("w-4");
    expect(svg).toHaveClass("h-4");
  });

  it("still uses currentColor fill with a className applied", () => {
    const { container } = renderBell({ className: "custom-icon" });
    expect(getSvg(container).getAttribute("fill")).toBe("currentColor");
  });
});

// ---------------------------------------------------------------------------
// 5. Accessibility — decorative (default)
// ---------------------------------------------------------------------------

describe("IconBell — a11y: decorative (no label supplied)", () => {
  it('has aria-hidden="true" by default', () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("aria-hidden")).toBe("true");
  });

  it("is NOT queryable via an accessible role by default", () => {
    renderBell();
    // Should not appear as an img role since it is hidden
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("does not have a role attribute when no label is supplied", () => {
    const { container } = renderBell();
    expect(getSvg(container).getAttribute("role")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility — meaningful (label supplied)
// ---------------------------------------------------------------------------

describe("IconBell — a11y: meaningful (aria-label supplied)", () => {
  it('adds role="img" when aria-label is provided', () => {
    const { container } = renderBell({ "aria-label": "New notification" });
    expect(getSvg(container).getAttribute("role")).toBe("img");
  });

  it("removes aria-hidden when aria-label is provided", () => {
    const { container } = renderBell({ "aria-label": "New notification" });
    expect(getSvg(container).getAttribute("aria-hidden")).toBeNull();
  });

  it("is queryable via role=img when aria-label is provided", () => {
    renderBell({ "aria-label": "New notification" });
    expect(screen.getByRole("img", { name: "New notification" })).toBeInTheDocument();
  });

  it("is queryable via getByLabelText when aria-label is provided", () => {
    renderBell({ "aria-label": "Notification bell" });
    expect(screen.getByLabelText("Notification bell")).toBeInTheDocument();
  });
});

describe("IconBell — a11y: meaningful (aria-labelledby supplied)", () => {
  it('adds role="img" when aria-labelledby is provided', () => {
    const { container } = render(
      <>
        <span id="bell-label">Notifications</span>
        <IconBell aria-labelledby="bell-label" />
      </>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
    expect(svg.getAttribute("aria-labelledby")).toBe("bell-label");
  });
});

describe("IconBell — a11y: explicit role forwarded", () => {
  it("uses the caller-supplied role instead of defaulting to img", () => {
    const { container } = renderBell({
      role: "presentation",
      "aria-label": "decorative bell",
    });
    expect(getSvg(container).getAttribute("role")).toBe("presentation");
  });
});

// ---------------------------------------------------------------------------
// 7. Color inheritance (dark / light mode)
// ---------------------------------------------------------------------------

describe("IconBell — color inheritance", () => {
  it("inherits the light-mode text color from a parent element", () => {
    const { container } = render(
      <div style={{ color: "#1a1a1a" }}>
        <IconBell />
      </div>,
    );
    const svg = container.querySelector("svg")!;
    const computed = window.getComputedStyle(svg).color;
    expect(computed).toBe("rgb(26, 26, 26)");
  });

  it("inherits the dark-mode text color from a parent element", () => {
    const { container } = render(
      <div style={{ color: "#e5e5e5" }}>
        <IconBell />
      </div>,
    );
    const svg = container.querySelector("svg")!;
    const computed = window.getComputedStyle(svg).color;
    expect(computed).toBe("rgb(229, 229, 229)");
  });
});

// ---------------------------------------------------------------------------
// 8. forwardRef
// ---------------------------------------------------------------------------

describe("IconBell — forwardRef", () => {
  it("attaches a ref to the underlying <svg> element", () => {
    const ref = createRef<SVGSVGElement>();
    const { container } = render(<IconBell ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBe(container.querySelector("svg"));
  });
});

// ---------------------------------------------------------------------------
// 9. Arbitrary prop forwarding
// ---------------------------------------------------------------------------

describe("IconBell — prop forwarding", () => {
  it("forwards a data-testid attribute to the <svg>", () => {
    const { container } = renderBell({ "data-testid": "bell-icon" });
    expect(getSvg(container).getAttribute("data-testid")).toBe("bell-icon");
  });

  it("forwards an onClick handler to the <svg>", () => {
    let clicked = false;
    const { container } = renderBell({
      onClick: () => { clicked = true; },
    });
    getSvg(container).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. displayName
// ---------------------------------------------------------------------------

describe("IconBell — displayName", () => {
  it("has displayName set to 'IconBell'", () => {
    expect(IconBell.displayName).toBe("IconBell");
  });
});
