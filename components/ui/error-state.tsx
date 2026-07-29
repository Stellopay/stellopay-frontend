"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center p-8 text-center border border-red-200 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 rounded-xl"
    >
      <div className="text-red-500 mb-4">
        {icon || <AlertCircle className="w-10 h-10" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={retrying}
          aria-disabled={retrying}
          aria-label={retrying ? "Retrying…" : "Try Again"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-[#2D2D2D] hover:bg-zinc-800 dark:hover:bg-[#3A3A3A] transition-colors text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retrying && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {retrying ? "Retrying…" : "Try Again"}
        </button>
      )}

      {/* Sentry-ready event ID placeholder */}
      <div
        className="mt-5 text-xs text-zinc-500 dark:text-zinc-500"
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
        className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline underline-offset-2 transition-colors"
        aria-label="Report this issue"
      >
        Report issue
      </a>
    </div>
  );
}
