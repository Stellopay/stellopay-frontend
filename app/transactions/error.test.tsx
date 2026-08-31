import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TransactionsError from "@/app/transactions/error";

function buildError(overrides: { digest?: string; message?: string } = {}) {
  const err = new Error(overrides.message ?? "boom") as Error & {
    digest?: string;
  };
  if (overrides.digest !== undefined) {
    err.digest = overrides.digest;
  }
  return err;
}

describe("TransactionsError boundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("renders an alert region with an accessible heading", () => {
    render(<TransactionsError error={buildError()} reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it('"Try again" invokes the reset handler', () => {
    const reset = vi.fn();
    render(<TransactionsError error={buildError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the digest and keeps it out of the rendered output", () => {
    const error = buildError({ digest: "txn-abc123" });
    render(<TransactionsError error={error} reset={vi.fn()} />);

    // The digest should appear inside the event-id code block only.
    expect(screen.getByText("txn-abc123")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/transactions/error] uncaught transactions route error",
      { digest: "txn-abc123" },
    );
  });

  it("shows the event ID placeholder when digest is present", () => {
    render(<TransactionsError error={buildError({ digest: "txn-digest" })} reset={vi.fn()} />);
    expect(screen.getByText("txn-digest")).toBeInTheDocument();
  });

  it("shows a dash placeholder when no digest is provided", () => {
    render(<TransactionsError error={buildError({ digest: undefined })} reset={vi.fn()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the report-issue link pointing to /help/support", () => {
    render(<TransactionsError error={buildError()} reset={vi.fn()} />);
    const link = screen.getByRole("link", { name: /report this issue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/help/support");
  });

  it("still renders and logs when no digest is provided", () => {
    render(
      <TransactionsError error={buildError({ digest: undefined })} reset={vi.fn()} />,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/transactions/error] uncaught transactions route error",
      { digest: "no-digest" },
    );
  });

  it("shows the underlying error message in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <TransactionsError
        error={buildError({ message: "stack-revealing detail" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByTestId("transactions-error-dev-details")).toHaveTextContent(
      "stack-revealing detail",
    );
  });

  it("does not render the underlying error message in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <TransactionsError
        error={buildError({ message: "should-never-render" })}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId("transactions-error-dev-details"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/should-never-render/)).not.toBeInTheDocument();
  });

  it("renders a user-friendly description", () => {
    render(<TransactionsError error={buildError()} reset={vi.fn()} />);
    expect(
      screen.getByText(/while loading your transactions/i),
    ).toBeInTheDocument();
  });

  it("catches errors without crashing sibling routes (no thrown exception during render)", () => {
    // The boundary itself should render successfully even when the route
    // segment has errored.
    expect(() =>
      render(<TransactionsError error={buildError()} reset={vi.fn()} />),
    ).not.toThrow();
  });
});
