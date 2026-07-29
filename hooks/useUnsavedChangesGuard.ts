"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MESSAGE =
  "You have unsaved changes. Leave this page and discard them?";

export interface UseUnsavedChangesGuardOptions {
  /** Prompt shown for in-app navigation. Most browsers ignore custom
   * `beforeunload` text and show their own generic message instead, but the
   * confirm() dialog for in-app link clicks does use this text. */
  message?: string;
}

export interface UseUnsavedChangesGuardResult {
  /**
   * Imperative check for a navigation this component already controls (e.g.
   * switching an in-page tab via router.replace). Returns `true` when it's
   * safe to proceed — either there's nothing unsaved, or the user confirmed
   * discarding it.
   */
  confirmDiscard: () => boolean;
}

/**
 * Warns before the browser tab closes/reloads or before an in-app link
 * navigates away while `isDirty` is true, and exposes `confirmDiscard()` for
 * navigation the caller performs itself (e.g. an in-page tab switch).
 *
 * ## Coverage and known limitations
 * - `beforeunload` covers tab close, reload, and typed/bookmarked
 *   navigations. Per the spec, browsers ignore the custom `message` here and
 *   show their own generic prompt.
 * - In-app navigation is covered by intercepting `<a href>` clicks (which is
 *   how `next/link` renders) in the capture phase, before Next's own click
 *   handler runs — the App Router does not expose a router-level
 *   "before navigate" event the way the old Pages Router did.
 * - Browser back/forward (`popstate`) is **not** guarded: by the time
 *   `popstate` fires the URL has already changed, and reliably intercepting
 *   it requires pushing synthetic history entries, which is out of scope
 *   here. This is a known limitation shared by most App Router apps absent
 *   a router-level navigation-events API.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  { message = DEFAULT_MESSAGE }: UseUnsavedChangesGuardOptions = {},
): UseUnsavedChangesGuardResult {
  // Effects below intentionally read isDirty/message through refs rather
  // than depending on them directly, so a change while a listener is
  // attached is picked up without tearing down and re-adding the listener
  // on every keystroke.
  const isDirtyRef = useRef(isDirty);
  const messageRef = useRef(message);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      // Legacy assignment some older browsers still require.
      event.returnValue = messageRef.current;
      return messageRef.current;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isDirtyRef.current) return;
      if (event.defaultPrevented) return;
      // Ignore modified/non-primary clicks (new tab, download, etc.) —
      // those don't navigate this tab away.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // Same-page hash links and explicit no-ops don't lose any state.
      if (!href || href.startsWith("#")) return;
      if (anchor.target === "_blank") return;

      const shouldLeave = window.confirm(messageRef.current);
      if (!shouldLeave) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  const confirmDiscard = useCallback(() => {
    if (!isDirtyRef.current) return true;
    return window.confirm(messageRef.current);
  }, []);

  return { confirmDiscard };
}
