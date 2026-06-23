import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "./error-state";

describe("ErrorState Component", () => {
  it("renders with required props and accessibility roles", () => {
    render(<ErrorState title="Error Title" description="Error Description" />);
    
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");
    
    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error Description")).toBeInTheDocument();
    // Default icon (hidden from screen readers) should be present
    expect(document.querySelector("svg")).toBeInTheDocument();
    // Try Again button should NOT be rendered
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("renders retry button and handles click when onRetry is provided", () => {
    const onRetryMock = vi.fn();
    render(
      <ErrorState
        title="Network Error"
        description="Could not connect to the server."
        onRetry={onRetryMock}
      />
    );
    
    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom icon when provided", () => {
    render(
      <ErrorState
        title="Custom Icon"
        description="Testing custom icon"
        icon={<div data-testid="custom-icon">Icon</div>}
      />
    );
    
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
