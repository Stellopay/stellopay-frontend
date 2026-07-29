import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconBell } from "./bell-fill-icon";

describe("IconBell", () => {
  it("uses currentColor instead of a hardcoded fill", () => {
    const { container } = render(<IconBell />);

    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(2);

    for (const path of paths) {
      expect(path.getAttribute("fill")).toBe("currentColor");
    }
  });

  it("inherits text color from a light-mode parent", () => {
    const { container } = render(
      <div style={{ color: "#1a1a1a" }}>
        <IconBell />
      </div>,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // The SVG's computed color should match the parent's color
    const computedColor = window.getComputedStyle(svg!).color;
    expect(computedColor).toBe("rgb(26, 26, 26)");
  });

  it("inherits text color from a dark-mode parent", () => {
    const { container } = render(
      <div style={{ color: "#e5e5e5" }}>
        <IconBell />
      </div>,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();

    // dark background uses #e5e5e5 text, matching notification panel
    const computedColor = window.getComputedStyle(svg!).color;
    expect(computedColor).toBe("rgb(229, 229, 229)");
  });

  it("applies custom className while preserving currentColor", () => {
    const { container } = render(
      <IconBell className="custom-icon" />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom-icon");

    // Verify paths still use currentColor even with extra classes
    const paths = container.querySelectorAll("path");
    for (const path of paths) {
      expect(path.getAttribute("fill")).toBe("currentColor");
    }
  });

  it("forwards additional SVG props", () => {
    render(<IconBell aria-label="Notification bell" />);

    expect(
      screen.getByLabelText("Notification bell"),
    ).toBeInTheDocument();
  });
});
