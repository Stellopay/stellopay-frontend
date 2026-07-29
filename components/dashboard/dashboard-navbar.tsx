"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Moon, Search, Settings, Sun, X, Menu } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { formatAddress, useWallet } from "@/context/wallet-context";
import NetworkSwitcher from "@/components/common/network-switcher";
import { StellOpayLogo } from "@/public/svg/svg";

/** CSS selector that matches all natively focusable elements. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function DashboardNavbar() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { address, isConnected, connect, disconnect } = useWallet();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  /** Ref on the hamburger/close button — focus returns here when drawer closes. */
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  /** Ref on the mobile drawer — used to query focusable children. */
  const drawerRef = useRef<HTMLElement>(null);

  // ── Focus trap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mobileDrawerOpen) return;

    // Move initial focus into the drawer on open.
    const drawer = drawerRef.current;
    if (drawer) {
      const firstFocusable = drawer.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    }

    /** Trap Tab/Shift+Tab within the drawer; close on Escape. */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
        return;
      }

      if (e.key !== "Tab" || !drawer) return;

      const focusableEls = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
  }, [mobileDrawerOpen]);

  // ── Return focus to the trigger button when the drawer closes ─────────────
  const prevMobileDrawerOpen = useRef(mobileDrawerOpen);
  useEffect(() => {
    if (prevMobileDrawerOpen.current && !mobileDrawerOpen) {
      menuButtonRef.current?.focus();
    }
    prevMobileDrawerOpen.current = mobileDrawerOpen;
  }, [mobileDrawerOpen]);

  // ── Lock body scroll when drawer is open ───────────────────────────────────
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      <nav
        className="w-full h-20 px-6 lg:px-10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#0D0D0D] transition-colors duration-200 sticky top-0 z-50"
        aria-label={mobileDrawerOpen ? "Main navigation, mobile drawer open" : "Main navigation"}
      >
        <div className="flex items-center gap-8 flex-1">
          <Link
            href="/"
            aria-label="StelloPay home"
            className="flex items-center gap-2 text-zinc-900 dark:text-white transition-colors duration-200"
          >
            <StellOpayLogo />
          </Link>

          <div className="relative max-w-md w-full hidden md:block">
            <Search
              size={20}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search transactions, contracts..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex">
            {/* Drives the shared wallet network through WalletProvider. */}
            <NetworkSwitcher variant="dashboard" />
          </div>

          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:block cursor-pointer"
          >
            <Bell size={20} strokeWidth={2} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0D0D0D]" />
          </button>

          <button
            aria-label="Settings"
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:block cursor-pointer"
          >
            <Settings size={20} strokeWidth={2} />
          </button>

          <button
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : theme === "dark"
                  ? "Switch to system mode"
                  : "Switch to light mode"
            }
            className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun size={20} strokeWidth={2} />
            ) : (
              <Moon size={20} strokeWidth={2} />
            )}
          </button>

          {isConnected ? (
            <button
              type="button"
              onClick={disconnect}
              data-testid="dashboard-navbar-disconnect"
              aria-label={`Disconnect wallet ${formatAddress(address)}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-zinc-800 dark:bg-zinc-100 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                </svg>
              </div>
              <span
                className="text-sm font-medium tracking-tight font-mono"
                data-testid="dashboard-navbar-address"
              >
                {formatAddress(address)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              data-testid="dashboard-navbar-connect"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="text-sm font-medium tracking-tight">
                Connect Wallet
              </span>
            </button>
          )}

          {/* Hamburger toggle — visible only below sm breakpoint */}
          <button
            ref={menuButtonRef}
            type="button"
            className="sm:hidden p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={mobileDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileDrawerOpen}
            aria-controls="dashboard-mobile-drawer"
            onClick={() => setMobileDrawerOpen((s) => !s)}
          >
            {mobileDrawerOpen ? (
              <X size={22} strokeWidth={2} />
            ) : (
              <Menu size={22} strokeWidth={2} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          aria-hidden="true"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <nav
          id="dashboard-mobile-drawer"
          ref={drawerRef}
          className="fixed top-20 left-0 right-0 z-40 sm:hidden"
          aria-label="Mobile navigation menu"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white dark:bg-[#0D0D0D] border-b border-zinc-200 dark:border-zinc-800 shadow-lg px-6 py-6 space-y-6">
            {/* Search */}
            <div className="relative w-full">
              <Search
                size={20}
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search transactions, contracts..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Notifications & Settings row */}
            <div className="flex items-center gap-4">
              <button
                aria-label="Notifications"
                className="flex items-center gap-3 p-3 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer w-full"
              >
                <Bell size={20} strokeWidth={2} />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Notifications
                </span>
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <button
                aria-label="Settings"
                className="flex items-center gap-3 p-3 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer w-full"
              >
                <Settings size={20} strokeWidth={2} />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Settings
                </span>
              </button>
            </div>

            {/* Network switcher */}
            <div className="flex justify-start">
              <NetworkSwitcher variant="dashboard" />
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
