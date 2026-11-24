/**
 * @fileoverview Notifications data-source boundary.
 *
 * ## Current state: no backend
 *
 * There is no notification delivery backend or store yet (tracked separately
 * from the UI consolidation). Rather than serve hard-coded notifications from a
 * function shaped like a real client — which would make every screen look like
 * it was working — {@link fetchNotifications} rejects with a
 * {@link NotificationsSourceUnavailableError}. UI consumers branch on
 * {@link isNotificationsSourceUnavailable} to show an honest
 * "not connected yet" state instead of a generic failure.
 *
 * ## Wiring a real source
 *
 * Replace the body of {@link fetchNotifications} with the real request and
 * return the raw JSON. The shared hook (`useSharedNotifications` in
 * `components/common/notification-panel.tsx`) validates it with
 * `parseNotifications` before any component renders it, and de-duplicates
 * concurrent requests keyed by {@link NOTIFICATIONS_CACHE_KEY}.
 *
 * Exported as a separate module so tests can mock it cleanly with `vi.mock`.
 */

/**
 * Fetchers return `unknown` because network JSON is untrusted until validated.
 * The signal is aborted when no consumer needs the response any more.
 */
export type NotificationFetcher = (signal: AbortSignal) => Promise<unknown>;

/** Cache key shared by every consumer of the user's notification feed. */
export const NOTIFICATIONS_CACHE_KEY = "notifications";

export const NOTIFICATIONS_SOURCE_UNAVAILABLE_MESSAGE =
  "Notification delivery isn't connected yet, so there's nothing to show here.";

/** Thrown when no notification source has been configured for this build. */
export class NotificationsSourceUnavailableError extends Error {
  readonly code = "NOTIFICATIONS_SOURCE_UNAVAILABLE" as const;

  constructor(message: string = NOTIFICATIONS_SOURCE_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "NotificationsSourceUnavailableError";
  }
}

export function isNotificationsSourceUnavailable(
  error: unknown,
): error is NotificationsSourceUnavailableError {
  return error instanceof NotificationsSourceUnavailableError;
}

/**
 * Loads the current user's notifications.
 *
 * Always rejects until a backend exists — see the file overview.
 */
export const fetchNotifications: NotificationFetcher = async (signal) => {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  throw new NotificationsSourceUnavailableError();
};
