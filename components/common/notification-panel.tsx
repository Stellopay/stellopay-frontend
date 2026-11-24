"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { BellIcon, ChevronRight, RotateCcw, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import {
  NotificationItem,
  NotificationCategoryFilter,
} from "@/types/notification-item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
  toIsoDateTime,
} from "@/utils/date-utils";
import { groupByDate as groupNotificationsByDate, toDateSections } from "@/utils/notification-date-groups";
import { cn } from "@/utils/commonUtils";
import { parseNotifications } from "@/lib/api";
import type { NotificationFetcher } from "@/lib/api/notifications";

export type { NotificationFetcher } from "@/lib/api/notifications";

interface NotificationRequestEntry {
  fetcher: NotificationFetcher;
  promise: Promise<NotificationItem[]>;
  controller: AbortController;
  refCount: number;
}

const notificationRequests = new Map<string, NotificationRequestEntry>();
const notificationDataCache = new Map<string, NotificationItem[]>();
const notificationInvalidationListeners = new Set<(cacheKey?: string) => void>();

function subscribeToNotificationInvalidation(listener: (cacheKey?: string) => void) {
  notificationInvalidationListeners.add(listener);
  return () => {
    notificationInvalidationListeners.delete(listener);
  };
}

function getSharedNotificationRequest(
  cacheKey: string,
  fetcher: NotificationFetcher,
) {
  let request = notificationRequests.get(cacheKey);

  if (!request) {
    const controller = new AbortController();
    const promise = fetcher(controller.signal)
      .then((data) => {
        const notifications = parseNotifications(data);
        if (notificationRequests.get(cacheKey)?.promise === promise) {
          notificationDataCache.set(cacheKey, notifications);
        }
        return notifications;
      })
      .finally(() => {
        if (notificationRequests.get(cacheKey)?.promise === promise) {
          notificationRequests.delete(cacheKey);
        }
      });

    request = { fetcher, promise, controller, refCount: 0 };
    notificationRequests.set(cacheKey, request);
  }

  request.refCount += 1;

  let released = false;
  return {
    promise: request.promise,
    release: () => {
      if (released) return;
      released = true;
      request.refCount -= 1;
      if (
        request.refCount <= 0 &&
        notificationRequests.get(cacheKey) === request
      ) {
        request.controller.abort();
        notificationRequests.delete(cacheKey);
      }
    },
  };
}

export function invalidateNotifications(cacheKey?: string) {
  if (cacheKey !== undefined) {
    notificationDataCache.delete(cacheKey);
    const request = notificationRequests.get(cacheKey);
    if (request) {
      request.controller.abort();
      notificationRequests.delete(cacheKey);
    }
  } else {
    notificationDataCache.clear();
    notificationRequests.forEach((request) => {
      request.controller.abort();
    });
    notificationRequests.clear();
  }
  notificationInvalidationListeners.forEach((listener) => listener(cacheKey));
}

/** Normalises a rejection reason so callers never receive a non-Error. */
function toError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === "string" ? reason : "Failed to load notifications.");
}

function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "AbortError";
}

/**
 * Shared, de-duplicated notification loader.
 *
 * Every component that passes the same `cacheKey` shares one in-flight request
 * and one cached result. The response is validated with `parseNotifications`
 * before it reaches state. Any rejection other than an abort is surfaced via
 * `error` — including network failures and an unconfigured source — so
 * consumers can render an error state instead of a misleading empty list.
 */
