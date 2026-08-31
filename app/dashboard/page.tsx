"use client";

import React, { createContext, useContext, useMemo } from "react";
import Dashboard from "@/components/dashboard/dashboard-page";
import { useNotifications as useNotificationsStore, invalidateNotifications } from "@/lib/notifications-store";

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
  const { data, status, error } = useNotificationsStore();
  const loading = status === "loading";
  const invalidate = invalidateNotifications;

  const value = useMemo(
    () => ({ notifications: data, loading, error: error ? error.message : null, invalidate }),
    [data, loading, error, invalidate]
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
