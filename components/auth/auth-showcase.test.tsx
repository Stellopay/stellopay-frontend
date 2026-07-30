import { render, screen } from "@testing-library/react";
import { AuthShowcase } from "./auth-showcase";
import { describe, it, expect } from "vitest"; // Adjust import if using jest instead of vitest

describe("AuthShowcase", () => {
  it("renders the title and description correctly", () => {
    render(
      <AuthShowcase
        title="Test Title"
        description="Test Description"
        imagePosition="left"
      />
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("applies the dark mode gradient token for text contrast", () => {
    const { container } = render(
      <AuthShowcase
        title="Contrast Test"
        description="Checking gradient overlay"
        imagePosition="right"
      />
    );
    // The text wrapper div contains the specific tailwind classes for the gradient overlay
    const textWrapper = screen.getByText("Contrast Test").closest("div");
    expect(textWrapper).toHaveClass("dark:bg-gradient-to-b");
    expect(textWrapper).toHaveClass("dark:from-black/80");
  });
});
