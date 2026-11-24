"use client";

import { Bell, BellOff } from "lucide-react";
import NotificationPanel, {
  useSharedNotifications,
} from "@/components/common/notification-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  fetchNotifications,
  isNotificationsSourceUnavailable,
  NOTIFICATIONS_CACHE_KEY,
} from "@/lib/api/notifications";

function PageHeading() {
  return (
    <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
      Notifications
    </h1>
  );
}

/**
 * Full notification feed at `/notifications`.
 *
 * Data comes from the shared, de-duplicated loader used by the dashboard bell
 * (`useSharedNotifications` + the `lib/api/notifications` boundary), and the
 * list itself is the shared `NotificationPanel` in its date-grouped mode, so
 * filtering, clear-all/undo and keyboard navigation match the dropdown.
 *
 * Until a notification backend exists the boundary reports
 * "source unavailable", which renders as an explicit not-connected state
 * rather than a fake feed or a generic failure.
 */
export default function NotificationsPage() {
  const { data, isLoading, error, refetch } = useSharedNotifications(
    NOTIFICATIONS_CACHE_KEY,
    fetchNotifications,
  );

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <>
        <PageHeading />
        <div role="status" aria-live="polite">
          <NotificationPanel notifications={[]} isLoading className="max-w-none" />
        </div>
      </>
    );
  } else if (error && isNotificationsSourceUnavailable(error)) {
    body = (
      <>
        <PageHeading />
        <EmptyState
          variant="offline"
          icon={<BellOff />}
          title="Notifications aren't connected yet"
          description={error.message}
        />
      </>
    );
  } else if (error) {
    body = (
      <>
        <PageHeading />
        <ErrorState
          title="Couldn't load notifications"
          description="Something went wrong while loading your notifications. Please try again."
          onRetry={refetch}
        />
      </>
    );
  } else if (!data || data.length === 0) {
    body = (
      <>
        <PageHeading />
        <EmptyState
          icon={<Bell />}
          title="No notifications yet"
          description="Payment, security and system updates for your account will appear here."
        />
      </>
    );
  } else {
    body = (
      <NotificationPanel
        notifications={data}
        groupByDate
        headingAs="h1"
        viewAllHref={null}
        className="max-w-none"
      />
    );
  }

  return <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">{body}</div>;
}
