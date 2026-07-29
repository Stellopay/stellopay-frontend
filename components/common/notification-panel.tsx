import React, { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import { NotificationItem } from "@/types/notification-item";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationPanelProps extends NotificationProps {
  isLoading?: boolean;
  onNotificationClick?: (notification: NotificationItem) => void;
  onClose?: () => void;
}

/**
 * Renders the bell-trigger header shared by all panel states.
 */
interface NotificationPanelHeaderProps {
  unreadCount: number;
  onMarkAllAsRead?: () => void;
}

function NotificationPanelHeader({
  unreadCount,
  onMarkAllAsRead,
}: NotificationPanelHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Button
            aria-label="Notifications"
            className="bg-[#121212] border border-[#2E2E2E] cursor-pointer hover:bg-inherit "
            size="icon"
          >
            <BellIcon />
          </Button>
          {unreadCount > 0 && (
            <div
              data-testid="unread-count-badge"
              className="absolute -top-1 -right-1 bg-[#EB6945] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium"
            >
              {unreadCount}
            </div>
          )}
        </div>

        <span>Notifications</span>
      </div>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            onClick={onMarkAllAsRead}
            className="text-xs text-[#E5E5E5] hover:bg-[#12121266] px-2 h-auto font-light cursor-pointer"
          >
            Mark all as read
          </Button>
        )}
        <Button className="bg-[#12121266] border border-[#2E2E2E] cursor-pointer px-2! hover:bg-inherit">
          <p className="text-[#E5E5E5] font-light">View All</p>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/**
 * Accessible empty state shown when there are no notifications to display.
 */
function NotificationPanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="relative w-[24px] h-[24px] flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm">
        <IconBell />
      </div>
      <p className="font-light text-[#E5E5E5] text-sm">
        You&apos;re all caught up
      </p>
      <p className="text-xs text-[#505050]">No new notifications right now.</p>
    </div>
  );
}

/**
 * Displays the user's notifications panel.
 *
 * Renders a loading skeleton while `isLoading` is true, an accessible
 * empty state when `notifications` is empty, and otherwise the list of
 * notifications keyed by their stable `id` (never array index).
 *
 * The notification list implements the **listbox** keyboard pattern
 * (WAI-ARIA roving tabindex):
 *   - Arrow Up / Arrow Down  → move focus between items (wraps)
 *   - Home / End             → jump to first / last item
 *   - Enter / Space          → activate the focused notification
 *   - Escape                 → close the panel and return focus to the
 *                              bell trigger button
 *
 * Notification `title` and `message` are rendered as plain text children,
 * never via `dangerouslySetInnerHTML`, so they cannot inject markup.
 *
 * Props
 * -----
 * - `onNotificationClick` – callback invoked when a notification is
 *   activated via click, Enter, or Space.
 * - `onClose` – callback invoked when Escape is pressed, after focus
 *   has been returned to the bell trigger button.
 */
const NotificationPanel = ({
  className: _className,
  notifications,
  isLoading = false,
  onNotificationClick,
  onClose,
}: NotificationPanelProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, notifications.length);
    setFocusedIndex(0);
  }, [notifications.length]);

  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
      setFocusedIndex(index);
    }
  }, []);

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next =
            focusedIndex < notifications.length - 1 ? focusedIndex + 1 : 0;
          focusItem(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            focusedIndex > 0 ? focusedIndex - 1 : notifications.length - 1;
          focusItem(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (notifications.length > 0) focusItem(0);
          break;
        }
        case "End": {
          e.preventDefault();
          if (notifications.length > 0)
            focusItem(notifications.length - 1);
          break;
        }
        case "Escape": {
          e.preventDefault();
          const trigger =
            containerRef.current?.querySelector<HTMLButtonElement>(
              '[aria-label="Notifications"]',
            );
          trigger?.focus();
          onClose?.();
          break;
        }
      }
    },
    [focusedIndex, notifications.length, focusItem, onClose],
  );

  const handleItemKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLDivElement>,
      notification: NotificationItem,
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNotificationClick?.(notification);
      }
    },
    [onNotificationClick],
  );

  if (isLoading) {
    return (
      <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center"
            >
              <div className="grid gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="w-6 h-6 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]"
    >
      <NotificationPanelHeader />

      {notifications.length === 0 ? (
        <NotificationPanelEmptyState />
      ) : (
        <div
          role="listbox"
          aria-label="Notifications list"
          className="flex flex-col gap-4"
          onKeyDown={handleListKeyDown}
        >
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="option"
              aria-selected={focusedIndex === index}
              tabIndex={focusedIndex === index ? 0 : -1}
              className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E0EF]"
              onKeyDown={(e) => handleItemKeyDown(e, notification)}
              onClick={() => onNotificationClick?.(notification)}
            >
              <div className="grid gap-1">
                <p className="font-light text-[#E5E5E5] text-sm">
                  {notification.title}
                </p>
                <p className="text-xs text-[#505050] truncate">
                  {notification.message}
                </p>
              </div>
              <div className="relative w-[24px] h-[24px] flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm">
                <IconBell />
                {!notification.read && (
                  <div className="absolute top-2 right-[7px] w-1 h-1 bg-[#EB6945] rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
