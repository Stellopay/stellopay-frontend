"use client";

import type React from "react";
import { SideBar } from "./side-bar";
import Navbar from "@/components/common/navbar";
import useSidebar from "@/context/sidebar-context";
import { AppLayoutProps } from "@/types/ui";

export default function AppLayout({ children }: AppLayoutProps) {
  const { isSidebarOpen, isMobile } = useSidebar();

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
        {/* Sidebar for desktop */}
        {!isMobile && <SideBar />}

        {/* Main content area */}
        <div className="relative h-full overflow-y-auto overflow-x-hidden flex flex-col scrollbar-hide">
          <Navbar />
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
    </div>
  );
}
