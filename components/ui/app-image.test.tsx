import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppImage } from "./app-image";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

describe("AppImage", () => {
  it("renders informative image with alt text and explicit dimensions from category", () => {
    render(
      <AppImage
        src="/test-card.jpg"
        alt="Feature card preview"
        category="card"
      />,
    );

    const img = screen.getByAltText("Feature card preview");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "400");
    expect(img).toHaveAttribute("height", "200");
    expect(img).not.toHaveAttribute("aria-hidden");
  });

  it("renders decorative image with empty alt and aria-hidden", () => {
    const { container } = render(
      <AppImage
        src="/decorative-icon.svg"
        isDecorative
        category="icon"
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
    expect(img).toHaveAttribute("width", "24");
    expect(img).toHaveAttribute("height", "24");
  });

  it("respects explicit width, height and priority overrides", () => {
    render(
      <AppImage
        src="/logo.png"
        alt="StelloPay Brand"
        width={180}
        height={48}
        priority
      />,
    );

    const img = screen.getByAltText("StelloPay Brand");
    expect(img).toHaveAttribute("width", "180");
    expect(img).toHaveAttribute("height", "48");
  });

  it("renders with skeleton wrapper when showSkeleton is true", () => {
    const { container } = render(
      <AppImage
        src="/large-hero.jpg"
        alt="Hero illustration"
        category="hero"
        showSkeleton
      />,
    );

    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).not.toBeNull();
  });
});
