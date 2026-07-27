"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/theme-context";
import NetworkSwitcher from "@/components/common/network-switcher";
import { safeStorage } from "@/utils/safeStorage";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/dashboard", label: "Dashboard" },
];
const MOBILE_NAV_STORAGE_KEY = "landingMobileNavOpen";

export default function Navbar() {
  const pathname = usePathname() || "/";
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasHydratedMobileNav, setHasHydratedMobileNav] = useState(false);

  useEffect(() => {
    const storedState = safeStorage.getItem(MOBILE_NAV_STORAGE_KEY);
    if (storedState === "true" || storedState === "false") {
      setMobileOpen(storedState === "true");
    }
    setHasHydratedMobileNav(true);
  }, []);

  useEffect(() => {
    // Avoid replacing a saved preference with the SSR-safe default before it restores.
    if (!hasHydratedMobileNav) return;

    safeStorage.setItem(MOBILE_NAV_STORAGE_KEY, mobileOpen.toString());
  }, [hasHydratedMobileNav, mobileOpen]);

  const handleConnect = () => {
    // TODO: integrate wallet modal/connector here.
    alert("Connect Wallet clicked (stub)");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white dark:bg-[#0b0b0b] rounded-2xl border border-[#E4E4E7] dark:border-[#27272A] shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src={resolvedTheme === "dark" ? "/logos/LOGO A/PNG/StelloPay Brand-13.png" : "/logos/LOGO A/PNG/StelloPay Brand-14.png"}
                  alt="StelloPay Logo"
                  width={130}
                  height={32}
                  priority
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Center: Nav links */}
            <nav className="hidden xl:flex items-center justify-center gap-8">
              {navLinks.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`text-sm md:text-base font-medium transition-colors px-2 py-1 ${
                      active
                        ? "text-[#0f172a] dark:text-white"
                        : "text-[#52525B] dark:text-[#A3A3A3] hover:text-[#0f172a] dark:hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: controls */}
            <div className="flex items-center justify-end gap-3">
              <button
                aria-label={theme === "light" ? "Switch to dark mode" : theme === "dark" ? "Switch to system mode" : "Switch to light mode"}
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                {resolvedTheme === "light" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#0F172A" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zM17.24 19.16l1.8 1.79 1.79-1.79-1.79-1.8-1.8 1.8zM20 11v2h3v-2h-3zM4.22 19.78l1.79-1.79-1.8-1.8L2.41 17.98l1.81 1.8zM12 4a8 8 0 100 16 8 8 0 000-16z" fill="#F3F4F6" />
                  </svg>
                )}
              </button>

              <NetworkSwitcher variant="landing" />

              <button
                onClick={handleConnect}
                className={`hidden xl:inline-flex items-center px-5 py-2 rounded-full font-medium transition-shadow shadow-sm ${
                  resolvedTheme === "dark"
                    ? "bg-white text-black hover:opacity-95"
                    : "bg-black text-white hover:opacity-95"
                }`}
              >
                Connect Wallet
              </button>

              <button
                className="xl:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={() => setMobileOpen((s) => !s)}
              >
                {mobileOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18L18 6M6 6l12 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M3 12h18M3 18h18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          className="xl:hidden absolute left-0 right-0 top-full z-40 mt-2"
          aria-label="Mobile navigation menu"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-[#0b0b0b] border-b border-[#E4E4E7] dark:border-[#27272A] rounded-b-2xl py-4 space-y-2 px-4">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-[#0f172a] dark:text-white py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-center">
                <NetworkSwitcher variant="landing" />
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
