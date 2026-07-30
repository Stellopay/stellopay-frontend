"use client";

import { useState, useEffect, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

/**
 * Props for the WasThisHelpful feedback widget.
 */
export interface WasThisHelpfulProps {
  /**
   * Unique identifier for the article section. Used to build the localStorage
   * key so each article retains its own feedback state.
   */
  articleId: string;
  /**
   * Optional callback to invoke when the user indicates the article was not
   * helpful. Typically used to switch the parent's active tab to the contact
   * support form.
   */
  onContactSupport?: () => void;
}

type Feedback = "yes" | "no" | null;

const STORAGE_PREFIX = "stellopay-help-feedback-";

/**
 * Build the localStorage key for a given article ID.
 * Exported for testability.
 */
export function getStorageKey(articleId: string): string {
  return `${STORAGE_PREFIX}${articleId}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const yesButtonClasses =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2D2D2D] " +
  "bg-transparent text-sm text-[#E5E5E5] " +
  "hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400 " +
  "transition-all duration-200 " +
  "focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-1 focus:ring-offset-[#0f0711]";

const noButtonClasses =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2D2D2D] " +
  "bg-transparent text-sm text-[#E5E5E5] " +
  "hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 " +
  "transition-all duration-200 " +
  "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-1 focus:ring-offset-[#0f0711]";

const contactButtonClasses =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2D2D2D] " +
  "bg-transparent text-sm text-[#598EFF] " +
  "hover:bg-blue-500/10 hover:border-blue-500/30 " +
  "transition-all duration-200 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 focus:ring-offset-[#0f0711]";

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * WasThisHelpful feedback widget.
 *
 * Displays a "Was this helpful?" prompt at the end of a help article. The user
 * can answer Yes or No. The response is persisted in localStorage to avoid
 * re-prompting across sessions.
 *
 * ## Accessibility
 * - Region landmark with `aria-label="Article feedback"` for screen readers
 * - Buttons have descriptive `aria-label` values
 * - Feedback messages use `aria-live="polite"` for announcement
 * - Keyboard navigable (Tab, Enter/Space)
 * - Visible focus indicators on all interactive elements
 *
 * ## Persistence
 * - Feedback is stored in localStorage under `stellopay-help-feedback-{articleId}`
 * - If localStorage is unavailable (private browsing, storage full), the widget
 *   degrades gracefully to session-only feedback
 *
 * ## Edge cases
 * - Loading state: component returns null while checking localStorage on mount
 * - Rapid clicks: handled by React state batching
 * - Already-answered: skips the question and shows the thank-you / contact message
 */
export function WasThisHelpful({ articleId, onContactSupport }: WasThisHelpfulProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load persisted feedback on mount ─────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(articleId));
      if (stored === "yes" || stored === "no") {
        setFeedback(stored);
      }
    } catch {
      // localStorage not available — proceed without persistence
    }
    setIsLoading(false);
  }, [articleId]);

  // ── Persist feedback to localStorage ─────────────────────────────────────
  const handleFeedback = useCallback(
    (value: "yes" | "no") => {
      setFeedback(value);
      try {
        localStorage.setItem(getStorageKey(articleId), value);
      } catch {
        // localStorage not available — feedback is session-only
      }
    },
    [articleId],
  );

  // Avoid flash of unvoted state while checking localStorage
  if (isLoading) {
    return null;
  }

  return (
    <div
      className="mt-8 pt-6 border-t border-[#2D2D2D]"
      role="region"
      aria-label="Article feedback"
    >
      {/* ── Initial question state ─────────────────────────────────────── */}
      {feedback === null && (
        <div className="flex flex-col items-center gap-4 py-4">
          <p
            id={`was-this-helpful-label-${articleId}`}
            className="text-sm text-[#E5E5E5] font-medium"
          >
            Was this helpful?
          </p>
          <div
            className="flex items-center gap-3"
            role="group"
            aria-labelledby={`was-this-helpful-label-${articleId}`}
          >
            <button
              type="button"
              onClick={() => handleFeedback("yes")}
              className={yesButtonClasses}
              aria-label="Yes, this article was helpful"
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              <span>Yes</span>
            </button>
            <button
              type="button"
              onClick={() => handleFeedback("no")}
              className={noButtonClasses}
              aria-label="No, this article was not helpful"
            >
              <ThumbsDown className="h-4 w-4" aria-hidden="true" />
              <span>No</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Thank-you state (Yes) ──────────────────────────────────────── */}
      {feedback === "yes" && (
        <div
          className="flex flex-col items-center gap-2 py-4"
          role="status"
          aria-live="polite"
        >
          <ThumbsUp className="h-6 w-6 text-green-400" aria-hidden="true" />
          <p className="text-sm text-green-400 font-medium">
            Glad this helped! Thanks for your feedback.
          </p>
        </div>
      )}

      {/* ── Contact-support state (No) ─────────────────────────────────── */}
      {feedback === "no" && (
        <div
          className="flex flex-col items-center gap-3 py-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[#E5E5E5]">
            Sorry this wasn&apos;t helpful.
          </p>
          {onContactSupport ? (
            <button
              type="button"
              onClick={onContactSupport}
              className={contactButtonClasses}
              aria-label="Contact support for further assistance"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Contact Support</span>
            </button>
          ) : (
            <p className="text-sm text-[#707070]">
              Please visit the{" "}
              <span className="text-[#598EFF]">Contact Support</span> tab above
              for further assistance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
