import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ScopedErrorBoundary,
  deriveCorrelationToken,
  redactSecretKey,
} from "./scoped-error-boundary";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * A child component that renders normally. Replace with ThrowingChild below
 * to simulate a render failure.
 */
function HealthyChild({ label = "healthy content" }: { label?: string }) {
  return <div data-testid="healthy-child">{label}</div>;
}

/**
 * Throws unconditionally in render to trip the error boundary.
 */
function ThrowingChild({ message = "boom" }: { message?: string }) {
  throw new Error(message);
}

/**
 * Controlled component: throws when `shouldThrow` is true.
 */
function ToggleChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("controlled throw");
  return <div data-testid="toggle-child">ok</div>;
}

/**
 * Render a boundary wrapping a ThrowingChild and swallow the expected console
 * errors so the test output stays clean.
 */
function renderWithError(
  props: Partial<React.ComponentProps<typeof ScopedErrorBoundary>> & {
    errorMessage?: string;
  } = {},
) {
  const {
    scope = "test-scope",
    fallbackHref,
    fallbackLabel,
    resetKeys,
    diagnosticId,
    errorMessage = "boom",
  } = props;

  return render(
    <ScopedErrorBoundary
      scope={scope}
      fallbackHref={fallbackHref}
      fallbackLabel={fallbackLabel}
      resetKeys={resetKeys}
      diagnosticId={diagnosticId}
    >
      <ThrowingChild message={errorMessage} />
    </ScopedErrorBoundary>,
  );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("ScopedErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress the expected React error-boundary noise so test output is clean.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  // -------------------------------------------------------------------------
  // Happy path — no error
  // -------------------------------------------------------------------------

  describe("when no error occurs", () => {
    it("renders children normally", () => {
      render(
        <ScopedErrorBoundary scope="test">
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
    });

    it("does not render the fallback UI", () => {
      render(
        <ScopedErrorBoundary scope="test">
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      expect(
        screen.queryByRole("alert"),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Error state — fallback UI
  // -------------------------------------------------------------------------

  describe("when a render error is caught", () => {
    it("shows an accessible alert region", () => {
      renderWithError();

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders 'Something went wrong' heading inside the fallback", () => {
      renderWithError();

      expect(
        screen.getByRole("heading", { name: /something went wrong/i }),
      ).toBeInTheDocument();
    });

    it("renders a 'Try again' button", () => {
      renderWithError();

      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();
    });

    it("renders the fallback navigation link with the configured href", () => {
      renderWithError({ fallbackHref: "/dashboard", fallbackLabel: "Back to dashboard" });

      const link = screen.getByRole("link", { name: /back to dashboard/i });
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("uses default fallback href (/dashboard) and label when none supplied", () => {
      renderWithError();

      const link = screen.getByRole("link", { name: /go to dashboard/i });
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("does not render children in the error state", () => {
      renderWithError();

      expect(screen.queryByTestId("healthy-child")).not.toBeInTheDocument();
    });

    it("shows the correlation token in the fallback", () => {
      renderWithError({ scope: "dashboard", errorMessage: "boom" });

      const tokenEl = screen.getByTestId("scoped-error-correlation");
      expect(tokenEl).toBeInTheDocument();
      expect(tokenEl.textContent).toMatch(/Reference ID:/);
      expect(tokenEl.textContent).toMatch(/dashboard-/);
    });

    it("uses the diagnosticId prop instead of the derived token when provided", () => {
      renderWithError({ diagnosticId: "custom-id-abc" });

      expect(
        screen.getByTestId("scoped-error-correlation"),
      ).toHaveTextContent("custom-id-abc");
    });
  });

  // -------------------------------------------------------------------------
  // Production vs development: dev-detail visibility
  // -------------------------------------------------------------------------

  describe("production / development detail visibility", () => {
    it("does NOT render the error message in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      renderWithError({ errorMessage: "secret-detail" });

      expect(
        screen.queryByTestId("scoped-error-dev-details"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("secret-detail")).not.toBeInTheDocument();
    });

    it("renders the error message in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      renderWithError({ errorMessage: "local-dev-detail" });

      expect(
        screen.getByTestId("scoped-error-dev-details"),
      ).toHaveTextContent("local-dev-detail");
    });
  });

  // -------------------------------------------------------------------------
  // "Try again" reset
  // -------------------------------------------------------------------------

  describe('"Try again" button', () => {
    it("clears the error state and re-renders children when clicked", async () => {
      // We need a controllable child to flip to non-throwing after reset.
      let shouldThrow = true;

      function FlipChild() {
        if (shouldThrow) throw new Error("initial error");
        return <div data-testid="flipped-child">recovered</div>;
      }

      const { rerender } = render(
        <ScopedErrorBoundary scope="test">
          <FlipChild />
        </ScopedErrorBoundary>,
      );

      // Fallback is shown.
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Stop throwing before the reset so the re-render succeeds.
      shouldThrow = false;

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("flipped-child")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Reset keys — automatic boundary clear on prop change
  // -------------------------------------------------------------------------

  describe("resetKeys", () => {
    it("clears the error when a resetKey value changes", async () => {
      const { rerender } = render(
        <ScopedErrorBoundary scope="test" resetKeys={["account-A"]}>
          <ThrowingChild />
        </ScopedErrorBoundary>,
      );

      // Boundary has tripped.
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Simulate account switch: rerender with a healthy child and new resetKey.
      rerender(
        <ScopedErrorBoundary scope="test" resetKeys={["account-B"]}>
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("healthy-child")).toBeInTheDocument();
    });

    it("does NOT clear the error when resetKeys values are unchanged", () => {
      const { rerender } = render(
        <ScopedErrorBoundary scope="test" resetKeys={["account-A"]}>
          <ThrowingChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Same key value — boundary should stay in error state.
      rerender(
        <ScopedErrorBoundary scope="test" resetKeys={["account-A"]}>
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("handles a null resetKey in the array without throwing", () => {
      const { rerender } = render(
        <ScopedErrorBoundary scope="test" resetKeys={[null]}>
          <ThrowingChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Changing null → a real address resets the boundary.
      rerender(
        <ScopedErrorBoundary
          scope="test"
          resetKeys={["GABC1234EFGH5678"]}
        >
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("handles an empty resetKeys array without throwing", () => {
      renderWithError({ resetKeys: [] });

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("handles resetKeys with multiple entries", async () => {
      const { rerender } = render(
        <ScopedErrorBoundary scope="test" resetKeys={["A", "page-1"]}>
          <ThrowingChild />
        </ScopedErrorBoundary>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Only the second key changes.
      rerender(
        <ScopedErrorBoundary scope="test" resetKeys={["A", "page-2"]}>
          <HealthyChild />
        </ScopedErrorBoundary>,
      );

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Error logging
  // -------------------------------------------------------------------------

  describe("error logging", () => {
    it("logs scope and correlation token — never the raw error message", () => {
      renderWithError({ scope: "dashboard", errorMessage: "raw-sensitive-message" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ScopedErrorBoundary] uncaught error in scope",
        expect.objectContaining({
          scope: "dashboard",
          correlationToken: expect.stringMatching(/^dashboard-[0-9a-f]{8}$/),
        }),
      );

      // The raw message must never appear in the log call arguments.
      const calls = consoleErrorSpy.mock.calls;
      const ourCall = calls.find(
        (args) =>
          typeof args[0] === "string" &&
          args[0].includes("[ScopedErrorBoundary]"),
      );
      expect(ourCall).toBeDefined();
      const serialised = JSON.stringify(ourCall);
      expect(serialised).not.toContain("raw-sensitive-message");
    });

    it("uses the diagnosticId prop as the logged correlationToken", () => {
      renderWithError({ scope: "test", diagnosticId: "override-id-xyz" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ScopedErrorBoundary] uncaught error in scope",
        expect.objectContaining({
          correlationToken: "override-id-xyz",
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Safe fallback navigation — no secret key in href
  // -------------------------------------------------------------------------

  describe("safe fallback navigation", () => {
    it("renders the fallback link as a plain path with no query params", () => {
      renderWithError({ fallbackHref: "/dashboard" });

      const link = screen.getByRole("link", { name: /go to dashboard/i });
      const href = link.getAttribute("href") ?? "";

      // Must be a clean path — no ?, #, or raw key material injected.
      expect(href).toBe("/dashboard");
      expect(href).not.toContain("?");
      expect(href).not.toContain("address");
      expect(href).not.toContain("key");
    });

    it("respects a custom fallbackHref without leaking account state", () => {
      renderWithError({
        fallbackHref: "/account-summary",
        fallbackLabel: "Back to account",
      });

      const link = screen.getByRole("link", { name: /back to account/i });
      expect(link).toHaveAttribute("href", "/account-summary");
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe("accessibility", () => {
    it("uses role=alert on the fallback container", () => {
      renderWithError();

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("uses aria-live=assertive on the fallback container", () => {
      renderWithError();

      expect(screen.getByRole("alert")).toHaveAttribute(
        "aria-live",
        "assertive",
      );
    });

    it("renders the heading as an h2 inside the fallback", () => {
      renderWithError();

      const heading = screen.getByRole("heading", {
        name: /something went wrong/i,
        level: 2,
      });
      expect(heading).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Scope isolation — boundary does not bleed into sibling trees
  // -------------------------------------------------------------------------

  describe("scope isolation", () => {
    it("does not trip a sibling boundary when only one child throws", () => {
      render(
        <div>
          <ScopedErrorBoundary scope="left">
            <ThrowingChild />
          </ScopedErrorBoundary>
          <ScopedErrorBoundary scope="right">
            <HealthyChild label="right sibling" />
          </ScopedErrorBoundary>
        </div>,
      );

      // Left boundary shows fallback.
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // Right sibling still renders normally.
      expect(screen.getByText("right sibling")).toBeInTheDocument();
    });
  });
});

  // -------------------------------------------------------------------------
  // Offline behavior
  // -------------------------------------------------------------------------

  describe("offline behavior", () => {
    let onlineSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      onlineSpy = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    });

    afterEach(() => {
      onlineSpy.mockRestore();
    });

    it("shows the fallback (not a blank screen) when a render error occurs while offline", () => {
      // Simulate the browser being offline.
      onlineSpy.mockReturnValue(false);

      renderWithError({ errorMessage: "fetch failed" });

      // The fallback must be visible — no blank screen.
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /something went wrong/i }),
      ).toBeInTheDocument();
    });

    it("still shows Try again and navigation link when offline", () => {
      onlineSpy.mockReturnValue(false);

      renderWithError();

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it("allows retry after coming back online — clears error when Try again is clicked and child no longer throws", async () => {
      onlineSpy.mockReturnValue(false);

      let shouldThrow = true;

      function NetworkChild() {
        if (shouldThrow) throw new Error("network failure");
        return <div data-testid="network-child">online</div>;
      }

      render(
        <ScopedErrorBoundary scope="test">
          <NetworkChild />
        </ScopedErrorBoundary>,
      );

      // Boundary is tripped while offline.
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Simulate coming back online and a successful re-render.
      onlineSpy.mockReturnValue(true);
      shouldThrow = false;

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
      expect(screen.getByTestId("network-child")).toBeInTheDocument();
    });

    it("does not expose navigator.onLine state in the rendered correlation token", () => {
      onlineSpy.mockReturnValue(false);

      renderWithError({ scope: "dashboard" });

      const tokenEl = screen.getByTestId("scoped-error-correlation");
      // Token must be the standard format — no "offline" string injected.
      expect(tokenEl.textContent).toMatch(/dashboard-[0-9a-f]{8}/);
      expect(tokenEl.textContent).not.toContain("offline");
      expect(tokenEl.textContent).not.toContain("onLine");
    });
  });

// ---------------------------------------------------------------------------
// Unit tests for pure helper functions
// ---------------------------------------------------------------------------

describe("deriveCorrelationToken", () => {
  it("returns a token with the scope prefix", () => {
    const token = deriveCorrelationToken("dashboard", new Error("boom"));
    expect(token).toMatch(/^dashboard-[0-9a-f]{8}$/);
  });

  it("is deterministic for the same scope and error message", () => {
    const err = new Error("same-message");
    expect(deriveCorrelationToken("test", err)).toBe(
      deriveCorrelationToken("test", err),
    );
  });

  it("produces different tokens for different error messages", () => {
    const t1 = deriveCorrelationToken("test", new Error("alpha"));
    const t2 = deriveCorrelationToken("test", new Error("beta"));
    expect(t1).not.toBe(t2);
  });

  it("produces different tokens for different scopes", () => {
    const err = new Error("same");
    const t1 = deriveCorrelationToken("scopeA", err);
    const t2 = deriveCorrelationToken("scopeB", err);
    expect(t1).not.toBe(t2);
  });

  it("handles an error with no message without throwing", () => {
    const err = new Error();
    expect(() => deriveCorrelationToken("test", err)).not.toThrow();
  });

  it("does not include the raw error message in the returned token", () => {
    const sensitiveMessage = "secret-detail-xyz";
    const token = deriveCorrelationToken("test", new Error(sensitiveMessage));
    expect(token).not.toContain(sensitiveMessage);
  });
});

describe("redactSecretKey", () => {
  it("redacts a valid Stellar secret key (S + 55 base32 chars)", () => {
    // Valid Stellar secret key format: S followed by exactly 55 base32 chars
    const secretKey = "S" + "A".repeat(55);
    expect(redactSecretKey(secretKey)).toBe("[REDACTED_SECRET_KEY]");
  });

  it("does not redact a public G-address", () => {
    const publicAddress = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";
    expect(redactSecretKey(publicAddress)).toBe(publicAddress);
  });

  it("does not redact a plain string that is not a secret key", () => {
    const plain = "some random string";
    expect(redactSecretKey(plain)).toBe(plain);
  });

  it("does not redact an S-prefixed string that is too short", () => {
    const short = "SABC";
    expect(redactSecretKey(short)).toBe(short);
  });

  it("does not redact an S-prefixed string with lowercase chars", () => {
    const mixed = "S" + "a".repeat(55);
    // base32 is uppercase A-Z and 2-7 only; lowercase is not a valid secret key.
    expect(redactSecretKey(mixed)).toBe(mixed);
  });

  it("handles an empty string without throwing", () => {
    expect(() => redactSecretKey("")).not.toThrow();
    expect(redactSecretKey("")).toBe("");
  });
});
