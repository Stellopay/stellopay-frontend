"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export interface ErrorStateProps {
  /** The icon to display. Defaults to an alert circle. */
  icon?: React.ReactNode;
  /** The error title. */
  title: string;
  /** A user-friendly error description. Do not pass raw exceptions here. */
  description: string;
  /** Optional callback to trigger a retry action. */
  onRetry?: () => void;
}

/**
 * Reusable ErrorState component.
 * Displays an error message with proper accessibility semantics (role="alert", aria-live).
 */
export function ErrorState({
  icon,
  title,
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center p-8 text-center border border-red-900/20 bg-red-900/10 rounded-xl"
    >
      <div className="text-red-500 mb-4">
        {icon || <AlertCircle className="w-10 h-10" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-md mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#2D2D2D] hover:bg-[#3A3A3A] transition-colors text-white text-sm font-medium rounded-lg"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
