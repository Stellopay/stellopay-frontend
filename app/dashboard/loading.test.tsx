import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Loading from "./loading";

describe("Dashboard loading fallback", () => {
  it("exposes an accessible busy status region", () => {
    render(<Loading />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("provides an sr-only label for screen readers", () => {
    render(<Loading />);
    expect(screen.getByText("Loading dashboard")).toHaveClass("sr-only");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Loading />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
