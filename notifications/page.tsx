"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/NotificationItem";

// TODO: replace with your real data source (API call / context / hook)
// used by NotificationPanel.tsx — swap this out once you find it.
const MOCK_NOTIFICATIONS: NotificationItem[] = [];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function groupByDate(items: NotificationItem[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const groups: Record<"Today" | "Yesterday" | "Earlier", NotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const item of items) {
    const itemDate = new Date((item as any).timestamp ?? (item as any).createdAt);
    if (isSameDay(itemDate, today)) groups.Today.push(item);
    else if (isSameDay(itemDate, yesterday)) groups.Yesterday.push(item);
    else groups.Earlier.push(item);
  }

  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    notifications.forEach((n) => set.add((n as any).category ?? "general"));
    return ["all", ...Array.from(set)];
  }, [notifications]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return notifications;
    return notifications.filter((n) => (n as any).category === activeCategory);
  }, [notifications, activeCategory]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...(n as any), read: true }) as NotificationItem));
  };

  const hasAny = filtered.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" id="notifications-heading">
          Notifications
        </h1>
        <Button
          onClick={markAllAsRead}
          aria-label="Mark all notifications as read"
          variant="outline"
        >
          Mark all as read
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Filter notifications by category"
        className="flex flex-wrap gap-2 mb-6"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              activeCategory === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <p role="status" aria-live="polite" className="text-muted-foreground">
          Loading notifications…
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && !hasAny && (
        <p className="text-muted-foreground py-12 text-center">
          You have no notifications{activeCategory !== "all" ? ` in "${activeCategory}"` : ""}.
        </p>
      )}

      {!loading &&
        !error &&
        (["Today", "Yesterday", "Earlier"] as const).map((groupName) =>
          grouped[groupName].length > 0 ? (
            <section
              key={groupName}
              aria-labelledby={`group-${groupName}`}
              className="mb-8"
            >
              <h2
                id={`group-${groupName}`}
                className="text-sm font-medium text-muted-foreground mb-3"
              >
                {groupName}
              </h2>
              <ul className="space-y-2">
                {grouped[groupName].map((item) => (
                  <li
                    key={(item as any).id}
                    className={`p-3 rounded-lg border ${
                      (item as any).read ? "bg-background" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">{(item as any).title}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item as any).message}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null
        )}

      <div className="mt-8">
        <Link href="/" className="text-sm underline text-muted-foreground">
          ← Back
        </Link>
      </div>
    </main>
  );
}