import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders a branded 404 heading and explanatory copy", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stellopay")).toBeInTheDocument();
    expect(
      screen.getByText(/The route you tried to open does not exist/i),
    ).toBeInTheDocument();
  });

  it("links keyboard users back to the landing page and dashboard", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
