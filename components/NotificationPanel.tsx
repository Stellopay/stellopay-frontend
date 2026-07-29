"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/NotificationItem";

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

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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

          <ul className="max-h-80 overflow-y-auto divide-y">
            {notifications.slice(0, 5).map((n) => (
              <li
                key={n.id}
                className={`p-3 text-sm ${n.read ? "bg-background" : "bg-muted"}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground text-center">
                No notifications
              </li>
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