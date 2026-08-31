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

const MINC_NOTIFICATIONS: NotificationItem[] = [
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

// -------------------------------------------------------------------------------------
// Shared notification cache to prevent duplicate fetches across panel instances.
// -------------------------------------------------------------------------------------
let sharedNotifications: NotificationItem[] | null = null;
let sharedError: Error | null = null;
let sharedPromise: Promise<NotificationItem[]> | null = null;
let sharedController: AbortController | null = null;
let markAllReadPending = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function loadNotifications() {
  if (!sharedPromise) {
    const controller = new AbortController();
    sharedController = controller;
    sharedPromise = new Promise<NotificationItem[]>((resolve, reject) => {
      // Simulate a network request. Replace with an actual API call.
      const timer = setTimeout(() => resolve(MINC_NOTIFICATIONS), 150);
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    }).then(
      (data) => {
        const result = markAllReadPending
          ? data.map((n) => ({ ...n, read: true }))
          : data;
        sharedNotifications = result;
        markAllReadPending = false;
        sharedError = null;
        notifyListeners();
        return result;
      },
      (error: Error) => {
        if (controller.signal.aborted) return [];
        sharedError = error;
        notifyListeners();
        throw error;
      }
    );
  }
  return sharedPromise;
}

/** Invalidates the shared cache and triggers a refetch from all active consumers. */
export function invalidateNotifications() {
  sharedController?.abort();
  sharedController = null;
  sharedNotifications = null;
  sharedError = null;
  sharedPromise = null;
  notifyListeners();
}

/** Mutates the shared notification list and updates all subscribers. */
export function markAllNotificationsAsRead() {
  if (sharedNotifications) {
    sharedNotifications = sharedNotifications.map((n) => ({ ...n, read: true }));
    notifyListeners();
  } else {
    // If we haven't loaded yet, mark the next fetch as read after invalidation.
    markAllReadPending = true;
    invalidateNotifications();
  }
}

/**
 * Shared hook for consuming notifications.
 * Multiple components using this hook will share a single request and cache.
 */
export function useNotifications() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setTick((t) => t + 1);
      // If the cache was invalidated, re-request.
      if (!sharedNotifications && !sharedError) {
        loadNotifications();
      }
    });

    // Initial request if cache is empty.
    if (!sharedNotifications && !sharedError) {
      loadNotifications();
    }

    return unsubscribe;
  }, []);

  return {
    notifications: sharedNotifications,
    error: sharedError,
    loading: !sharedNotifications && !sharedError,
    markAllAsRead: markAllNotificationsAsRead,
    refresh: invalidateNotifications,
  };
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { notifications, loading, markAllAsRead } = useNotifications();

  const notifs = notifications ?? [];

  const listRef = useRef<HTMLUListElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const unreadCount = useMemo(
    () => notifs.filter((n) => !n.read).length,
    [notifs]
  );

  const shouldVirtualize = notifs.length > VIRTUALIZATION_THRESHOLD;

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
      return { start: 0, end: notifs.length };
    }

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
    );
    const endIndex = Math.min(
      notifs.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN,
    );

    return { start: startIndex, end: endIndex };
  }, [shouldVirtualize, notifs.length, scrollTop, containerHeight]);

  // Notification item renderer shared by both modes
  const renderItem = useCallback(
    (n: NotificationItem) => (
      <li
        key={n.id}
        className={`$px text-sm ${n.read ? "bg-background" : "bg-muted"}`}
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
        🍔
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
            className="max-h-80 overflow-y-auto divide-Y"
            role="list"
          >
            {loading ? (
              <li className="p-4 text-sm text-muted-foreground text-center">
                Loading...
              </li>
            ) : shouldVirtualize ? (
              <>
                {/* Top spacer for virtualized scroll height */}
                <li
                  style={{ height: virtualRange.start * ITEM_HEIGHT }}
                  aria-hidden="true"
                />
                {notifs
                  .slice(virtualRange.start, virtualRange.end)
                  .map(renderItem)}
                {/* Bottom spacer for virtualized scroll height */}
                <li
                  style={{
                    height:
                      (notifs.length - virtualRange.end) * ITEM_HEIGHT,
                  }}
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                {notifs.map(renderItem)}
                {notifs.length === 0 && (
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
