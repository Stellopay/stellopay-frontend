"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { StatePanel, StatePanelAction } from "@/components/ui/state-panel";

export interface ErrorStateProps {
  /** The icon to display. Defaults to an alert circle. */
  icon?: React.ReactNode;
  /** The error title. */
  title: string;
  /** A user-friendly error description. Do not pass raw exceptions here. */
  description: string;
  /**
   * Optional callback to trigger a retry action.
   *
   * When provided, a "Try Again" button is rendered below the description.
   * The button is disabled while `retrying` is `true` so the user cannot
   * fire concurrent retry requests.
   *
   * @example
   * <ErrorState
   *   title="Failed to Load"
   *   description="Could not fetch transactions."
   *   onRetry={refetch}
   *   retrying={isLoading}
   * />
   */
  onRetry?: () => void;
  /**
   * When `true`, the retry button shows a loading spinner and is disabled
   * to prevent duplicate in-flight requests.
   *
   * Has no effect when `onRetry` is not provided.
   * Defaults to `false`.
   */
  retrying?: boolean;
  /**
   * A Sentry-style event reference (e.g. `digest`) to display as a
   * user-facing placeholder. When omitted, a dash placeholder is shown
   * so the UI contract remains consistent.
   */
  eventId?: string;
  /**
   * URL for the "Report issue" link. Defaults to `/help/support`.
   */
  reportLink?: string;
}

/**
 * Reusable ErrorState component.
 *
 * Displays an error message with proper accessibility semantics
 * (`role="alert"`, `aria-live="assertive"`).
 *
 * An optional retry button is rendered when `onRetry` is supplied.
 * Pass `retrying={true}` while the retry is in-flight to show a spinner
 * and prevent the user from triggering a second concurrent request.
 *
 * Layout is delegated to {@link StatePanel}, the pattern shared with
 * `EmptyState`, so the two stay visually aligned. Only the semantic
 * differences live here: the alert icon, the danger tone, the assertive
 * live-region urgency, and the recovery affordances (retry, reference ID,
 * report link) that have no counterpart in an empty state.
 */
export function ErrorState({
  icon,
  title,
  description,
  onRetry,
  retrying = false,
  eventId,
  reportLink = "/help/support",
}: ErrorStateProps) {
  return (
    <StatePanel
      tone="danger"
      role="alert"
      live="assertive"
      icon={icon || <AlertCircle />}
      title={title}
      description={description}
    >
      {onRetry && (
        <StatePanelAction
          tone="danger"
          onClick={onRetry}
          disabled={retrying}
          aria-disabled={retrying}
          aria-label={retrying ? "Retrying…" : "Try Again"}
        >
          {retrying && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {retrying ? "Retrying…" : "Try Again"}
        </StatePanelAction>
      )}

      {/* Sentry-ready event ID placeholder */}
      <div
        className="text-xs text-zinc-500 dark:text-zinc-500"
        aria-label="Event reference ID"
      >
        <span className="font-medium">Reference ID:</span>{" "}
        <code
          className="bg-zinc-100 dark:bg-black/20 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-mono"
          aria-label={`Event reference ${eventId ?? "not available"}`}
        >
          {eventId ?? "—"}
        </code>
      </div>

      {/* Report-issue link */}
      <a
        href={reportLink}
        className="rounded text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50 dark:text-zinc-400 dark:hover:text-white dark:focus-visible:ring-[#D7E0EF] dark:focus-visible:ring-offset-[#170d0d]"
        aria-label="Report this issue"
      >
        Report issue
      </a>
    </StatePanel>
  );
}
