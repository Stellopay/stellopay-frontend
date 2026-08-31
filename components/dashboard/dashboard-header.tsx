"use client";
import React, { useState } from "react";
import { MoreVertical, X, Search, Bell, Settings } from "lucide-react";
import { useNotifications, invalidateNotifications, applyNotificationMutation } from "@/lib/notifications-store";

export { useNotifications, invalidateNotifications, applyNotificationMutation };

interface DashboardHeaderProps {
  primaryAction?: React.ReactNode;
  secondaryControls?: React.ReactNode[];
  title?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  primaryAction,
  secondaryControls = [],
  title = "Dashboard",
}) => {
  const [ menuOpen, setMenuOpen ] = useState(false);
  const { data = data } = useNotifications();
  const unreadCount = (data ?? []).filter((n) => !n.read).length;

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 relative">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex items-center space-x-2">
        {primaryAction && <div data-testid="primary-action">{primaryAction}</div>}
        {secondaryControls.length > 0 && (
          <>
            <div className="hidden md:flex items-center space-x-2" data-testid="secondary-controls-desktop">
              {secondaryControls.map((control, index) => <div key={index}>{control}</div>)}
            </div>
            <div className="md:hidden">
              <button aria-label="More options" aria-expanded={menuOpen} onClick={() => setMenuOpen((prev) => !prev)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" data-testid="kebab-menu-button">
                {menuOpen ? <X size={20} strokeWidth={2} /> : <MoreVertical size={20} strokeWidth={2} />}
              </button>
              {menuOpen && (
                <div data-testid="kebab-menu" className="absolute right-4 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {secondaryControls.map((control, index) => <div key={index} className="px-4 py-2 hover:bg-gray-50 transition-colors">{control}</div>)}
                </div>
              )}
            </div>
          <>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1" aria-label="Dashboard actions">
        <button type="button" aria-label="Search dashboard" className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Search aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button type="button" aria-label="View notifications" className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative">
          <Bell aria-hidden="true" size={20} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-xs font-medium text-white bg-red-500 rounded-full">{unreadCount}</span>
          )}
        </button>
        <button type="button" aria-label="Open dashboard settings" className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Settings aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
