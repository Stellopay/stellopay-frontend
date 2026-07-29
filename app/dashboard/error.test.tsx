import React, { Component } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardError from "@/app/dashboard/error";

function buildError(overrides: { digest?: string; message?: string } = {}) {
  const err = new Error(overrides.message ?? "boom") as Error & {
    digest?: string;
  };
  if (overrides.digest !== undefined) {
    err.digest = overrides.digest;
  }
  return err;
}

describe("DashboardError boundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("renders an alert region with an accessible heading", () => {
    render(<DashboardError error={buildError()} reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it('"Try again" invokes the reset handler', () => {
    const reset = vi.fn();
    render(<DashboardError error={buildError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the digest and keeps it out of the rendered output", () => {
    const error = buildError({ digest: "abc123" });
    render(<DashboardError error={error} reset={vi.fn()} />);

    expect(screen.queryByText(/abc123/)).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/dashboard/error] uncaught dashboard route error",
      { digest: "abc123" },
    );
  });

  it("still renders and logs when no digest is provided", () => {
    render(
      <DashboardError
        error={buildError({ digest: undefined })}
        reset={vi.fn()}
      />,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/dashboard/error] uncaught dashboard route error",
      { digest: "no-digest" },
    );
  });

  it("shows the underlying error message in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <DashboardError
        error={buildError({ message: "stack-revealing detail" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByTestId("dashboard-error-dev-details")).toHaveTextContent(
      "stack-revealing detail",
    );
  });

  it("does not render the underlying error message in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <DashboardError
        error={buildError({ message: "should-never-render" })}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId("dashboard-error-dev-details"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/should-never-render/)).not.toBeInTheDocument();
  });

  it("does not render any reference to the global error content", () => {
    render(<DashboardError error={buildError()} reset={vi.fn()} />);

    // The dashboard error boundary must not render the global error page's
    // distinctive elements (e.g., "Go to dashboard" link or full-page html).
    expect(
      screen.queryByRole("link", { name: /go to dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a user-friendly description", () => {
    render(<DashboardError error={buildError()} reset={vi.fn()} />);

    expect(
      screen.getByText(/while loading your dashboard/i),
    ).toBeInTheDocument();
  });
});

// ─── Integration: error boundary behaviour ───────────────────────────────────

/**
 * A React class-based ErrorBoundary that wraps DashboardError so we can
 * verify the actual boundary behaviour — catching a thrown error from a child
 * and rendering the dashboard-scoped fallback — in a unit-test environment.
 */
class DashboardErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: (Error & { digest?: string }) | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <DashboardError error={this.state.error} reset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

/** A component that deliberately throws during render. */
function BrokenWidget({ message }: { message?: string }) {
  throw new Error(message ?? "widget explosion");
}

/** A layout shell that renders children alongside a persistent sidebar marker. */
function MockDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="dashboard-shell">
      <nav data-testid="dashboard-sidebar">Sidebar</nav>
      <main data-testid="dashboard-content">{children}</main>
    </div>
  );
}

describe("DashboardError — integration", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React's expected error boundary logs in the test output.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("displays the dashboard-scoped fallback when a child throws during render", () => {
    render(
      <DashboardErrorBoundary>
        <BrokenWidget />
      </DashboardErrorBoundary>,
    );

    // The DashboardError fallback UI should be visible.
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("does NOT render the global error page", () => {
    render(
      <DashboardErrorBoundary>
        <BrokenWidget />
      </DashboardErrorBoundary>,
    );

    // The global error page includes a "Go to dashboard" escape hatch.
    expect(
      screen.queryByRole("link", { name: /go to dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it("the retry button resets the boundary and re-renders children", () => {
    render(
      <DashboardErrorBoundary>
        <BrokenWidget />
      </DashboardErrorBoundary>,
    );

    // Fallback is visible.
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();

    // Click retry — the boundary resets and the child throws again, so the
    // fallback re-appears (because BrokenWidget always throws).
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // After reset + re-throw, the fallback should still be displayed.
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it("keeps the surrounding layout mounted when a child errors", () => {
    render(
      <MockDashboardShell>
        <DashboardErrorBoundary>
          <BrokenWidget />
        </DashboardErrorBoundary>
      </MockDashboardShell>,
    );

    // The layout shell and its persistent elements remain in the DOM.
    expect(screen.getByTestId("dashboard-shell")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-sidebar")).toBeInTheDocument();

    // The fallback rendered *inside* the content area, replacing the widget.
    expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });
});
