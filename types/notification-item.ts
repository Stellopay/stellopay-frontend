/**
 * Canonical notification types.
 *
 * This is the single source of truth for notification shapes across the app:
 * the shared `NotificationPanel`, the `/notifications` page, the dashboard
 * navbar bell, and the runtime validator in `lib/api/response-validation.ts`
 * all import from here.
 */

/**
 * Categories available for filtering notifications in the panel.
 */
export type NotificationCategory = "payments" | "security" | "system";

/**
 * Filter option for notification categories, including 'all'.
 */
export type NotificationCategoryFilter = "all" | NotificationCategory;

/**
 * Category strings the API is known to send that are not filter categories
 * themselves. `"payment"` is treated as an alias of `"payments"` by the panel
 * filter; the others are shown under "All" only.
 */
export type LegacyNotificationCategory = "payment" | "payroll" | "general";

/**
 * Represents a single notification entry shown in the notification panel.
 *
 * `id` must be stable and unique across renders so list items can be used
 * as React keys without relying on array index, which breaks reconciliation
 * when items are dismissed or reordered.
 */
export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  /**
   * ISO timestamp for when the notification was created.
   *
   * Rendered as relative time ("2h ago", "yesterday") in the panel, with the
   * precise instant exposed via the `title` and `dateTime` attributes. Also
   * drives the Today / Yesterday / Earlier grouping on `/notifications`.
   */
  timestamp?: string;
  /**
   * Category used by the panel's filter chips. Unknown strings are accepted
   * (the validator does not restrict them) so a newer API can add categories
   * without the client rejecting the whole response; `string & {}` keeps
   * editor autocompletion for the known values.
   */
  category?: NotificationCategory | LegacyNotificationCategory | (string & {});
  /** ISO timestamp set when the notification transitions from unread to read */
  readAt?: string;
};

/**
 * Calendar-day buckets used to group notifications on the full
 * `/notifications` page, in display order.
 */
export const NOTIFICATION_DATE_GROUPS = ["Today", "Yesterday", "Earlier"] as const;

export type NotificationDateGroup = (typeof NOTIFICATION_DATE_GROUPS)[number];
