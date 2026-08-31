/**
 * Categories available for filtering notifications in the panel.
 */
export type NotificationCategory = "payments" | "security" | "system";

/**
 * Filter option for notification categories, including 'all'.
 */
export type NotificationCategoryFilter = "all" | NotificationCategory;

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
   * precise instant exposed via the `title` and `dateTime` attributes.
   */
  timestamp?: string;
  /** Category used by the panel's filter chips */
  category?: NotificationCategory | string;
  /** ISO timestamp set when the notification transitions from unread to read */
  readAt?: string;
};