export function useSharedNotifications(
  cacheKey: string,
  fetcher: NotificationFetcher,
) {
  const [data, setData] = useState<NotificationItem[] | null>(() =>
    notificationDataCache.get(cacheKey) ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    () => !notificationDataCache.has(cacheKey),
  );
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let active = true;
    let release: (() => void) | null = null;
    let currentPromise: Promise<NotificationItem[]> | null = null;

    const load = () => {
      if (notificationDataCache.has(cacheKey)) {
        currentPromise = null;
        setData(notificationDataCache.get(cacheKey) ?? []);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      const request = getSharedNotificationRequest(cacheKey, fetcherRef.current);
      release = request.release;
      currentPromise = request.promise;
      request.promise
        .then((items) => {
          if (!active || currentPromise !== request.promise) return;
          setData(items);
          setIsLoading(false);
        })
        .catch((reason: unknown) => {
          if (!active || currentPromise !== request.promise) return;
          // A superseded request is aborted on purpose; never report it.
          if (isAbortError(reason)) return;
          setError(toError(reason));
          setIsLoading(false);
        });
    };

    load();

    const unsubscribe = subscribeToNotificationInvalidation((invalidatedKey) => {
      if (!active) return;
      if (invalidatedKey !== undefined && invalidatedKey !== cacheKey) return;
      if (release) {
        release();
        release = null;
      }
      setData(null);
      setIsLoading(true);
      load();
    });

    return () => {
      active = false;
      unsubscribe();
      if (release) release();
    };
  }, [cacheKey]);

  const refetch = useCallback(() => {
    invalidateNotifications(cacheKey);
  }, [cacheKey]);

  return { data, isLoading, error, refetch };
}

export const useNotifications = useSharedNotifications;

export const CATEGORY_STORAGE_KEY = "notification-panel-category-filter";

export const CATEGORIES: { id: NotificationCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payments", label: "Payments" },
  { id: "security", label: "Security" },
  { id: "system", label: "System" },
];

/** List length above which rows are virtualized (flat mode only). */
export const VIRTUALIZATION_THRESHOLD = 20;
/** Fixed height of one virtualized row, in px. */
const VIRTUAL_ROW_HEIGHT = 72;
/** Gap below each virtualized row, matching `gap-4`. */
const VIRTUAL_ROW_GAP = 16;
const VIRTUAL_ROW_STRIDE = VIRTUAL_ROW_HEIGHT + VIRTUAL_ROW_GAP;
/**
 * Scroll viewport height for a virtualized list. Also the fallback for range
 * maths before layout is measured (and in environments without layout).
 */
const VIRTUAL_VIEWPORT_HEIGHT = 384;
/** Rows rendered above/below the visible window. */
const VIRTUAL_OVERSCAN = 3;

const EMPTY_NOTIFICATIONS: NotificationItem[] = [];

interface NotificationPanelProps extends NotificationProps {
  isLoading?: boolean;
  /**
   * User-facing error message. When set (and not loading) the panel replaces
   * the list with an alert. Never pass a raw exception message from an
   * untrusted source.
   */
  error?: string | null;
  /** Renders a "Try again" action alongside `error`. */
  onRetry?: () => void;
  onNotificationClick?: (notification: NotificationItem) => void;
  onClose?: () => void;
  defaultCategory?: NotificationCategoryFilter;
  undoDurationMs?: number;
  now?: Date;
  /**
   * Destination of the "View all" link. `null` hides it, e.g. on the
   * `/notifications` page itself.
   */
  viewAllHref?: string | null;
  /** Splits the list into Today / Yesterday / Earlier sections. */
  groupByDate?: boolean;
  /** Element used for the "Notifications" title. */
  headingAs?: "span" | "h1" | "h2";
}

function NotificationTimestamp({
  timestamp,
  now,
}: {
  timestamp?: string;
  now?: Date;
}) {
  const relative = formatRelativeTime(timestamp, now ? { now } : undefined);
  if (!relative) return null;

  const absolute = formatAbsoluteDateTime(timestamp);

  return (
    <time
      dateTime={toIsoDateTime(timestamp)}
      title={absolute}
      data-testid="notification-timestamp"
      className="text-[11px] text-[#A0A0A0] whitespace-nowrap"
    >
      <span aria-hidden="true">{relative}</span>
      <span className="sr-only">{absolute}</span>
    </time>
  );
}

