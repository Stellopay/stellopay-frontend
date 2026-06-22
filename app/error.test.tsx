import { fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import React from "react";

import GlobalError from "@/app/error";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

function buildError(overrides: { digest?: string; message?: string } = {}) {
  const err = new Error(overrides.message ?? "boom") as Error & {
    digest?: string;
  };
  if (overrides.digest !== undefined) {
    err.digest = overrides.digest;
  }
  return err;
}

describe("GlobalError boundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("renders an alert region with an accessible heading", () => {
    render(<GlobalError error={buildError()} reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it('"Try again" invokes the reset handler', () => {
    const reset = vi.fn();
    render(<GlobalError error={buildError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers an escape hatch back to /dashboard", () => {
    render(<GlobalError error={buildError()} reset={vi.fn()} />);

    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("logs the digest and keeps it out of the rendered output", () => {
    const error = buildError({ digest: "abc123" });
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.queryByText(/abc123/)).not.toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/error] uncaught route error",
      { digest: "abc123" },
    );
  });

  it("still renders and logs when no digest is provided", () => {
    render(
      <GlobalError error={buildError({ digest: undefined })} reset={vi.fn()} />,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/error] uncaught route error",
      { digest: "no-digest" },
    );
  });

  it("shows the underlying error message in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <GlobalError
        error={buildError({ message: "stack-revealing detail" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.getByTestId("error-dev-details")).toHaveTextContent(
      "stack-revealing detail",
    );
  });

  it("does not render the underlying error message in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <GlobalError
        error={buildError({ message: "should-never-render" })}
        reset={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("error-dev-details")).not.toBeInTheDocument();
    expect(screen.queryByText(/should-never-render/)).not.toBeInTheDocument();
  });
});
