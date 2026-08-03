"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import NetworkSwitcher from "@/components/common/network-switcher";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Support", href: "/support" },
];

/** Selector for all keyboard-reachable elements inside a container. */
const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

export default function LandingPageNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Close on route change ─────────────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // ── Close on Escape + focus trap ─────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!menuOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab — wrap from first to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab — wrap from last to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [menuOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Close on outside click ────────────────────────────────────────────────
  const handleOverlayClick = useCallback(() => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  // ── When menu opens, move focus into the panel ────────────────────────────
  useEffect(() => {
    if (menuOpen) {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();

      // Prevent body scroll while menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      if (open) {
        // Closing — return focus to the trigger
        hamburgerRef.current?.focus();
      }
      return !open;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  return (
    <>
      <nav
        className="w-full h-[75px] px-4 md:px-8 absolute top-0 left-0 z-50 bg-transparent"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 md:py-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-light text-xl md:text-2xl"
            style={{ fontFamily: "Clash Display, sans-serif", color: "#598EFF" }}
          >
            StelloPay
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white text-base font-normal hover:text-[#598EFF] transition-colors duration-200"
                style={{ fontFamily: "General Sans, sans-serif" }}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <NetworkSwitcher variant="landing" />
            <Link
              href="/auth/login"
              className="px-6 py-4 rounded-full border border-[#598EFF] text-[#EEF4FF] bg-transparent font-medium transition-colors duration-200 hover:bg-[#598EFF] hover:text-white"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-6 py-4 rounded-full bg-[#598EFF] text-white font-medium transition-colors duration-200 hover:bg-[#4A7CE8] hover:shadow-lg"
              style={{ fontFamily: "General Sans, sans-serif" }}
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            ref={hamburgerRef}
            data-testid="hamburger-button"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-haspopup="dialog"
            onClick={toggleMenu}
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-[#598EFF]" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6 text-[#598EFF]" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Backdrop overlay ─────────────────────────────────────────────── */}
      {/* Rendered below the panel so panel sits on top */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        onClick={handleOverlayClick}
        className={[
          "fixed inset-0 z-[98] bg-black/60 md:hidden",
          "transition-opacity duration-300",
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Slide-in panel ───────────────────────────────────────────────── */}
      <div
        id="mobile-nav-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        aria-hidden={!menuOpen}
        className={[
          // Layout
          "fixed top-0 right-0 h-full w-[min(80vw,320px)] z-[99]",
          // Colours
          "bg-[#0a0a0a] border-l border-white/10",
          // Slide animation — translate from 100% (off-screen) to 0
          "transform transition-transform duration-300 ease-in-out",
          menuOpen ? "translate-x-0" : "translate-x-full",
          // Hide from AT when closed so hidden links are not reachable
          menuOpen ? "" : "invisible",
          // Only show below md breakpoint
          "md:hidden",
        ].join(" ")}
      >
        {/* Panel inner scroll area */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Panel header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <span
              className="font-light text-xl"
              style={{ fontFamily: "Clash Display, sans-serif", color: "#598EFF" }}
            >
              StelloPay
            </span>
            <button
              className="flex items-center justify-center w-10 h-10 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <X className="w-5 h-5 text-[#598EFF]" aria-hidden="true" />
            </button>
          </div>

          {/* Nav links */}
          <nav aria-label="Mobile navigation links" className="flex flex-col px-6 gap-1 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={[
                  "py-3 text-lg font-normal transition-colors duration-200",
                  "border-b border-white/5 last:border-none",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF] rounded",
                  pathname === link.href
                    ? "text-[#598EFF]"
                    : "text-white hover:text-[#598EFF]",
                ].join(" ")}
                style={{ fontFamily: "General Sans, sans-serif" }}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Auth + Network section */}
          <div className="flex flex-col gap-3 px-6 pb-8 pt-4 border-t border-white/10">
            <div className="flex justify-center mb-1">
              <NetworkSwitcher variant="landing" />
            </div>
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-full border border-[#598EFF] text-[#EEF4FF] bg-transparent font-medium transition-colors duration-200 hover:bg-[#598EFF] hover:text-white text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF]"
              style={{ fontFamily: "General Sans, sans-serif" }}
              onClick={closeMenu}
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-6 py-3 rounded-full bg-[#598EFF] text-white font-medium transition-colors duration-200 hover:bg-[#4A7CE8] hover:shadow-lg text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF]"
              style={{ fontFamily: "General Sans, sans-serif" }}
              onClick={closeMenu}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
