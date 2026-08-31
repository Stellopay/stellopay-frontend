"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellIcon, ChevronRight, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import { NotificationItem, NotificationCategoryFilter } from "@/types/notification-item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
  toIsoDateTime,
} from "@/utils/date-utils";

export type NotificationFetcher = (signal: AbortSignal) => Promise<NotificationItem[]>;

interface NotificationRequestEntry {
  fetcher: NotificationFetcher;
  promise: Promise<NotificationItem[]>;
  controller: AbortController;
  refCount: number;
}

const notificationRequests = new Map<string, NotificationRequestEntry>();
const notificationDataCache = new Map<string, NotificationItem[]>();
const notificationInvalidationListeners = new Set<() => void>();

function subscribeToNotificationInvalidation(listener: () => void) {
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

  if (request && request.fetcher !== fetcher) {
    request.controller.abort();
    notificationRequests.delete(cacheKey);
    request = undefined;
  }

  if (!request) {
    const controller = new AbortController();
    const promise = fetcher(controller.signal)
      .then((data) => {
        notificationDataCache.set(cacheKey, data);
        return data;
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

export function invalidateNotifications() {
  notificationDataCache.clear();
  notificationRequests.forEach((request) => {
    request.controller.abort();
  });
  notificationRequests.clear();
  notificationInvalidationListeners.forEach((listener) => listener());
}

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

  useEffect(() => {
    let active = true;
    let release: (() => void) | null = null;

    const load = () => {
      if (notificationDataCache.has(cacheKey)) {
        setData(notificationDataCache.get(cacheKey) ?? []);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const request = getSharedNotificationRequest(cacheKey, fetcher);
      release = request.release;
      request.promise
        .then((items) => {
          if (!active) return;
          setData(items);
          setIsLoading(false);
        })
        .catch(() => {
          if (active) setIsLoading(false);
        });
    };

    load();

    const unsubscribe = subscribeToNotificationInvalidation(() => {
      if (!active) return;
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
  }, [cacheKey, fetcher]);

  const refetch = useCallback(() => {
    invalidateNotifications();
  }, []);

  return { data, isLoading, refetch };
}

export const useNotifications = useSharedNotifications;

export const CATEGORY_STORAGE_KEY = "notification-panel-category-filter";

export const CATEGORIES: { id: NotificationCategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payments", label: "Payments" },
  { id: "security", label: "Security" },
  { id: "system", label: "System" },
];

interface NotificationPanelProps extends NotificationProps {
  isLoading?: boolean;
  onNotificationClick?: (notification: NotificationItem) => void;
  onClose?: () => void;
  defaultCategory?: NotificationCategoryFilter;
  undoDurationMs?: number;
  now?: Date;
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
}

function NotificationPanelHeader({
  unreadCount,
  hasNotifications,
  onMarkAllAsRead,
  onClearAll,
}: NotificationPanelHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
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
              className="absolute -top-1 -right-1 bg-[#EB6945] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-medium"
            >
              {unreadCount}
            </div>
          )}
        </div>

        <span className="truncate">Notifications</span>
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
        <Button className="bg-[#12121266] border border-[#2E2E2E] cursor-pointer px-2! hover:bg-inherit">
          <p className="text-[#E5E5E5] font-light">View All</p>
          <ChevronRight />
        </Button>
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

const NotificationPanel = ({
  className: _className,
  notifications,
  isLoading = false,
  onNotificationClick,
  onClose,
  onMarkAllAsRead,
  defaultCategory = "all",
  undoDurationMs = 5000,
  now,
}: NotificationPanelProps) => {
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
        if (saved && ["all", "payments", "security", "system"].includes(saved)) {
          return saved as NotificationCategoryFilter;
        }
      } catch {
      }
    }
    return defaultCategory;
  });

  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  const handleCategorySelect = (category: NotificationCategoryFilter) => {
    setActiveCategory(category);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(CATEGORY_STORAGE_KEY, category);
      } catch {
      }
    }
  };

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

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredNotifications.length);
    setFocusedIndex(0);
  }, [filteredNotifications.length, activeCategory]);

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
            focusedIndex < filteredNotifications.length - 1 ? focusedIndex + 1 : 0;
          focusItem(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            focusedIndex > 0 ? focusedIndex - 1 : filteredNotifications.length - 1;
          focusItem(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (filteredNotifications.length > 0) focusItem(0);
          break;
        }
        case "End": {
          e.preventDefault();
          if (filteredNotifications.length > 0)
            focusItem(filteredNotifications.length - 1);
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
    [focusedIndex, filteredNotifications.length, focusItem, onClose],
  );

  const handleCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (index + 1) % CATEGORIES.length;
        const nextCategory = CATEGORIES[nextIndex].id;
        handleCategorySelect(nextCategory);
        const nextButton = containerRef.current?.querySelector<HTMLButtonElement>(
          `#notification-tab-${nextCategory}`,
        );
        nextButton?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
        const prevCategory = CATEGORIES[prevIndex].id;
        handleCategorySelect(prevCategory);
        const prevButton = containerRef.current?.querySelector<HTMLButtonElement>(
          `#notification-tab-${prevCategory}`,
        );
        prevButton?.focus();
      }
    },
    [],
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
      <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-100 rounded-xl p-4 text-[#E5E5E5]">
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

  return (
    <div
      ref={containerRef}
      className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] w-full max-w-100 rounded-xl p-4 text-[#E5E5E5]"
    >
      <NotificationPanelHeader
        unreadCount={unreadCount}
        hasNotifications={items.length > 0}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
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
              id={`notification-tab-${cat.id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls="notification-list-panel"
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

      {filteredNotifications.length === 0 ? (
        <NotificationPanelEmptyState />
      ) : (
        <div
          id="notification-list-panel"
          role="listbox"
          aria-label="Notifications list"
          className="flex flex-col gap-4"
          onKeyDown={handleListKeyDown}
        >
          {filteredNotifications.map((notification, index) => (
            <div
              key={notification.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="option"
              aria-selected={focusedIndex === index}
              tabIndex={focusedIndex === index ? 0 : -1}
              className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D7E0EF]"
              onKeyDown={(e) => handleItemKeyDown(e, notification)}
              onClick={() => onNotificationClick?.(notification)}
            >
              <div className="grid gap-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-light text-[#E5E5E5] text-sm truncate">
                    {notification.title}
                  </p>
                  <NotificationTimestamp
                    timestamp={notification.timestamp}
                    now={now}
                  />
                </div>
                <p className="text-xs text-[#505050] truncate">
                  {notification.message}
                </p>
                {notification.read && notification.readAt && (
                  <p className="text-[10px] text-[#A0A0A0] mt-1">
                    Read:{" "}
                    <time
                      dateTime={toIsoDateTime(notification.readAt)}
                      title={formatAbsoluteDateTime(notification.readAt)}
                    >
                      {formatRelativeTime(
                        notification.readAt,
                        now ? { now } : undefined,
                      )}
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
          ))}
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
