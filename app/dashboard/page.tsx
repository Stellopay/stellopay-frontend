"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import Dashboard from "@/components/dashboard/dashboard-page";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationContextValue = {
  notifications: Notification[] | null;
  loading: boolean;
  error: string | null;
  invalidate: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(() => {
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch("/api/notifications", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch notifications");
        }
        return res.json() as Promise<Notification[]>;
      })
      .then((data) => {
        setNotifications(data);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchNotifications();
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [fetchNotifications]);

  const invalidate = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setNotifications(null);
    setError(null);
    fetchNotifications();
  }, [fetchNotifications]);

  const value = useMemo(
    () => ({ notifications, loading, error, invalidate }),
    [notifications, loading, error, invalidate]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export default function DashboardPage() {
  return (
    <NotificationProvider>
      <Dashboard />
    </NotificationProvider>
  );
}
