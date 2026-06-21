import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RootError from "./error";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeError() {
  const error = new Error("database connection leaked");
  return Object.assign(error, {
    digest: "route-digest-123",
    stack: "secret stack trace",
  });
}

describe("RootError", () => {
  it("renders an accessible route error boundary", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<RootError error={makeError()} reset={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /we could not load this page/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("calls reset when the retry button is clicked", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const reset = vi.fn();

    render(<RootError error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs only the digest and does not render raw error details", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<RootError error={makeError()} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledWith(
      "Route error digest:",
      "route-digest-123",
    );
    expect(screen.queryByText(/database connection leaked/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret stack trace/i)).not.toBeInTheDocument();
  });
});
