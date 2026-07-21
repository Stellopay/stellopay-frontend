/**
 * @fileoverview Clipboard utility functions.
 *
 * All public functions return a consistent boolean success/failure signal so
 * callers can show appropriate feedback without knowing which internal path
 * was taken.
 *
 * Copy strategy (in order of preference):
 *
 * 1. `navigator.clipboard.writeText` — modern async Clipboard API, requires
 *    a secure context (HTTPS or localhost).
 * 2. `document.execCommand('copy')` fallback — synchronous legacy API that
 *    works in older browsers, non-HTTPS embeds, and some in-app webviews
 *    where the Clipboard API is unavailable.  A temporary off-screen
 *    `<textarea>` is used to hold the text, selected, then removed.
 *
 * If both paths fail the functions return `false` so callers can surface an
 * appropriate error state.
 */

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Legacy `execCommand` fallback for environments where the async Clipboard
 * API is unavailable (insecure contexts, older browsers, some webviews).
 *
 * Creates an off-screen `<textarea>`, sets its value, selects all text,
 * executes `document.execCommand('copy')`, and removes the element.
 *
 * @param text - The text to copy.
 * @returns `true` if `execCommand` reported success, `false` otherwise.
 *
 * @internal
 */
export function execCommandCopy(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Position off-screen so the element never flashes visibly.
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    // Prevent iOS Safari from zooming in on the textarea.
    textarea.style.fontSize = "12pt";
    // Keep it out of the accessibility tree.
    textarea.setAttribute("aria-hidden", "true");
    textarea.setAttribute("tabindex", "-1");
    textarea.setAttribute("readonly", "");

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Copies `text` to the system clipboard.
 *
 * Tries the modern async Clipboard API first.  If the API is unavailable
 * (e.g. `navigator.clipboard` is undefined, or the call rejects because the
 * page is in a non-secure context) the function automatically falls back to
 * the legacy `document.execCommand('copy')` approach.
 *
 * @param text - The text to copy to the clipboard.
 * @returns A Promise that resolves to `true` on success or `false` on failure.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // ── Path 1: modern async Clipboard API ──────────────────────────────────
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path — writeText can reject even when
      // the API exists (e.g. permissions denied, focus lost).
    }
  }

  // ── Path 2: legacy execCommand fallback ─────────────────────────────────
  if (typeof document !== "undefined") {
    return execCommandCopy(text);
  }

  return false;
};

/**
 * Copies text to the clipboard and invokes the appropriate callback.
 *
 * @param text - The text to copy.
 * @param onSuccess - Called when the copy succeeds.
 * @param onError - Called with an error message when the copy fails.
 */
export const copyToClipboardWithFeedback = async (
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void,
): Promise<void> => {
  const success = await copyToClipboard(text);

  if (success) {
    onSuccess?.();
  } else {
    onError?.("Failed to copy text. Please try again.");
  }
};

/**
 * Copies text to the clipboard and toggles a "copied" state for a fixed
 * duration so callers can show transient feedback (e.g. a checkmark icon).
 *
 * @param text - The text to copy.
 * @param setCopied - State setter to toggle the copied indicator.
 * @param timeout - How long (ms) to hold the copied state before resetting.
 *   Defaults to 2000 ms.
 */
export const copyToClipboardWithTimeout = async (
  text: string,
  setCopied: (value: boolean) => void,
  timeout: number = 2000,
): Promise<void> => {
  const success = await copyToClipboard(text);

  if (success) {
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  } else {
    alert("Failed to copy text. Please try again.");
  }
};