interface NotificationPanelHeaderProps {
  unreadCount: number;
  hasNotifications: boolean;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  viewAllHref: string | null;
  onViewAll?: () => void;
  headingAs: "span" | "h1" | "h2";
}

function NotificationPanelHeader({
  unreadCount,
  hasNotifications,
  onMarkAllAsRead,
  onClearAll,
  viewAllHref,
  onViewAll,
  headingAs: Heading,
}: NotificationPanelHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {/* Decorative: the panel is opened by its host (e.g. the navbar bell). */}
          <span
            aria-hidden="true"
            className={buttonVariants({
              size: "icon",
              className: "bg-[#121212] border border-[#2E2E2E]",
            })}
          >
            <BellIcon />
          </span>
          {unreadCount > 0 && (
            <div
              data-testid="unread-count-badge"
              aria-hidden="true"
              className="absolute -top-1 -right-1 bg-[#EB6945] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium"
            >
              {unreadCount}
            </div>
          )}
        </div>

        <Heading className="truncate">Notifications</Heading>
        {unreadCount > 0 && (
          <span className="sr-only">{unreadCount} new</span>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            onClick={onMarkAllAsRead}
            aria-label="Mark all notifications as read"
            className="text-xs text-[#E5E5E5] hover:bg-[#12121266] px-2 h-auto font-light cursor-pointer"
          >
            Mark all as read
          </Button>
        )}
        {hasNotifications && onClearAll && (
          <Button
            variant="ghost"
            onClick={onClearAll}
            aria-label="Clear all notifications"
            className="text-xs text-[#E5E5E5] hover:bg-[#12121266] px-2 h-auto font-light cursor-pointer"
          >
            Clear all
          </Button>
        )}
        {viewAllHref && (
          <Button
            asChild
            className="bg-[#12121266] border border-[#2E2E2E] cursor-pointer px-2! hover:bg-inherit"
          >
            <Link href={viewAllHref} onClick={onViewAll}>
              <span className="text-[#E5E5E5] font-light">View All</span>
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function NotificationPanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="relative w-6 h-6 flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm">
        <IconBell />
      </div>
      <p className="font-light text-[#E5E5E5] text-sm">
        You&apos;re all caught up
      </p>
      <p className="text-xs text-[#505050]">No notifications to display.</p>
    </div>
  );
}

const PANEL_SURFACE =
  "bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] w-full max-w-100 rounded-xl p-4 text-[#E5E5E5]";

const NotificationPanel = ({
  className,
  notifications = EMPTY_NOTIFICATIONS,
  isLoading = false,
  error = null,
  onRetry,
  onNotificationClick,
  onClose,
  onMarkAllAsRead,
  defaultCategory = "all",
  undoDurationMs = 5000,
  now,
  viewAllHref = "/notifications",
  groupByDate = false,
  headingAs = "span",
}: NotificationPanelProps) => {
  const idPrefix = useId();
  const listId = `${idPrefix}-list`;

  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [clearedBackup, setClearedBackup] = useState<NotificationItem[] | null>(
    null,
  );
  const [showToast, setShowToast] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeCategory, setActiveCategory] = useState<NotificationCategoryFilter>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(CATEGORY_STORAGE_KEY);
        const match = CATEGORIES.find((cat) => cat.id === saved);
        if (match) return match.id;
      } catch {
        // Storage can be unavailable (privacy mode); fall back to the default.
      }
    }
    return defaultCategory;
  });

  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Index to focus once a virtualized row scrolls into the rendered range. */
  const pendingFocusRef = useRef<number | null>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(VIRTUAL_VIEWPORT_HEIGHT);

  const clearTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setItems(notifications);
    setClearedBackup(null);
    setShowToast(false);
    clearTimer();
  }, [notifications, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleCategorySelect = useCallback((category: NotificationCategoryFilter) => {
    setActiveCategory(category);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(CATEGORY_STORAGE_KEY, category);
      } catch {
        // Persisting the filter is best-effort.
      }
    }
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<NotificationCategoryFilter, number> = {
      all: items.length,
      payments: 0,
      security: 0,
      system: 0,
    };

    items.forEach((item) => {
      const cat = item.category?.toLowerCase();
      if (cat === "payments" || cat === "payment") {
        counts.payments += 1;
      } else if (cat === "security") {
        counts.security += 1;
      } else if (cat === "system") {
        counts.system += 1;
      }
    });

    return counts;
  }, [items]);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((item) => {
      const cat = item.category?.toLowerCase();
      if (activeCategory === "payments") {
        return cat === "payments" || cat === "payment";
      }
      return cat === activeCategory;
    });
  }, [items, activeCategory]);

  const dateSections = useMemo(
    () =>
      groupByDate
        ? toDateSections(groupNotificationsByDate(filteredNotifications, now))
        : null,
    [groupByDate, filteredNotifications, now],
  );

  /** Items in on-screen order; keyboard indices refer to this array. */
  const displayNotifications = useMemo(
    () =>
      dateSections
        ? dateSections.flatMap((section) => section.items)
        : filteredNotifications,
    [dateSections, filteredNotifications],
  );

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const shouldVirtualize =
    !groupByDate && displayNotifications.length > VIRTUALIZATION_THRESHOLD;

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, displayNotifications.length);
    pendingFocusRef.current = null;
    setFocusedIndex(0);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [displayNotifications.length, activeCategory]);

  // Measure the real viewport once the virtualized list is laid out.
  useLayoutEffect(() => {
    if (!shouldVirtualize) return;
    const measured = listRef.current?.clientHeight ?? 0;
    if (measured > 0) setViewportHeight(measured);
  }, [shouldVirtualize]);

  // Complete a focus move that had to wait for a virtualized row to render.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (pending === null) return;
    const el = itemRefs.current[pending];
    if (el) {
      pendingFocusRef.current = null;
      el.focus();
    }
  });

  const virtualRange = useMemo(() => {
    if (!shouldVirtualize) return { start: 0, end: displayNotifications.length };
    const start = Math.max(
      0,
      Math.floor(scrollTop / VIRTUAL_ROW_STRIDE) - VIRTUAL_OVERSCAN,
    );
    const end = Math.min(
      displayNotifications.length,
      Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ROW_STRIDE) +
        VIRTUAL_OVERSCAN,
    );
    return { start, end };
  }, [shouldVirtualize, displayNotifications.length, scrollTop, viewportHeight]);

  const handleListScroll = useCallback(() => {
    if (listRef.current) setScrollTop(listRef.current.scrollTop);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true, readAt })),
    );
    onMarkAllAsRead?.();
    invalidateNotifications();
  }, [onMarkAllAsRead]);

  const handleClearAll = useCallback(() => {
    setItems((prev) => {
      if (prev.length === 0) return prev;
      clearTimer();
      setClearedBackup([...prev]);
      setShowToast(true);
      undoTimerRef.current = setTimeout(() => {
        setShowToast(false);
        setClearedBackup(null);
      }, undoDurationMs);
      return [];
    });
  }, [clearTimer, undoDurationMs]);

  const handleUndo = useCallback(() => {
    if (!clearedBackup) return;
    setItems([...clearedBackup]);
    setClearedBackup(null);
    setShowToast(false);
    clearTimer();
  }, [clearedBackup, clearTimer]);

  const handleDismissToast = useCallback(() => {
    setShowToast(false);
    setClearedBackup(null);
    clearTimer();
  }, [clearTimer]);

  const focusItem = useCallback(
    (index: number) => {
      setFocusedIndex(index);
      const item = itemRefs.current[index];
      if (item) {
        item.focus();
        return;
      }
      // Virtualized and outside the rendered window: scroll it into range,
      // then focus it after the next render (see the pending-focus effect).
      if (shouldVirtualize) {
        const target = index * VIRTUAL_ROW_STRIDE;
        if (listRef.current) listRef.current.scrollTop = target;
        setScrollTop(target);
        pendingFocusRef.current = index;
      }
    },
    [shouldVirtualize],
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const count = displayNotifications.length;
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          focusItem(focusedIndex < count - 1 ? focusedIndex + 1 : 0);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          focusItem(focusedIndex > 0 ? focusedIndex - 1 : count - 1);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (count > 0) focusItem(0);
          break;
        }
        case "End": {
          e.preventDefault();
          if (count > 0) focusItem(count - 1);
          break;
        }
        case "Escape": {
          if (!onClose) return;
          e.preventDefault();
          onClose();
          break;
        }
      }
    },
    [focusedIndex, displayNotifications.length, focusItem, onClose],
  );

  const handleCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === "ArrowRight") nextIndex = (index + 1) % CATEGORIES.length;
      else if (e.key === "ArrowLeft")
        nextIndex = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
      if (nextIndex === null) return;

      e.preventDefault();
      handleCategorySelect(CATEGORIES[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    },
    [handleCategorySelect],
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
      <div className={cn(PANEL_SURFACE, className)} aria-busy="true">
        <span className="sr-only">Loading notifications</span>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <Skeleton key={cat.id} className="h-6 w-16 rounded-full" />
          ))}
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

  if (error) {
    return (
      <div className={cn(PANEL_SURFACE, className)}>
        <NotificationPanelHeader
          unreadCount={0}
          hasNotifications={false}
          viewAllHref={null}
          headingAs={headingAs}
        />
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 py-6 text-center"
        >
          <p className="text-sm text-[#E5E5E5]">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 px-3 text-xs bg-[#1E1E1E] text-[#E5E5E5] border-[#3E3E3E] hover:bg-[#2E2E2E] focus-visible:ring-2 focus-visible:ring-[#D7E0EF]"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderOption = (notification: NotificationItem, index: number) => (
    <div
      key={notification.id}
      ref={(el) => {
        itemRefs.current[index] = el;
      }}
      role="option"
      aria-selected={focusedIndex === index}
      aria-setsize={shouldVirtualize ? displayNotifications.length : undefined}
      aria-posinset={shouldVirtualize ? index + 1 : undefined}
      tabIndex={focusedIndex === index ? 0 : -1}
      style={
        shouldVirtualize
          ? { height: VIRTUAL_ROW_HEIGHT, marginBottom: VIRTUAL_ROW_GAP }
          : undefined
      }
      className={cn(
        "bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E0EF]",
        shouldVirtualize && "shrink-0 overflow-hidden",
      )}
      onKeyDown={(e) => handleItemKeyDown(e, notification)}
      onClick={() => onNotificationClick?.(notification)}
    >
      <div className="grid gap-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-light text-[#E5E5E5] text-sm truncate">
            {notification.title}
          </p>
          <NotificationTimestamp timestamp={notification.timestamp} now={now} />
        </div>
        <p className="text-xs text-[#505050] truncate">{notification.message}</p>
        {notification.read && notification.readAt && (
          <p className="text-[10px] text-[#A0A0A0] mt-1">
            Read:{" "}
            <time
              dateTime={toIsoDateTime(notification.readAt)}
              title={formatAbsoluteDateTime(notification.readAt)}
            >
              {formatRelativeTime(notification.readAt, now ? { now } : undefined)}
            </time>
          </p>
        )}
      </div>
      <div className="relative w-6 h-6 shrink-0 flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm">
        <IconBell />
        {!notification.read && (
          <div className="absolute top-2 right-1.75 w-1 h-1 bg-[#EB6945] rounded-full" />
        )}
      </div>
    </div>
  );

  const renderListContent = () => {
    if (dateSections) {
      let offset = 0;
      return dateSections.map((section) => {
        const start = offset;
        offset += section.items.length;
        const headingId = `${idPrefix}-group-${section.group}`;
        return (
          <div
            key={section.group}
            role="group"
            aria-labelledby={headingId}
            className="flex flex-col gap-4"
          >
            {/*
              Not a heading element: a listbox may only own options and
              groups, so (per the ARIA APG grouped listbox) the label is a
              presentational element that names the group via aria-labelledby.
            */}
            <div
              id={headingId}
              className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]"
            >
              {section.group}
            </div>
            {section.items.map((n, i) => renderOption(n, start + i))}
          </div>
        );
      });
    }

    if (shouldVirtualize) {
      const { start, end } = virtualRange;
      return (
        <>
          <div
            aria-hidden="true"
            data-testid="virtual-spacer-top"
            style={{ height: start * VIRTUAL_ROW_STRIDE }}
            className="shrink-0"
          />
          {displayNotifications
            .slice(start, end)
            .map((n, i) => renderOption(n, start + i))}
          <div
            aria-hidden="true"
            data-testid="virtual-spacer-bottom"
            style={{
              height: (displayNotifications.length - end) * VIRTUAL_ROW_STRIDE,
            }}
            className="shrink-0"
          />
        </>
      );
    }

    return displayNotifications.map((n, i) => renderOption(n, i));
  };

  return (
    <div ref={containerRef} className={cn(PANEL_SURFACE, className)}>
      <NotificationPanelHeader
        unreadCount={unreadCount}
        hasNotifications={items.length > 0}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        viewAllHref={viewAllHref}
        onViewAll={onClose}
        headingAs={headingAs}
      />

      <div
        role="tablist"
        aria-label="Filter notifications by category"
        className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4"
      >
        {CATEGORIES.map((cat, index) => {
          const isSelected = activeCategory === cat.id;
          const count = categoryCounts[cat.id];
          return (
            <button
              key={cat.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`${idPrefix}-tab-${cat.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={displayNotifications.length > 0 ? listId : undefined}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleCategorySelect(cat.id)}
              onKeyDown={(e) => handleCategoryKeyDown(e, index)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E0EF] ${
                isSelected
                  ? "bg-[#1E1E1E] text-white border-[#3E3E3E] font-medium"
                  : "bg-[#12121266] text-[#A0A0A0] hover:text-[#E5E5E5] hover:bg-[#121212] border-[#2E2E2E]"
              }`}
            >
              <span>{cat.label}</span>
              <span className="ml-1 text-[11px] opacity-80" data-testid={`count-${cat.id}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {displayNotifications.length === 0 ? (
        <NotificationPanelEmptyState />
      ) : (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Notifications list"
          className={cn(
            "flex flex-col",
            groupByDate ? "gap-6" : shouldVirtualize ? "overflow-y-auto" : "gap-4",
          )}
          style={shouldVirtualize ? { maxHeight: VIRTUAL_VIEWPORT_HEIGHT } : undefined}
          onScroll={shouldVirtualize ? handleListScroll : undefined}
          onKeyDown={handleListKeyDown}
        >
          {renderListContent()}
        </div>
      )}

      {showToast && (
        <div
          role="status"
          aria-live="assertive"
          className="mt-3 p-3 rounded-lg bg-[#121212] border border-[#2E2E2E] flex items-center justify-between gap-2 shadow-md"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Trash2 className="h-4 w-4 shrink-0 text-[#EB6945]" aria-hidden="true" />
            <span className="text-xs font-medium truncate">
              Notifications cleared.
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              aria-label="Undo clear all notifications"
              className="h-7 px-2 text-xs font-semibold bg-[#1E1E1E] text-[#E5E5E5] border-[#3E3E3E] hover:bg-[#2E2E2E] focus-visible:ring-2 focus-visible:ring-[#D7E0EF]"
            >
              <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissToast}
              aria-label="Dismiss notification undo message"
              className="h-7 w-7 rounded-full text-[#A0A0A0] hover:text-[#E5E5E5]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
export type { NotificationItem };
