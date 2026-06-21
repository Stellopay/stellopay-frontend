import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorState from "./error-state";

describe("ErrorState", () => {
  it("renders accessible friendly error copy", () => {
    render(
      <ErrorState
        title="Unable to load transactions"
        description="Refresh the data and try again."
      />,
    );

    expect(screen.getByRole("alert")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
    expect(screen.getByText("Unable to load transactions")).toBeInTheDocument();
    expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();
  });

  it("calls the optional retry action", () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Unable to load transactions"
        description="Refresh the data and try again."
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
