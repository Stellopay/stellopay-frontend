import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HelpCTASection from "./help-cta-section";

describe("HelpCTASection", () => {
  it("renders the heading and buttons", () => {
    render(<HelpCTASection />);
    expect(
      screen.getByText("Still have questions? We're here to help"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact support/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /visit help center/i }),
    ).toBeInTheDocument();
  });

  it("has a gradient CTA button with contrast-more fallback classes", () => {
    render(<HelpCTASection />);
    const button = screen.getByRole("button", { name: /contact support/i });
    expect(button.className).toContain("bg-gradient-to-r");
    expect(button.className).toContain("contrast-more:bg-[#5B21B6]");
    expect(button.className).toContain("contrast-more:bg-none");
    expect(button.className).toContain("contrast-more:shadow-none");
    expect(button.className).toContain("contrast-more:hover:opacity-100");
  });

  it("renders the outline button with link", () => {
    render(<HelpCTASection />);
    const link = screen.getByRole("link", { name: /visit help center/i });
    expect(link).toHaveAttribute("href", "/help");
  });
});
