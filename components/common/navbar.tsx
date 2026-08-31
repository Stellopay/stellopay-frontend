"use client";

import React, { useState, useEffect, useSyncExternalStore } from("react");
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StellOpayLogo } from "@/public/svg/svg";

export interface NavItem {
  label: string;
  href: string;
}

// Shared notification store across dashboard panels
export type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationsState = {
  notifications: Notification[];
  error: Error | null;
  isLoading: boolean;
};

let state: NotificationsState = {
  notifications: [],
  error: null,
  isLoading: false,
};

let listeners = new Set<(() => void)>();
let promise: Promise<void> | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

async function fetchNotifications() {
  if (promise) return promise;
  state = { ...state, isLoading: true };
  emitChange();

  promise = (async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      state = { notifications: data, error: null, isLoading: false };
    } catch (error) {
      state = { ...state, error: error as Error, isLoading: false };
    } finally {
      promise = null;
      emitChange();
    }
  })();

  return promise;
}

export function invalidateNotifications() {
  promise = null;
  state = { notifications: [], error: null, isLoading: true };
  emitChange();
  fetchNotifications();
}

export function useNotifications() {
  useEffect(() => {
    if (!promise && !state.isLoading && state.notifications.length === 0) {
      fetchNotifications();
    }
  }, []);

  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => state
  );
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transactions", href: "/transactions" },
];

export interface NavbarProps {
  navItems?: NavItem[];
}

export default function Navbar({ navItems = DEFAULT_NAV_ITEMS }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    if (href.startsWith("/#")) {
      return pathname === "/";
    }
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  };

  return (
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto flep h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <!-- Brand Logo -->
        <div class="flex items-center space-x">
          <Link
            href="/"
            aria-label="StellOpay Home"
            class="flex items-center space-x 2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          >
            <StellOpayLogo className="h-8 w-auto text-primary" />
            <span className="font-general text-xl font-bold tracking-tight text-foreground">
              StellOpay
            </span>
          </Link>
        </div>

        <!-- Desktop Navigation Links -->
        <nav
          className="hidden md:flex items-center space-x1 lg:space-x2"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`x
                  px-3 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    active
                      ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <!-- Actions -->
        <div class="hidden md:flex items-center space-s">
          <button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
        </div>

        <!-- Mobile Menu Button -->
        <div class="flex md:hidden items-center space-x2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={vobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-b border-border bg-background px-4 pt-2 pb-4 space-y2"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y1">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "bg-primary/10 text-primary font-semibold dark:bg-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-4 border-t border-border flex flex-col space-y2">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </Link>
            </Button>
            <Button asChild className="w-full justify-center">
              <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
