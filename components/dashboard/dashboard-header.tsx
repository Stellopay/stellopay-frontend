import React from "react";
import { Bell, Search, Settings } from "lucide-react";

export const DashboardHeader: React.FC = () => {
  return (
    <header className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        aria-label="Dashboard actions"
      >
        <button
          type="button"
          aria-label="Search dashboard"
          className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Search aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="View notifications"
          className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Bell aria-hidden="true" size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Open dashboard settings"
          className="inline-flex size-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Settings aria-hidden="true" size={20} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};
