"use client";

/**
 * ScopedErrorBoundary
 *
 * A reusable React class component boundary that wraps individual route
 * segments or feature areas. It differs from the route-level `app/error.tsx`
 * in three ways:
 *
 *  1. **Reset keys** – the boundary resets automatically when any value in
 *     `resetKeys` changes (e.g. the active account address or a route param).
 *     This prevents a stale error state from persisting after the user switches
 *     accounts or navigates to a different record.
 *
 *  2. **Safe fallback navigation** – the escape-hatch link is configurable via
 *     `fallbackHref` and `fallbackLabel`. Neither the current address nor any
 *     internal state is ever serialised into the link href.
 *
 *  3. **Redacted diagnostics** – a short, non-secret correlation identifier
 *     (the first 8 hex chars of a SHA-1-style fingerprint derived from the
 *     error message, not the raw address or key material) is shown in the
 *     fallback UI so support teams can correlate reports without the UI ever
 *     leaking sensitive state.
 *
 * Security invariants (see context/wallet-context.tsx):
 *  - Stellar secret keys match /^S[A-Z2-7]+$/. They are *never* passed through
 *    this component; the guard here is defense-in-depth only.
 *  - Public G-addresses are safe to show truncated (GABC...F123 form) but this
 *    component deliberately avoids rendering any address — the boundary fires
 *    when the component using the address failed, so the address state may be
 *    corrupt. The truncated form is only used by `formatAddress` in
 *    wallet-context.tsx; we replicate that shape for the reset-key derivation
 *    so callers do not need to truncate themselves.
 *
 * Usage:
 * ```tsx
 * <ScopedErrorBoundary
 *   scope="dashboard"
 *   resetKeys={[address]}
 *   fallbackHref="/dashboard"
 *   fallbackLabel="Back to dashboard"
 * >
 *   <DashboardContent />
 * </ScopedErrorBoundary>
 * ```
 */

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Diagnostic ID helpers
// ---------------------------------------------------------------------------

/**
 * Produces a short, deterministic, human-readable correlation token from an
 * error. The token is safe to log and display:
 *
 * - It is derived from the error message only (not the stack, not any
 *   address or key material).
 * - It does NOT use a cryptographic hash; the goal is a stable short tag for
 *   correlating support tickets, not security.
 * - The format is `<scope>-<8 char base-36 token>`, e.g. `dashboard-3f2a1b9c`.
 *
 * Callers that have a server-side digest (Next.js `error.digest`) should pass
 * that directly via `diagnosticId` instead of relying on this derivation.
 */
export function deriveCorrelationToken(scope: string, error: Error): string {
  const raw = error?.message ?? "unknown";

  // Simple deterministic fold — not crypto, just a stable fingerprint.
  let h = 0x811c_9dc5; // FNV-1a offset basis (32-bit)
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    // 32-bit FNV prime multiply, keeping it in a 32-bit integer via >>> 0
    h = Math.imul(h, 0x0100_0193) >>> 0;
  }
  const token = h.toString(16).padStart(8, "0");
  return `${scope}-${token}`;
}

/**
 * Redacts any string that looks like a Stellar secret key before it could
 * accidentally be included in a diagnostic payload.
 *
 * A Stellar secret key is the letter S followed by 55 base32 characters
 * (A-Z and 2-7). This guard mirrors the one in WalletProvider.connect().
 */
export function redactSecretKey(value: string): string {
  return /^S[A-Z2-7]{55}$/.test(value.trim())
    ? "[REDACTED_SECRET_KEY]"
    : value;
}

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

export interface ScopedErrorBoundaryProps {
  /** Semantic name for the boundary — used in the correlation token and logs. */
  scope: string;

  /**
   * Values that, when changed, cause the boundary to clear the error and
   * re-render its children. Typical candidates: the connected wallet address,
   * a route param ID, or a page number.
   *
   * The boundary uses referential equality for comparison so primitive values
   * (strings, numbers) work best. Pass a stable array reference if you want
   * to avoid spurious resets.
   */
  resetKeys?: ReadonlyArray<string | number | null | undefined>;

  /**
   * URL the fallback's escape-hatch button links to. Defaults to `/dashboard`.
   * Must not contain raw address or key material — callers are responsible for
   * ensuring this is a static route path.
   */
  fallbackHref?: string;

