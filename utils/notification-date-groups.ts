import {
  NOTIFICATION_DATE_GROUPS,
  type NotificationDateGroup,
  type NotificationItem,
} from "@/types/notification-item";

export type NotificationsByDate = Record<NotificationDateGroup, NotificationItem[]>;

/** A non-empty date bucket, ready to render as one section. */
export interface NotificationDateSection {
  group: NotificationDateGroup;
  items: NotificationItem[];
}

/**
 * Parses an optional ISO timestamp into epoch milliseconds, or `null` when it
 * is missing or unparsable. Dates are compared numerically, never as strings,
 * so mixed offsets ("Z" vs "+01:00") and precisions order correctly.
 */
function toEpochMs(timestamp: string | undefined): number | null {
  if (!timestamp) return null;
  const ms = Date.parse(timestamp);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Buckets notifications into Today / Yesterday / Earlier by the viewer's
 * **local calendar day**.
 *
 * - Boundaries are local midnights built with the `Date(y, m, d)` constructor,
 *   so month/year rollovers and DST days (23h or 25h long) are handled by the
 *   platform rather than by subtracting a fixed 24h.
 * - A timestamp later than now (client clock skew) is treated as Today.
 * - A notification with a missing or invalid timestamp cannot be placed on a
 *   day; it goes to Earlier rather than being dropped, so nothing the API
 *   returned silently disappears.
 * - Input order is preserved within each bucket.
 */
export function groupByDate(
  items: readonly NotificationItem[],
  now: Date = new Date(),
): NotificationsByDate {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  ).getTime();

  const groups: NotificationsByDate = { Today: [], Yesterday: [], Earlier: [] };

  for (const item of items) {
    const ms = toEpochMs(item.timestamp);
    if (ms !== null && ms >= startOfToday) groups.Today.push(item);
    else if (ms !== null && ms >= startOfYesterday) groups.Yesterday.push(item);
    else groups.Earlier.push(item);
  }

  return groups;
}

/** {@link groupByDate}, as an ordered list with empty buckets removed. */
export function toDateSections(groups: NotificationsByDate): NotificationDateSection[] {
  return NOTIFICATION_DATE_GROUPS.filter((group) => groups[group].length > 0).map(
    (group) => ({ group, items: groups[group] }),
  );
}
