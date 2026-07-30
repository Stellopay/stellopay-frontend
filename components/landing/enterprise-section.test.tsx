import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EnterpriseSolutionSection from "./enterprise-section";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

describe("EnterpriseSolutionSection", () => {
  it("renders the enterprise section with heading", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/enterprise-ready/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Stellar-powered payments/i),
    ).toBeInTheDocument();
  });

  it("references the Stellar network in the description", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/Stellar network/i),
    ).toBeInTheDocument();
  });

  it("quotes concrete Stellar network metrics in the description", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/3–5 seconds/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/\$0\.001/),
    ).toBeInTheDocument();
  });

  it("mentions multi-asset support in the description", () => {
    render(<EnterpriseSolutionSection />);

    const matches = screen.getAllByText(/USDC, XLM/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("mentions Stellar anchors in the description", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/Stellar anchors/i),
    ).toBeInTheDocument();
  });

  it("renders all four enterprise features with Stellar-specific copy", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.getByText(/Horizon API/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/anchor rails/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Multi-asset settlement/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/USDC, XLM/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3-second transaction finality/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dedicated enterprise support/i),
    ).toBeInTheDocument();
  });

  it("does not contain the old generic copy", () => {
    render(<EnterpriseSolutionSection />);

    expect(
      screen.queryByText(/built for scale/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Advanced API integration/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Custom payment workflows/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Dedicated account manager/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Priority support/i),
    ).not.toBeInTheDocument();
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
