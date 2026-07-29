"use client";

import React from "react";
import { cn } from "@/utils/commonUtils";
import { PasswordStrengthResult } from "@/utils/authUtils";

export interface PasswordStrengthIndicatorProps {
  /** Password strength result from calculatePasswordStrength */
  strengthResult: PasswordStrengthResult;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed feedback text */
  showFeedback?: boolean;
}

/**
 * Password strength indicator component that displays strength level
 * with both visual and text indicators for accessibility.
 * 
 * Features:
 * - Visual strength bar with color coding
 * - Text-based strength level (not color-only)
 * - Accessible with proper ARIA attributes
 * - Live updates via aria-live region
 */
export function PasswordStrengthIndicator({
  strengthResult,
  className,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  const { strength, score, feedback } = strengthResult;

  // Strength level configuration
  const strengthConfig = {
    weak: {
      label: "Weak",
      color: "bg-red-500",
      textColor: "text-red-400",
      width: Math.max((score / 100) * 100, 10), // Minimum 10% width for visibility
    },
    fair: {
      label: "Fair", 
      color: "bg-yellow-500",
      textColor: "text-yellow-400",
      width: (score / 100) * 100,
    },
    strong: {
      label: "Strong",
      color: "bg-green-500", 
      textColor: "text-green-400",
      width: (score / 100) * 100,
    },
  };

  const config = strengthConfig[strength];

  return (
    <div 
      className={cn("space-y-2", className)}
      role="region"
      aria-label="Password strength indicator"
    >
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div 
          className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        >
          <div
            className={cn("h-full transition-all duration-300 ease-out", config.color)}
            style={{ width: `${config.width}%` }}
          />
        </div>
        
        {/* Strength text label */}
        <span
          className={cn(
            "text-sm font-medium min-w-[4rem]",
            config.textColor
          )}
          aria-live="polite"
        >
          {config.label}
        </span>
      </div>

      {/* Feedback message */}
      {showFeedback && feedback && (
        <p
          className={cn(
            "text-xs",
            config.textColor
          )}
          aria-live="polite"
          role="status"
        >
          {feedback}
        </p>
      )}
    </div>
  );
}