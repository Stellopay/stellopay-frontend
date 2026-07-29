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
