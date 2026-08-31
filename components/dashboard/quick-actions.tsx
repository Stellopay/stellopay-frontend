"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  ArrowDownToLine,
  Plus,
  FileText,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/commonUtils";
import { messages } from "@/messages";

// TODO: Replace direct import of messages with next-intl useTranslations() hook once i18n is enabled.

/**
 * Configuration for a single quick-action card.
 *
 * Exactly one of `href`, `onClick`, or `disabled` should be set:
 * - `href`: navigates to an internal app route
 * - `onClick`: opens a modal or triggers an in-page flow
 * - `disabled`: renders a non-interactive "Coming soon" card
 */
export interface QuickActionItem {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /**
   * Internal app route for link-based navigation.
   * Must be a relative path (e.g. "/transactions") — external URLs are not permitted.
   */
  href?: string;
  /** Handler for actions that open a modal or trigger an in-page flow. */
  onClick?: () => void;
  /**
   * When true the card is rendered as a non-interactive affordance with a
   * visible "Coming soon" label and is excluded from the tab order.
   */
  disabled?: boolean;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  /** Optional keyboard shortcut key (e.g. "s", "r") */
  shortcut?: string;
}

/** Default set of quick actions shown on the dashboard. */
const defaultActions: QuickActionItem[] = [
  {
    icon: Send,
    title: messages.dashboard.quickActions.actions.sendPayment.title,
    subtitle: messages.dashboard.quickActions.actions.sendPayment.subtitle,
    href: "/transactions",
    shortcut: "s",
    borderColor: "border-[#3B82F6] dark:border-[#2563EB]",
    bgColor: "bg-[#EFF6FF] dark:bg-[#1E3A5F]",
    iconColor: "text-[#2563EB] dark:text-[#60A5FA]",
  },
  {
    icon: ArrowDownToLine,
    title: messages.dashboard.quickActions.actions.requestPayment.title,
    subtitle: messages.dashboard.quickActions.actions.requestPayment.subtitle,
    disabled: true,
    shortcut: "p",
    borderColor: "border-[#E5E5E5] dark:border-[#2E2E2E]",
    bgColor: "bg-[#F5F5F5] dark:bg-[#1A1A1A]",
    iconColor: "text-[#16A34A] dark:text-[#4ADE80]",
  },
  {
    icon: Plus,
    title: messages.dashboard.quickActions.actions.newContract.title,
    subtitle: messages.dashboard.quickActions.actions.newContract.subtitle,
    disabled: true,
    shortcut: "c",
    borderColor: "border-[#E5E5E5] dark:border-[#2E2E2E]",
    bgColor: "bg-[#F5F5F5] dark:bg-[#1A1A1A]",
    iconColor: "text-[#7C3AED] dark:text-[#A78BFA]",
  },
  {
    icon: FileText,
    title: messages.dashboard.quickActions.actions.createInvoice.title,
    subtitle: messages.dashboard.quickActions.actions.createInvoice.subtitle,
    disabled: true,
    shortcut: "i",
    borderColor: "border-[#E5E5E5] dark:border-[#2E2E2E]",
    bgColor: "bg-[#F5F5F5] dark:bg-[#1A1A1A]",
    iconColor: "text-[#EA580C] dark:text-[#FB923C]",
  },
  {
    icon: Users,
    title: messages.dashboard.quickActions.actions.addRecipient.title,
    subtitle: messages.dashboard.quickActions.actions.addRecipient.subtitle,
    disabled: true,
    shortcut: "a",
    borderColor: "border-[#E5E5E5] dark:border-[#2E2E2E]",
    bgColor: "bg-[#F5F5F5] dark:bg-[#1A1A1A]",
    iconColor: "text-[#EC4899] dark:text-[#F472B6]",
  },
  {
    icon: BarChart3,
    title: messages.dashboard.quickActions.actions.viewReports.title,
    subtitle: messages.dashboard.quickActions.actions.viewReports.subtitle,
    href: "/analytics-view",
    shortcut: "r",
    borderColor: "border-[#E5E5E5] dark:border-[#2E2E2E]",
    bgColor: "bg-[#F5F5F5] dark:bg-[#1A1A1A]",
    iconColor: "text-[#0D9488] dark:text-[#2DD4BF]",
  },
];

interface QuickActionsProps {
  actions?: QuickActionItem[];
  customizeHref?: string;
  onCustomize?: () => void;
}

/** Shared base styles for every action card. */
const cardBase =
  "flex flex-col rounded-2xl border p-5 transition-all bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50";

/** Additional styles applied only to interactive (enabled) cards. */
const cardInteractive =
  "group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:shadow-elevation-2 active:scale-[0.98]";

/**
 * Checks whether an element is an active text input field, textarea, select,
 * or contenteditable container where keyboard shortcuts should be suppressed.
 */
