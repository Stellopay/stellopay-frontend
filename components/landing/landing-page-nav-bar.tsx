"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import NetworkSwitcher from "@/components/common/network-switcher";

/** CSS selector that matches all natively focusable elements. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Support", href: "/support" },
];

export default function LandingPageNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  /** Ref on the hamburger/close button — focus returns here when drawer closes. */
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  /** Ref on the mobile drawer — used to query focusable children. */
  const drawerRef = useRef<HTMLDivElement>(null);

  // ── Close on route change ──────────────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // ── Focus trap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;

    // Move initial focus into the drawer on open.
    const drawer = drawerRef.current;
    if (drawer) {
      const firstFocusable = drawer.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    }

    /** Trap Tab/Shift+Tab within the drawer; close on Escape. */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
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
  }, [menuOpen]);

  // ── Return focus to the trigger button when the drawer closes ─────────────
  const prevMenuOpen = useRef(menuOpen);
  useEffect(() => {
    if (prevMenuOpen.current && !menuOpen) {
      menuButtonRef.current?.focus();
    }
    prevMenuOpen.current = menuOpen;
  }, [menuOpen]);

  // ── Lock body scroll when drawer is open ───────────────────────────────────
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleClose = () => setMenuOpen(false);

  return (
    <nav className="w-full h-[75px] px-4 md:px-8 absolute top-0 left-0 z-50 bg-transparent">
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
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Network Switcher */}
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
          ref={menuButtonRef}
          className="md:hidden flex flex-col items-center justify-center p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF]"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-drawer"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X size={24} strokeWidth={2} color="#598EFF" />
          ) : (
            <>
              <span className="block w-6 h-0.5 bg-[#598EFF] mb-1 transition-transform duration-200"></span>
              <span className="block w-6 h-0.5 bg-[#598EFF] mb-1 transition-opacity duration-200"></span>
              <span className="block w-6 h-0.5 bg-[#598EFF] transition-transform duration-200"></span>
            </>
          )}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        id="landing-mobile-drawer"
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-[280px] max-w-[85vw] md:hidden bg-[#0D0D0D] shadow-2xl transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation menu"
        aria-modal="true"
        role="dialog"
      >
        <div className="flex flex-col h-full pt-20 pb-6 px-6">
          {/* Close button inside the drawer */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF]"
            aria-label="Close navigation menu"
          >
            <X size={24} strokeWidth={2} />
          </button>

          {/* Navigation links */}
          <nav className="flex flex-col gap-2 mt-4" aria-label="Mobile navigation links">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white text-lg font-normal py-3 px-4 rounded-lg hover:bg-white/10 hover:text-[#598EFF] transition-colors duration-200"
                style={{ fontFamily: "General Sans, sans-serif" }}
                onClick={handleClose}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-zinc-800">
            <div className="flex justify-center mb-2">
              <NetworkSwitcher variant="landing" />
            </div>
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-full border border-[#598EFF] text-[#EEF4FF] bg-transparent font-medium transition-colors duration-200 hover:bg-[#598EFF] hover:text-white text-center"
              style={{ fontFamily: "General Sans, sans-serif" }}
              onClick={handleClose}
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-6 py-3 rounded-full bg-[#598EFF] text-white font-medium transition-colors duration-200 hover:bg-[#4A7CE8] text-center"
              style={{ fontFamily: "General Sans, sans-serif" }}
              onClick={handleClose}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
