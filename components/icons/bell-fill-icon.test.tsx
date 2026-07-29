import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconBell } from "./bell-fill-icon";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBell(props: React.SVGProps<SVGSVGElement> = {}) {
  return render(<IconBell {...props} />);
}

// ---------------------------------------------------------------------------
// SVG structure
// ---------------------------------------------------------------------------

describe("IconBell — SVG structure", () => {
  it("renders an <svg> element", () => {
    const { container } = renderBell();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has the correct default viewBox (0 0 10 14)", () => {
    const { container } = renderBell();
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 10 14",
    );
  });

  it("has the correct default width (10) and height (14)", () => {
    const { container } = renderBell();
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "10");
    expect(svg).toHaveAttribute("height", "14");
  });

  it("renders exactly two <path> elements", () => {
    const { container } = renderBell();
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("both paths carry a fill attribute", () => {
    const { container } = renderBell();
    container.querySelectorAll("path").forEach((path) => {
      expect(path).toHaveAttribute("fill");
    });
  });
});

// ---------------------------------------------------------------------------
// Prop forwarding
// ---------------------------------------------------------------------------

describe("IconBell — prop forwarding", () => {
  it("forwards a className to the <svg> element", () => {
    const { container } = renderBell({ className: "custom-class" });
    expect(container.querySelector("svg")).toHaveClass("custom-class");
  });

  it("forwards arbitrary SVG props (data-testid)", () => {
    const { container } = renderBell({ "data-testid": "bell-icon" } as React.SVGProps<SVGSVGElement>);
    expect(container.querySelector("[data-testid='bell-icon']")).toBeInTheDocument();
  });

  it("forwards a custom width and height", () => {
    const { container } = renderBell({ width: 20, height: 28 });
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "28");
  });

  it("forwards an aria-label when provided", () => {
    const { container } = renderBell({ "aria-label": "Notifications" });
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-label",
      "Notifications",
    );
  });

  it("forwards role when provided", () => {
    const { container } = renderBell({ role: "img" });
    expect(container.querySelector("svg")).toHaveAttribute("role", "img");
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("IconBell — accessibility", () => {
  it("is queryable as an img when given role='img' and aria-label", () => {
    renderBell({ role: "img", "aria-label": "You have new notifications" });
    expect(
      screen.getByRole("img", { name: "You have new notifications" }),
    ).toBeInTheDocument();
  });

  it("can be hidden from assistive technology via aria-hidden", () => {
    const { container } = renderBell({ "aria-hidden": true });
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("does not expose any implicit accessible role by default (decorative usage)", () => {
    // Without an explicit role or aria-label the icon carries no landmark;
    // screen-readers see it as presentational content.
    const { container } = renderBell();
    const svg = container.querySelector("svg")!;
    expect(svg).not.toHaveAttribute("role");
    expect(svg).not.toHaveAttribute("aria-label");
  });
});

// ---------------------------------------------------------------------------
// Multiple instances (regression guard)
// ---------------------------------------------------------------------------

describe("IconBell — multiple instances", () => {
  it("renders two independent icons without DOM conflicts", () => {
    const { container } = render(
      <>
        <IconBell data-testid="bell-1" />
        <IconBell data-testid="bell-2" />
      </>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});
