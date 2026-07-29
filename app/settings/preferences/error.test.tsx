import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsPreferencesError from "@/app/settings/preferences/error";

function buildError(overrides: { digest?: string; message?: string } = {}) {
  const err = new Error(overrides.message ?? "boom") as Error & {
    digest?: string;
  };
  if (overrides.digest !== undefined) {
    err.digest = overrides.digest;
  }
  return err;
}

describe("SettingsPreferencesError boundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("renders an alert region with an accessible heading", () => {
    render(<SettingsPreferencesError error={buildError()} reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it('"Try again" invokes the reset handler', () => {
    const reset = vi.fn();
    render(<SettingsPreferencesError error={buildError()} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the digest and keeps it out of the rendered output", () => {
    const error = buildError({ digest: "prefs-abc123" });
    render(<SettingsPreferencesError error={error} reset={vi.fn()} />);

    expect(screen.getByText("prefs-abc123")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/settings/preferences/error] uncaught settings preferences route error",
      { digest: "prefs-abc123" },
    );
  });

  it("shows the event ID placeholder when digest is present", () => {
    render(
      <SettingsPreferencesError error={buildError({ digest: "prefs-digest" })} reset={vi.fn()} />,
    );
    expect(screen.getByText("prefs-digest")).toBeInTheDocument();
  });

  it("shows a dash placeholder when no digest is provided", () => {
    render(
      <SettingsPreferencesError error={buildError({ digest: undefined })} reset={vi.fn()} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the report-issue link pointing to /help/support", () => {
    render(<SettingsPreferencesError error={buildError()} reset={vi.fn()} />);
    const link = screen.getByRole("link", { name: /report this issue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/help/support");
  });

  it("still renders and logs when no digest is provided", () => {
    render(
      <SettingsPreferencesError error={buildError({ digest: undefined })} reset={vi.fn()} />,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[app/settings/preferences/error] uncaught settings preferences route error",
      { digest: "no-digest" },
    );
  });

  it("shows the underlying error message in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "development");

    render(
      <SettingsPreferencesError
        error={buildError({ message: "stack-revealing detail" })}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("settings-preferences-error-dev-details"),
    ).toHaveTextContent("stack-revealing detail");
  });

  it("does not render the underlying error message in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <SettingsPreferencesError
        error={buildError({ message: "should-never-render" })}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId("settings-preferences-error-dev-details"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/should-never-render/)).not.toBeInTheDocument();
  });

  it("renders a user-friendly description", () => {
    render(<SettingsPreferencesError error={buildError()} reset={vi.fn()} />);
    expect(
      screen.getByText(/while loading your preferences/i),
    ).toBeInTheDocument();
  });

  it("catches errors without crashing sibling routes (no thrown exception during render)", () => {
    expect(() =>
      render(<SettingsPreferencesError error={buildError()} reset={vi.fn()} />),
    ).not.toThrow();
  });
});
