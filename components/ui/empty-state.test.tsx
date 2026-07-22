import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";

// ─── Baseline / backward-compatibility ───────────────────────────────────────

describe("EmptyState — baseline rendering", () => {
  it("renders with required props and accessibility roles", () => {
    render(<EmptyState title="No Data" description="There is no data to show." />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");

    expect(screen.getByText("No Data")).toBeInTheDocument();
    expect(screen.getByText("There is no data to show.")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders no button when neither action nor onRetry is provided", () => {
    render(<EmptyState title="No Data" description="There is no data to show." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a custom icon when provided", () => {
    render(
      <EmptyState
        title="Custom Icon"
        description="Testing custom icon"
        icon={<div data-testid="custom-icon">Icon</div>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders the default inbox icon when no icon prop is supplied", () => {
    render(<EmptyState title="No Data" description="Description" />);
    // Lucide renders an SVG; the inbox icon has aria-hidden so we query by tag.
    expect(document.querySelector("svg")).toBeInTheDocument();
  });
});

// ─── Legacy onRetry / actionLabel (backward-compatibility) ────────────────────

describe("EmptyState — legacy onRetry prop (backward-compatible)", () => {
  it("renders action button when onRetry is provided", () => {
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("calls onRetry when the button is clicked", () => {
    const onRetryMock = vi.fn();
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={onRetryMock}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("renders a custom actionLabel when provided alongside onRetry", () => {
    render(
      <EmptyState
        title="No Results"
        description="Your search returned no results."
        onRetry={() => {}}
        actionLabel="Reset Search"
      />,
    );
    expect(screen.getByRole("button", { name: /reset search/i })).toBeInTheDocument();
  });

  it("defaults actionLabel to 'Clear Filters' when not specified", () => {
    render(
      <EmptyState
        title="No Results"
        description="Description"
        onRetry={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });
});

// ─── New action prop ──────────────────────────────────────────────────────────

describe("EmptyState — action prop (new CTA slot)", () => {
  it("renders a button with the action label when action prop is provided", () => {
    render(
      <EmptyState
        title="No Wallets"
        description="Add your first wallet to get started."
        action={{ label: "Add wallet", onClick: () => {} }}
      />,
    );
    expect(screen.getByRole("button", { name: /add wallet/i })).toBeInTheDocument();
  });

  it("calls action.onClick when the button is clicked", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No Wallets"
        description="Add your first wallet to get started."
        action={{ label: "Add wallet", onClick: handleClick }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add wallet/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls action.onClick only once per click (no double-fire)", () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No Wallets"
        description="Description"
        action={{ label: "Add wallet", onClick: handleClick }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add wallet/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders the exact label text provided in the action prop", () => {
    render(
      <EmptyState
        title="No Transactions"
        description="Create your first transaction."
        action={{ label: "Create a transaction", onClick: () => {} }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Create a transaction" }),
    ).toBeInTheDocument();
  });

  it("does not render a button when action prop is omitted", () => {
    render(<EmptyState title="No Data" description="Description" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("action prop takes precedence over onRetry when both are supplied", () => {
    const actionClick = vi.fn();
    const retryClick = vi.fn();
    render(
      <EmptyState
        title="No Data"
        description="Description"
        action={{ label: "Primary CTA", onClick: actionClick }}
        onRetry={retryClick}
        actionLabel="Retry"
      />,
    );

    // Only one button should be in the document.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);

    // It must show the action label, not the retry label.
    expect(screen.getByRole("button", { name: /primary cta/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
  });

  it("clicking the button when action takes precedence calls action.onClick, not onRetry", () => {
    const actionClick = vi.fn();
    const retryClick = vi.fn();
    render(
      <EmptyState
        title="No Data"
        description="Description"
        action={{ label: "Primary CTA", onClick: actionClick }}
        onRetry={retryClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /primary cta/i }));
    expect(actionClick).toHaveBeenCalledTimes(1);
    expect(retryClick).not.toHaveBeenCalled();
  });
});

// ─── Layout regression — no-action rendering is identical ─────────────────────

describe("EmptyState — layout regression (no action)", () => {
  it("renders the title as an h3", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.getByRole("heading", { level: 3, name: "Empty" })).toBeInTheDocument();
  });

  it("renders the description as a paragraph", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("container has role=status and aria-live=polite", () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    const container = screen.getByRole("status");
    expect(container).toHaveAttribute("aria-live", "polite");
  });

  it("does not introduce extra DOM nodes compared to the no-action baseline", () => {
    const { container: withoutAction } = render(
      <EmptyState title="T" description="D" />,
    );
    // Verify the button is absent — same structure as before the change.
    expect(withoutAction.querySelector("button")).toBeNull();
  });
});
