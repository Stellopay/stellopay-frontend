"use client";

import type React from "react";
import { SideBar } from "./side-bar";
import Navbar from "@/components/common/navbar";
import useSidebar from "@/context/sidebar-context";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { AppLayoutProps } from "@/types/ui";
import { ShortcutHelpModal } from "./shortcut-help-modal";
import { useShortcutModal } from "@/hooks/useShortcutModal";

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, isMobile } = useSidebar();
  const { isOpen: isShortcutModalOpen, close: closeShortcutModal } =
    useShortcutModal();

  // Enable global keyboard shortcuts (g + d/t/s) for navigation
  useGlobalShortcuts();

  return (
    <div className="relative h-screen overflow-hidden">
      {/*
       * Skip-to-content link — WCAG 2.4.1 (Bypass Blocks, Level A).
       *
       * Visually hidden at rest; becomes visible on keyboard focus so that
       * keyboard and screen-reader users can skip the nav/sidebar and jump
       * directly to the main content region.
       *
       * Tailwind utility breakdown:
       *   sr-only          — clip + position: absolute so it is off-screen
       *   focus:not-sr-only — undo the clip when the element receives focus
       *   focus:fixed       — pin it in the viewport when visible
       *   focus:top-4 / focus:left-4 — consistent top-left position
       *   focus:z-[100]    — ensure it renders above every other layer
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
        {/* Sidebar for desktop — <aside aria-label="Application sidebar"> wraps
            the NavLink <nav> inside side-bar.tsx, satisfying the WCAG 1.3.6
            landmark requirement for a uniquely-labelled complementary region. */}
        {!isMobile && <SideBar />}

        {/* Content column: stacks the site header above the page body */}
        <div className="relative h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-hide">
          {/*
           * <header> provides the ARIA "banner" landmark for the top-of-page
           * chrome (nav bar, wallet status, etc.).  When Navbar returns null
           * the element is still present in the DOM but is empty, which is
           * valid — it will be populated once Navbar renders real content.
           *
           * aria-label distinguishes this banner from any page-level <header>
           * elements that child routes may render inside <main>, preventing
           * an "landmark-unique" axe violation if a route wraps its own
           * heading region in a <header>.
           */}
          <header aria-label="Site header">
            <Navbar />
          </header>

          {/*
           * tabIndex={-1} makes the element programmatically focusable so
           * the browser moves focus here when the skip link is activated,
           * even though <main> is not natively focusable.
           */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 flex flex-col focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile fullscreen sidebar */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="h-full w-full sm:w-4/5 max-w-sm bg-[#101010] overflow-auto">
            <SideBar />
          </div>
        </div>
      )}

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