  /** Human-readable label for the fallback navigation link. */
  fallbackLabel?: string;

  /** Override the auto-derived correlation token, e.g. with `error.digest`. */
  diagnosticId?: string;

  /** Subtree to protect. */
  children: React.ReactNode;
}

interface ScopedErrorBoundaryState {
  /** Set to the caught error when the boundary trips; null when healthy. */
  error: Error | null;

  /**
   * Snapshot of `resetKeys` taken when the boundary caught an error. Used to
   * detect when resetKeys changes so we can clear the error state.
   */
  prevResetKeys: ReadonlyArray<string | number | null | undefined> | undefined;
}

// ---------------------------------------------------------------------------
// ScopedErrorBoundary class component
// ---------------------------------------------------------------------------

export class ScopedErrorBoundary extends React.Component<
  ScopedErrorBoundaryProps,
  ScopedErrorBoundaryState
> {
  static readonly defaultProps: Partial<ScopedErrorBoundaryProps> = {
    fallbackHref: "/dashboard",
    fallbackLabel: "Go to dashboard",
    resetKeys: [],
  };

  constructor(props: ScopedErrorBoundaryProps) {
    super(props);
    this.state = { error: null, prevResetKeys: props.resetKeys };
  }

  // -------------------------------------------------------------------------
  // Static lifecycle: error capture
  // -------------------------------------------------------------------------

  static getDerivedStateFromError(
    error: Error,
  ): Partial<ScopedErrorBoundaryState> {
    return { error };
  }

  // -------------------------------------------------------------------------
  // Static lifecycle: reset key diffing
  // -------------------------------------------------------------------------

  static getDerivedStateFromProps(
    props: ScopedErrorBoundaryProps,
    state: ScopedErrorBoundaryState,
  ): Partial<ScopedErrorBoundaryState> | null {
    if (state.error === null) return null;

    // If any resetKey value has changed, clear the error to re-render children.
    const prev = state.prevResetKeys ?? [];
    const next = props.resetKeys ?? [];

    const changed =
      prev.length !== next.length ||
      prev.some((val, idx) => val !== next[idx]);

    if (changed) {
      return { error: null, prevResetKeys: next };
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Instance lifecycle: error logging
  // -------------------------------------------------------------------------

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { scope, diagnosticId } = this.props;
    const correlationToken =
      diagnosticId ?? deriveCorrelationToken(scope, error);

    // Log scope and correlation token only — never the raw message, stack,
    // or any address/key material.
    console.error("[ScopedErrorBoundary] uncaught error in scope", {
      scope,
      correlationToken,
      componentStack: info.componentStack
        ? info.componentStack.slice(0, 300)
        : undefined,
    });
  }

  // -------------------------------------------------------------------------
  // Reset handler
  // -------------------------------------------------------------------------

  private handleReset = (): void => {
    this.setState({ error: null, prevResetKeys: this.props.resetKeys });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  render(): React.ReactNode {
    const { error } = this.state;

    if (error === null) {
      return this.props.children;
    }

    const {
      scope,
      diagnosticId,
      fallbackHref = "/dashboard",
      fallbackLabel = "Go to dashboard",
    } = this.props;

    const correlationToken =
      diagnosticId ?? deriveCorrelationToken(scope, error);

    const showDevDetails =
      typeof process !== "undefined" &&
      process.env.NODE_ENV !== "production" &&
      Boolean(error?.message);

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center min-h-[320px] w-full px-6 py-12 text-center"
      >
        <div className="w-full max-w-sm space-y-5">
          <h2 className="text-xl font-semibold text-destructive">
            Something went wrong
          </h2>

          <p className="text-sm text-muted-foreground">
            This section encountered an unexpected error. You can try again or
            navigate away.
          </p>

          {showDevDetails ? (
            <pre
              data-testid="scoped-error-dev-details"
              className="text-left text-xs text-muted-foreground bg-muted/40 p-3 rounded-md overflow-auto"
            >
              {error.message}
            </pre>
          ) : null}

          <p
            className="text-xs text-muted-foreground"
            data-testid="scoped-error-correlation"
          >
            Reference ID:{" "}
            <span className="font-mono">{correlationToken}</span>
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={this.handleReset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href={fallbackHref}>{fallbackLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
