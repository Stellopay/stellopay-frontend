"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/NotificationItem";

/** Threshold above which the notification list switches to virtualized rendering. */
const VIRTUALIZATION_THRESHOLD = 20;

/** Estimated height in pixels of a single notification row. */
const ITEM_HEIGHT = 72;

/** Number of extra items to render above/below the visible range as a buffer. */
const OVERSCAN = 3;

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Payment received",
    message: "You received a payment of $250.00",
    category: "payment",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Payroll processed",
    message: "Your payroll batch was processed successfully",
    category: "payroll",
    read: false,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    title: "Security alert",
    message: "New login detected from a new device",
    category: "security",
    read: true,
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const listRef = useRef<HTMLUListElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const shouldVirtualize = notifications.length > VIRTUALIZATION_THRESHOLD;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setScrollTop(listRef.current.scrollTop);
    }
  }, []);

  // Measure container height when the panel opens (deferred to next paint
  // so the DOM layout is settled before we read clientHeight).
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      if (listRef.current) {
        setContainerHeight(listRef.current.clientHeight);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Virtualized range calculations
  const virtualRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: notifications.length };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
      notifications.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN,
    );

    return { start: startIndex, end: endIndex };
  }, [shouldVirtualize, notifications.length, scrollTop, containerHeight]);

  // Notification item renderer shared by both modes
  const renderItem = useCallback(
    (n: NotificationItem) => (
      <li
        key={n.id}
        className={`p-3 text-sm ${n.read ? "bg-background" : "bg-muted"}`}
        style={shouldVirtualize ? { height: ITEM_HEIGHT } : undefined}
      >
        <p className="font-medium">{n.title}</p>
        <p className="text-muted-foreground">{n.message}</p>
      </li>
    ),
    [shouldVirtualize]
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications, ${unreadCount} unread`}
        className="relative p-2 rounded-full hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 rounded-lg border bg-background shadow-lg z-50"
        >
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-medium text-sm">Notifications</span>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>

          <ul
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-80 overflow-y-auto divide-y"
            role="list"
          >
            {shouldVirtualize ? (
              <>
                {/* Top spacer for virtualized scroll height */}
                <li
                  style={{ height: virtualRange.start * ITEM_HEIGHT }}
                  aria-hidden="true"
                />
                {notifications
                  .slice(virtualRange.start, virtualRange.end)
                  .map(renderItem)}
                {/* Bottom spacer for virtualized scroll height */}
                <li
                  style={{
                    height:
                      (notifications.length - virtualRange.end) * ITEM_HEIGHT,
                  }}
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                {notifications.map(renderItem)}
                {notifications.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground text-center">
                    No notifications
                  </li>
                )}
              </>
            )}
          </ul>

          <div className="border-t p-2 text-center">
            <Link
              href="/notifications"
              className="text-sm text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}