function isInputTarget(element: EventTarget | Element | null): boolean {
  if (!element || !("tagName" in element) || typeof (element as Element).tagName !== "string") {
    return false;
  }
  const el = element as HTMLElement;
  const tagName = el.tagName.toUpperCase();
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  if (
    el.isContentEditable ||
    el.getAttribute?.("contenteditable") === "true" ||
    el.getAttribute?.("contenteditable") === "" ||
    (typeof el.closest === "function" &&
      el.closest("[contenteditable]:not([contenteditable='false'])") !== null)
  ) {
    return true;
  }
  return false;
}

export function QuickActions({
  actions = defaultActions,
  customizeHref,
  onCustomize,
}: QuickActionsProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const getEnabledCards = useCallback(() => {
    if (!gridRef.current) return [];
    return Array.from(
      gridRef.current.querySelectorAll<HTMLElement>("[data-quick-action]"),
    );
  }, []);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const cards = getEnabledCards();
      if (cards.length === 0) return;

      const currentActive = cards.findIndex(
        (card) => card === document.activeElement,
      );
      const currentIndex = currentActive >= 0 ? currentActive : activeIndex;

      let nextIndex = currentIndex;
      const cols =
        gridRef.current
          ? window.getComputedStyle(gridRef.current).gridTemplateColumns.split(" ")
              .length
          : 1;

      switch (e.key) {
        case "ArrowRight":
          if (currentIndex < cards.length - 1) nextIndex = currentIndex + 1;
          break;
        case "ArrowLeft":
          if (currentIndex > 0) nextIndex = currentIndex - 1;
          break;
        case "ArrowDown":
          if (currentIndex + cols < cards.length)
            nextIndex = currentIndex + cols;
          break;
        case "ArrowUp":
          if (currentIndex - cols >= 0)
            nextIndex = currentIndex - cols;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = cards.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        setActiveIndex(nextIndex);
        cards[nextIndex]?.focus();
      }
    },
    [activeIndex, getEnabledCards],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const activeEl = document.activeElement;
      const targetEl = event.target as Element | null;

      if (isInputTarget(activeEl) || isInputTarget(targetEl)) {
        return;
      }

      const pressedKey = event.key.toLowerCase();

      for (const action of actions) {
        if (
          !action.disabled &&
          action.shortcut &&
          action.shortcut.toLowerCase() === pressedKey
        ) {
          event.preventDefault();
          if (action.onClick) {
            action.onClick();
          } else if (action.href) {
            router.push(action.href);
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actions, router]);

  return (
    <section
      className={cn(
        "rounded-2xl border p-6 transition-all",
        "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 shadow-elevation-1",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          {messages.dashboard.quickActions.headerTitle}
        </h2>
        <div className="flex items-center gap-4">
          {customizeHref ? (
            <Link
              href={customizeHref}
              className="text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {messages.dashboard.quickActions.customize}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCustomize}
              className="text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {messages.dashboard.quickActions.customize}
            </button>
          )}
        </div>
      </div>

      {/* Action cards */}
      <div
        ref={gridRef}
        role="group"
        aria-label="Quick actions"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        onKeyDown={handleGridKeyDown}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;

          const iconNode = (
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform group-hover:scale-110",
                action.bgColor,
                action.iconColor,
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
          );

          if (action.disabled) {
            return (
              <div
                key={index}
                aria-label={`${action.title}, ${messages.dashboard.quickActions.comingSoon.toLowerCase()}`}
                className={cn(
                  cardBase,
                  "opacity-50 cursor-not-allowed select-none",
                )}
              >
                <div className="flex items-center gap-4">
                  {iconNode}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                        {action.title}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {action.subtitle}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {messages.dashboard.quickActions.comingSoon}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          const titleHint =
            action.shortcut && !action.disabled
              ? `${action.title} (Shortcut: ${action.shortcut.toUpperCase()})`
              : action.title;

          const content = (
            <div className="flex items-center gap-4">
              {iconNode}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                    {action.title}
                  </p>
                  {action.shortcut && (
                    <kbd
                      aria-label={`Shortcut ${action.shortcut.toUpperCase()}`}
                      className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded shadow-xs select-none shrink-0"
                    >
                      {action.shortcut.toUpperCase()}
                    </kbd>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {action.subtitle}
                </p>
              </div>
            </div>
          );

          if (action.href) {
            return (
              <Link
                key={index}
                href={action.href}
                data-quick-action
                tabIndex={index === activeIndex ? 0 : -1}
                className={cn(cardBase, cardInteractive)}
                aria-label={action.title}
                title={titleHint}
                onFocus={() => setActiveIndex(index)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={index}
              type="button"
              data-quick-action
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={action.onClick}
              aria-label={action.title}
              title={titleHint}
              onFocus={() => setActiveIndex(index)}
              className={cn(cardBase, cardInteractive, "text-left w-full")}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
