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
};
