import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "./empty-state";

describe("EmptyState", () => {
  it("renders accessible empty copy", () => {
    render(
      <EmptyState
        title="No transactions found"
        description="Try adjusting your filters."
      />,
    );

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("No transactions found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters.")).toBeInTheDocument();
  });
});
