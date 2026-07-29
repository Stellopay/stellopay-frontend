import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EnterpriseSolutionSection from "./enterprise-section";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

describe("EnterpriseSolutionSection", () => {
  it("renders the enterprise section with heading and description", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/enterprise-ready/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/blockchain solution/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/StelloPay is built for scale/i),
    ).toBeInTheDocument();
  });

  it("renders all four enterprise features", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/Advanced API integration/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Custom payment workflows/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dedicated account manager/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Priority support/i),
    ).toBeInTheDocument();
  });

  it("renders all four stat cards with values", () => {
    render(<EnterpriseSolutionSection />);

    expect(screen.getByText("2.5M+")).toBeInTheDocument();
    expect(screen.getByText("150+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("24/7")).toBeInTheDocument();
  });

  it("renders Contact Sales CTA link", () => {
    render(<EnterpriseSolutionSection />);

    const cta = screen.getByRole("link", {
      name: /contact sales/i,
    });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "#");
  });

  it("has correct ARIA attributes on the section", () => {
    render(<EnterpriseSolutionSection />);

    const section = screen.getByRole("region", { name: /enterprise statistics/i });
    expect(section).toBeInTheDocument();
  });

  it("renders decorative check-mark images for each feature", () => {
    render(<EnterpriseSolutionSection />);

    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(4);
  });
});
