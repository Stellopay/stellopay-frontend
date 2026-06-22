import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState Component", () => {
  it("renders with required props and accessibility roles", () => {
    render(<EmptyState title="No Data" description="There is no data to show." />);
    
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
    
    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("There is no data to show.")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders action button and handles click when onRetry is provided", () => {
    const onRetryMock = vi.fn();
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={onRetryMock}
      />
    );
    
    const button = screen.getByRole("button", { name: /clear filters/i });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders custom action label when provided", () => {
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={() => {}}
        actionLabel="Reset Search"
      />
    );
    
    const button = screen.getByRole("button", { name: /reset search/i });
    expect(button).toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(
      <EmptyState
        title="Custom Icon"
        description="Testing custom icon"
        icon={<div data-testid="custom-icon">Icon</div>}
      />
    );
    
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
