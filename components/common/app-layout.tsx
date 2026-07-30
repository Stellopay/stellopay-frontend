"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { SideBar } from "./side-bar";
import Navbar from "@/components/common/navbar";
import FeedbackWidget from "@/components/common/feedback-widget";
import useSidebar from "@/context/sidebar-context";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { AppLayoutProps } from "@/types/ui";
import { ShortcutHelpModal } from "./shortcut-help-modal";
import { useShortcutModal } from "@/hooks/useShortcutModal";

/** CSS selector that matches all natively focusable elements. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();
  const { isOpen: isShortcutModalOpen, close: closeShortcutModal } =
    useShortcutModal();

  /** Ref on the mobile sidebar overlay — used to query focusable children. */
  const mobileSidebarRef = useRef<HTMLDivElement>(null);

  // Enable global keyboard shortcuts (g + d/t/s) for navigation
  useGlobalShortcuts();

  // ── Mobile sidebar: Escape / focus trap / scroll lock ──────────────────────
  const isMobileSidebarOpen = isMobile && isSidebarOpen;

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    // Move initial focus into the mobile sidebar on open.
    const overlay = mobileSidebarRef.current;
    if (overlay) {
      const firstFocusable =
        overlay.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    }

    /** Trap Tab/Shift+Tab within the sidebar; close on Escape. */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        return;
      }

      if (e.key !== "Tab" || !overlay) return;

      const focusableEls = Array.from(
        overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.closest("[hidden]") && el.tabIndex !== -1);

      if (focusableEls.length === 0) return;

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSidebarOpen, setSidebarOpen]);

  // ── Return focus to main content when mobile sidebar closes ────────────────
  const prevMobileSidebarOpen = useRef(isMobileSidebarOpen);
  useEffect(() => {
    if (prevMobileSidebarOpen.current && !isMobileSidebarOpen) {
      const main = document.getElementById("main-content");
      main?.focus();
    }
    prevMobileSidebarOpen.current = isMobileSidebarOpen;
  }, [isMobileSidebarOpen]);

  // ── Lock body scroll when mobile sidebar is open ───────────────────────────
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/*
       * Skip-to-content link — WCAG 2.4.1 (Bypass Blocks, Level A).
       */}
      <a
        href="#main-content"
        className={[
          "sr-only focus:not-sr-only",
          "focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
          "focus:rounded-md focus:px-4 focus:py-2",
          "focus:bg-white focus:text-black",
          "focus:font-semibold focus:text-sm",
          "focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-black",
        ].join(" ")}
      >
        Skip to main content
      </a>

      <div
        className={`grid h-full transition-all duration-300 ease-in-out ${
          isMobile
            ? "grid-cols-1"
            : isSidebarOpen
              ? "grid-cols-[16.25rem_1fr]"
              : "grid-cols-[6rem_1fr]"
        }`}
      >
        {!isMobile && <SideBar />}

        <div className="relative h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-hide">
          <Navbar />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 flex flex-col focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      {isMobile && isSidebarOpen && (
        <div
          ref={mobileSidebarRef}
          className="fixed inset-0 z-50 bg-black/50"
          aria-label="Mobile sidebar navigation"
          aria-modal="true"
          role="dialog"
          onClick={(e) => {
            // Close when clicking the backdrop (not the sidebar panel itself).
            if (e.target === e.currentTarget) {
              setSidebarOpen(false);
            }
          }}
        >
          <div className="h-full w-full sm:w-4/5 max-w-sm bg-white dark:bg-[#101010] overflow-auto">
            <SideBar />
          </div>
        </div>
      )}

      {/* Global floating feedback widget */}
      <FeedbackWidget />

      {/*
       * Global keyboard shortcut help modal.
       * Triggered by pressing '?' (Shift + /) anywhere in the app.
       * The useShortcutModal hook attached above manages open state and
       * registers the keydown listener on the window.
       */}
      <ShortcutHelpModal
        open={isShortcutModalOpen}
        onClose={closeShortcutModal}
      />
    </div>
  );
}
