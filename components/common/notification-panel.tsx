"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Payment Received",
    message: "You received $250.00 from Alex Morgan.",
    timestamp: "5m ago",
    read: false,
  },
  {
    id: "notif-2",
    title: "Account Security",
    message: "New sign-in detected from Chrome on macOS.",
    timestamp: "1h ago",
    read: false,
  },
  {
    id: "notif-3",
    title: "Payout Completed",
    message: "Your weekly payout of $1,240.00 was processed.",
    timestamp: "1d ago",
    read: true,
  },
];

export interface NotificationPanelProps {
  initialNotifications?: NotificationItem[];
  undoDurationMs?: number;
}

export default function NotificationPanel({
  initialNotifications = DEFAULT_NOTIFICATIONS,
  undoDurationMs = 5000,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [clearedBackup, setClearedBackup] = useState<NotificationItem[] | null>(null);
  const [showToast, setShowToast] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    clearTimer();
    setClearedBackup([...notifications]);
    setNotifications([]);
    setShowToast(true);

    undoTimerRef.current = setTimeout(() => {
      setShowToast(false);
      setClearedBackup(null);
    }, undoDurationMs);
  };

  const handleUndo = () => {
    if (clearedBackup) {
      setNotifications([...clearedBackup]);
      setClearedBackup(null);
      setShowToast(false);
      clearTimer();
    }
  };

  const handleDismissToast = () => {
    setShowToast(false);
    setClearedBackup(null);
    clearTimer();
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto rounded-xl border border-border bg-card p-4 shadow-lg text-card-foreground">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <span
              className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary dark:bg-primary/20"
              aria-label={`${unreadCount} unread notifications`}
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
              {!item.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarkRead(item.id)}
                  className="h-6 w-6 shrink-0 rounded-full hover:bg-primary/10 text-primary"
                  aria-label={`Mark ${item.title} as read`}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Undo Toast Banner */}
      {showToast && (
        <div
          role="status"
          aria-live="assertive"
          className="mt-3 p-3 rounded-lg bg-foreground text-background dark:bg-card dark:text-card-foreground dark:border dark:border-border flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Trash2 className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <span className="text-xs font-medium truncate">
              Notifications cleared.
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              className="h-7 px-2 text-xs font-semibold bg-background text-foreground hover:bg-muted dark:bg-primary dark:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Undo clear all notifications"
            >
              <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismissToast}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification undo message"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
