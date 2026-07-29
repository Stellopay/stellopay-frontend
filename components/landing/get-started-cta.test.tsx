import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GetStartedCTA from "./get-started-cta";

describe("GetStartedCTA", () => {
  it("renders the heading and form", () => {
    render(<GetStartedCTA />);
    expect(screen.getByText("Ready to revolutionize")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your work email"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders trust indicators", () => {
    render(<GetStartedCTA />);
    expect(screen.getByText("Free 14-day trial")).toBeInTheDocument();
    expect(screen.getByText("No credit card required")).toBeInTheDocument();
    expect(screen.getByText("Cancel anytime")).toBeInTheDocument();
  });

  it("has a gradient button with contrast-more fallback classes", () => {
    render(<GetStartedCTA />);
    const button = screen.getByRole("button", { name: /get started/i });
    expect(button.className).toContain("bg-gradient-to-b");
    expect(button.className).toContain("contrast-more:bg-[#5B21B6]");
    expect(button.className).toContain("contrast-more:bg-none");
    expect(button.className).toContain("contrast-more:shadow-none");
  });
});
