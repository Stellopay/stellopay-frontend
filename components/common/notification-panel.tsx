import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import { NotificationItem, NotificationCategoryFilter } from "@/types/notification-item";
import { Skeleton } from "@/components/ui/skeleton";

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
 * Displays the user's notifications panel with per-category filtering.
 *
 * Renders a loading skeleton while `isLoading` is true, filter chips for
 * notification categories (All, Payments, Security, System) with live item counts,
 * an accessible empty state when no notifications match the selected category,
 * and otherwise the list of notifications keyed by their stable `id`.
 *
 * Persists the last selected category filter to `sessionStorage` for the session.
 *
 * The notification list implements the **listbox** keyboard pattern (WAI-ARIA roving tabindex):
 *   - Arrow Up / Arrow Down  → move focus between items (wraps)
 *   - Home / End             → jump to first / last item
 *   - Enter / Space          → activate the focused notification
 *   - Escape                 → close the panel and return focus to the bell trigger button
 */
const NotificationPanel = ({
  className: _className,
  notifications,
  isLoading = false,
  onNotificationClick,
  onClose,
  onMarkAllAsRead,
  defaultCategory = "all",
}: NotificationPanelProps) => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategoryFilter>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(CATEGORY_STORAGE_KEY);
        if (saved && ["all", "payments", "security", "system"].includes(saved)) {
          return saved as NotificationCategoryFilter;
        }
      } catch {
        // Fall back to defaultCategory if sessionStorage is unavailable
      }
    }
    return defaultCategory;
  });

  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleCategorySelect = (category: NotificationCategoryFilter) => {
    setActiveCategory(category);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(CATEGORY_STORAGE_KEY, category);
      } catch {
        // Ignore errors in environments where sessionStorage is restricted
      }
    }
  };

  // Calculate live count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<NotificationCategoryFilter, number> = {
      all: notifications.length,
      payments: 0,
      security: 0,
      system: 0,
    };

    notifications.forEach((item) => {
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
  }, [notifications]);

  // Filter notifications based on active category
  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return notifications;
    return notifications.filter((item) => {
      const cat = item.category?.toLowerCase();
      if (activeCategory === "payments") {
        return cat === "payments" || cat === "payment";
      }
      return cat === activeCategory;
    });
  }, [notifications, activeCategory]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredNotifications.length);
    setFocusedIndex(0);
  }, [filteredNotifications.length, activeCategory]);

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
      <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]">
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
      className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]"
    >
      <NotificationPanelHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={onMarkAllAsRead}
      />

      {/* Category filter tabs */}
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
                {notification.read && notification.readAt && (
                  <p className="text-[10px] text-[#505050] mt-1">
                    Read: {new Date(notification.readAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                )}
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
