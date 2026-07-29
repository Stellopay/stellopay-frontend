"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { safeStorage } from "@/utils/safeStorage";

const STORAGE_KEY = "stellopay.cookie-consent";

type ConsentValue = "accepted" | "declined";

/**
 * Cookie-consent banner shown once per browser via `utils/safeStorage.ts`.
 *
 * Behaviour
 * ---------
 * - On first visit, renders a fixed bottom banner asking for consent.
 * - **Accept** sets `"accepted"` in safeStorage and dismisses.
 * - **Decline** sets `"declined"` in safeStorage and dismisses.
 * - Once either action is taken the banner never reappears.
 * - Links to the `/cookies` policy page for more information.
 * - Does **not** trap keyboard focus or block page content.
 *
 * Accessibility (WCAG 2.1 AA)
 * ---------------------------
 * - `role="dialog"` + `aria-label="Cookie consent"` for assistive technology.
 * - Buttons carry descriptive `aria-label` attributes.
 * - Colour contrast meets WCAG 2.1 AA for both light and dark themes.
 * - Visible `focus-visible:ring-2` indicators on all interactive elements.
 * - Icons are decorative (`aria-hidden="true"`).
 * - Keyboard-navigable without focus trapping.
 *
 * Responsiveness
 * --------------
 * - Full-width stacked layout on narrow viewports; side-by-side on wider
 *   screens so actions fit on one row.
 * - Text constrained to a readable measure.
 */
export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from safeStorage on mount.
  useEffect(() => {
    const stored = safeStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
    }
    setHydrated(true);
  }, []);

  const handleAction = useCallback((value: ConsentValue) => {
    safeStorage.setItem(STORAGE_KEY, value);
    setConsent(value);
  }, []);

  // Nothing to render: still hydrating, or consent already given/declined.
  if (!hydrated || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      data-testid="cookie-consent-banner"
      className="fixed bottom-0 inset-x-0 z-[9997] border-t border-gray-200 dark:border-[#1a1a1a] bg-[#FAFAFA] dark:bg-[#09090B] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
    >
      <div className="mx-auto max-w-[1200px] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Message */}
          <div className="flex items-start gap-3 min-w-0">
            <Cookie
              className="mt-0.5 h-5 w-5 shrink-0 text-[#7C3AED] dark:text-[#a78bfa]"
              aria-hidden="true"
            />
            <p
              className="text-sm leading-relaxed text-[#666666] dark:text-[#a1a1aa]"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              We use cookies to enhance your experience. By clicking
              &ldquo;Accept&rdquo;, you agree to our use of cookies.{" "}
              <Link
                href="/cookies"
                className="font-medium text-[#7C3AED] underline decoration-[#7C3AED]/30 underline-offset-2 transition-colors hover:text-[#6D28D9] dark:text-[#a78bfa] dark:decoration-[#a78bfa]/30 dark:hover:text-[#c4b5fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 rounded-sm"
              >
                Learn more
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAction("declined")}
              aria-label="Decline cookies"
              className="h-9 rounded-lg border border-gray-200 dark:border-[#27272a] bg-transparent px-4 text-sm font-medium text-[#666666] dark:text-[#a1a1aa] transition-all duration-200 hover:border-[#7C3AED] hover:text-[#7C3AED] dark:hover:border-[#a78bfa] dark:hover:text-[#a78bfa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => handleAction("accepted")}
              aria-label="Accept cookies"
              className="h-9 rounded-lg px-5 text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6] hover:from-[#7C93FF] hover:to-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
