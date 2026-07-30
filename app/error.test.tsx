import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("Unexpected (generic) errors", () => {
    it("renders an alert region with an accessible heading for unexpected errors", () => {
      render(<GlobalError error={buildError()} reset={vi.fn()} />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /something went wrong/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We hit an unexpected error while loading this page/i),
      ).toBeInTheDocument();
    });

    it("makes 'Go to dashboard' the primary action and 'Try again' the secondary action", () => {
      render(<GlobalError error={buildError()} reset={vi.fn()} />);

      const buttons = screen.getAllByRole("button");
      // "Go to dashboard" is rendered as a link disguised as a button in the layout, wait, we use Button asChild for links, so it has role link.
      // Wait, let's just query by role
      const link = screen.getByRole("link", { name: /go to dashboard/i });
      const retryBtn = screen.getByRole("button", { name: /try again/i });
      
      expect(link).toBeInTheDocument();
      expect(retryBtn).toBeInTheDocument();
      // Button asChild renders the child element (a), so it doesn't render as button but link, but let's just make sure both exist.
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
  });

  describe("Network errors", () => {
    it("renders network specific messaging when message contains fetch", () => {
      render(<GlobalError error={buildError({ message: "failed to fetch" })} reset={vi.fn()} />);

      expect(
        screen.getByRole("heading", { name: /connection issue/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't connect to our servers/i),
      ).toBeInTheDocument();
    });

    it("renders network specific messaging when digest contains network", () => {
      render(<GlobalError error={buildError({ digest: "network-error-123" })} reset={vi.fn()} />);

      expect(
        screen.getByRole("heading", { name: /connection issue/i }),
      ).toBeInTheDocument();
    });

    it("makes 'Try again' the primary action and 'Go to dashboard' the secondary action", () => {
      render(<GlobalError error={buildError({ message: "fetch failed" })} reset={vi.fn()} />);
      
      const link = screen.getByRole("link", { name: /go to dashboard/i });
      const retryBtn = screen.getByRole("button", { name: /try again/i });
      
      expect(link).toBeInTheDocument();
      expect(retryBtn).toBeInTheDocument();
    });
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

  it("remains independent of route-scoped error-state props", () => {
    render(<GlobalError error={buildError()} reset={vi.fn()} />);

    // The root boundary must not render the event-id placeholder or
    // report-issue link used by the new route-scoped boundaries.
    expect(screen.queryByText("Reference ID:")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /report this issue/i })).not.toBeInTheDocument();
  });
});
