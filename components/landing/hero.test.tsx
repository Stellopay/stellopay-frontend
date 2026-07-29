import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "./hero";

describe("Landing Hero Typography Tokens (#764)", () => {
  it("applies tokenized display typography utility classes to primary hero heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    
    expect(heading).toBeDefined();
    expect(heading.className).toContain("text-display-2xl");
  });

  it("applies body-lg typography utility class to subtitle copy", () => {
    render(<Hero />);
    const subtext = screen.getByTestId("hero-subtext");
    
    expect(subtext.className).toContain("text-body-lg");
  });
});
