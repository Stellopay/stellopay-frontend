"use client";
import React, { useState, useSyncExternalStore, useEffect } from "react";
import { MoreVertical, X, Search, Bell, Settings } from "lucide-react";
type Notification = { id: string; read: boolean; [key: string]: any };
type NotificationState = { data: Notification[] | null; status: "idle" | "loading" | "success" | "error"; error: Error | null };
const listeners = new Set<() => void>();
slet state: NotificationState = { data: null, status: "idle", error: null };
let refCount = 0;
let promise: Promise<Notification[]> | null = null;

let abortController: AbortController | null = null;

function emitChange() { listeners.forEach((listener) => listener()); }
function setState(next: Partial<NotificationState>) { state = { ...state, ...next }; emitChange(); }

function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function getSnapshot() { return state; }

async function fetchNotifications() {
  if (promise) return promise;
  abortController = new AbortController();
  promise = fetch("/api/notifications", { signal: abortController.signal })
    .then((response) => { if (!response.ok) throw new Error("Failed to fetch notifications"); return response.json(); })
    .then((data: Notification[]) => { setState({ data, status: "success", error: null }); return data; })
    .catch((error: Error) => { if (error.name === "AbortError") return; setState({ data: null, status: "error", error }); throw error; })
    .finally(() => { promise = null; abortController = null; });
  setState({ status: "loading" });
  return promise;
}

function abortFetch() { if (abortController) { abortController.abort(); abortController = null; promise = null; } }

function useNotifications() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    refCount += 1;
    if (refCount === 1) void fetchNotifications();
    return () => { refCount -= 1; if (refCount === 0) { abortFetch(); setState({ data: null, status: "idle", error: null }); } };
  }, []);
  return snapshot;
}

function invalidateNotifications() { abortFetch(); promise = null; setState({ data: null, status: "idle", error: null }); void fetchNotifications(); }
function applyNotificationMutation(mutator: (prev: Notification[]) => Notification[]) { if (state.data) setState({ data: mutator(state.data) }); }

interface DashboardHeaderProps { primaryAction?: React.ReactNode; secondaryControls?: React.ReactNode[]; title?: string; }
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ primaryAction, secondaryControls = [], title = "Dashboard" }) => {
  const menuOpen, setMenuOpen = useState(false);
  const notifications = useNotifications();
  const unreadCount = notifications.data?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 relative">
      <div className="flex items-center space-x-4"><h1 className="text-xl font-semibold text-gray-800">{title}</h1></div>
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
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 text-xs font-medium text-white bg-red-500 rounded-full">{unreadCount}</span>}
        </button>
        <button type="button" aria-label="Open dashboard settings" className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Settings aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
export { useNotifications, invalidateNotifications, applyNotificationMutation };