"use client";

import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  /** The icon to display. Defaults to an inbox icon. */
  icon?: React.ReactNode;
  /** The empty state title. */
  title: string;
  /** A user-friendly description of why the state is empty or how to populate it. */
  description: string;
  /** Optional callback to trigger an action (like retry or clear filters). */
  onRetry?: () => void;
  /** Optional custom action text if onRetry is provided. Defaults to "Clear Filters". */
  actionLabel?: string;
}

/**
 * Reusable EmptyState component.
 * Displays an empty state with proper accessibility semantics (role="status", aria-live).
 */
export function EmptyState({
  icon,
  title,
  description,
  onRetry,
  actionLabel = "Clear Filters",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center border border-[#2D2D2D] bg-[#111111] rounded-xl"
    >
      <div className="text-zinc-500 mb-4">
        {icon || <Inbox className="w-10 h-10" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3A3A3A] transition-colors text-white text-sm font-medium rounded-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
