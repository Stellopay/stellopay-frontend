"use client";

import {
  AccountSummaryIcon,
  DashBoardIcon,
  HelpCircleIcon,
  SettinIcon,
  TransactionIcon,
} from "@/public/svg/svg";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import useSidebar from "@/context/sidebar-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useId, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/theme-context";
import { useDirtyGuard } from "@/context/dirty-guard-context";
import { transition } from "@/lib/motion";
import {
  isLinkActive,
  shouldExpandSidebar,
  getActiveLinkLayoutId,
} from "@/utils/navigationUtils";

type NavItem = {
  link: string;
  icon: (color: string) => ReactNode;
  route: string;
};

type CollapsedNavLinkProps = {
  item: NavItem;
  iconColor: string;
  isActive: boolean;
  reducedMotion: boolean;
};

/**
 * A collapsed sidebar link with a keyboard- and pointer-accessible label.
 *
 * The link remains the interactive element so the navigation semantics and
 * tab order do not change. The local Popover primitive supplies the visual
 * label on hover and focus; the link's aria-label makes the icon-only state
 * understandable even when a tooltip is unavailable.
 */
function CollapsedNavLink({
  item,
  iconColor,
  isActive,
  reducedMotion,
}: CollapsedNavLinkProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { isDirty, confirmNavigation } = useDirtyGuard();

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isDirty && !confirmNavigation()) {
      event.preventDefault();
    }
  };
  const tooltipId = useId();
  const isTooltipOpen = isHovered || isFocused;

  return (
    <li className="relative flex w-full justify-center">
      <Popover
        open={isTooltipOpen}
        onOpenChange={(open) => {
          // Radix can request a close after an outside interaction or Escape.
          // Clear both sources so the controlled state does not immediately
          // reopen the label while the trigger is still mounted.
          if (!open) {
            setIsHovered(false);
            setIsFocused(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Link
            href={item.route}
            aria-label={item.link}
            aria-current={isActive ? "page" : undefined}
            aria-describedby={isTooltipOpen ? tooltipId : undefined}
            aria-controls={isTooltipOpen ? tooltipId : undefined}
            aria-haspopup={undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={handleNavigation}
            className={`cursor-pointer my-1.5 p-3 relative rounded-xl flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isActive
                ? ""
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <span className="relative z-20 flex items-center justify-center">
              {item.icon(iconColor)}
            </span>

            {item.link.toLowerCase() === "transactions" && !isActive && (
              <div
                aria-hidden="true"
                className="bg-[#EB6945] w-2 h-2 rounded-full -top-1 -right-1 absolute z-20 border border-white dark:border-[#101010]"
              />
            )}

            {isActive &&
              (reducedMotion ? (
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 w-8 h-8 self-center bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                />
              ) : (
                <motion.div
                  aria-hidden="true"
                  className="absolute left-0 top-0 w-8 h-8 self-center bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                  layoutId="activeLink-collapsed"
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.6,
                  }}
                />
              ))}
          </Link>
        </PopoverTrigger>

        <PopoverContent
          id={tooltipId}
          role="tooltip"
          side="right"
          align="center"
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="w-auto max-w-[calc(100vw-1rem)] break-words border-border bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-xl"
        >
          {item.link}
        </PopoverContent>
      </Popover>
    </li>
  );
}

export const NavLink = () => {
  const pathname = usePathname() || "/";
  const { theme } = useTheme();
  const { isSidebarOpen, isMobile } = useSidebar();
  const reducedMotion = useReducedMotion();

  const isExpanded = shouldExpandSidebar(isMobile, isSidebarOpen);

  const { isDirty, confirmNavigation } = useDirtyGuard();

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isDirty && !confirmNavigation()) {
      event.preventDefault();
    }
  };

  const links: NavItem[] = [
    {
      link: "Dashboard",
      icon: (color: string) => <DashBoardIcon color={color} />,
      route: "/dashboard",
    },
    {
      link: "Account Summary",
      icon: (color: string) => <AccountSummaryIcon color={color} />,
      route: "/account-summary",
    },
    {
      link: "Transactions",
      icon: (color: string) => <TransactionIcon color={color} />,
      route: "/transactions",
    },
    {
      link: "Help/Support",
      icon: (color: string) => <HelpCircleIcon color={color} />,
      route: "/help/support",
    },
    {
      link: "Settings",
      icon: (color: string) => <SettinIcon color={color} />,
      route: "/settings/preferences",
    },
  ];

  const transactionNotification = 10;

  return (
    <nav className="w-full">
      <ul className="space-y-1 flex items-center flex-col w-full px-2">
        {links.map((link) => {
          const isActive = isLinkActive(link.route, pathname);

          let iconColor = "";
          if (isActive) {
            iconColor = theme === "dark" ? "#0D0D0D" : "#FFFFFF";
          } else {
            iconColor = theme === "dark" ? "#E5E5E5" : "#71717A";
          }

          if (isExpanded) {
            return (
              <li key={link.route} className="w-full">
                <Link
                  href={link.route}
                  aria-current={isActive ? "page" : undefined}
                  onClick={handleNavigation}
                  className={`cursor-pointer py-3.5 px-4 w-full relative rounded-xl flex justify-between items-center transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive
                      ? "text-white dark:text-[#0D0D0D]"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex gap-3 items-center relative z-20">
                    <div className="flex items-center justify-center transition-colors">
                      {link.icon(iconColor)}
                    </div>
                    <span className="font-medium text-sm">{link.link}</span>
                  </div>

                  {link.link.toLowerCase() === "transactions" && (
                    <div
                      className={`px-2 py-0.5 rounded-full relative z-20 transition-colors ${
                        isActive
                          ? "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
                      }`}
                    >
                      <p className="text-[10px] font-bold">
                        {transactionNotification}
                      </p>
                    </div>
                  )}

                  {isActive &&
                    (reducedMotion ? (
                      <div className="absolute left-0 top-0 w-full h-full bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm" />
                    ) : (
                      <motion.div
                        className="absolute left-0 top-0 w-full h-full bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                        layoutId={getActiveLinkLayoutId(
                          isMobile,
                          isExpanded,
                        )}
                        transition={transition.spring}
                      />
                    ))}
                </Link>
              </li>
            );
          }

          return (
            <Tooltip
              key={index}
              placement="right"
              content={link.link}
              className="border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 px-3 py-1.5 shadow-xl rounded-md"
            >
              <li className="w-fit self-center relative w-full flex justify-center">
                <Link
                  href={link.route}
                  aria-current={isActive ? "page" : undefined}
                  onClick={handleNavigation}
                  className={`cursor-pointer my-1.5 p-3 relative rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? ""
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span className="relative z-20 flex items-center justify-center">
                    {link.icon(iconColor)}
                  </span>

                  {link.link.toLowerCase() === "transactions" && !isActive && (
                    <div className="bg-[#EB6945] w-2 h-2 rounded-full -top-1 -right-1 absolute z-20 border border-white dark:border-[#101010]" />
                  )}

                  {isActive &&
                    (reducedMotion ? (
                      <div
                        className="absolute left-0 top-0 w-8 h-8 self-center bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                        style={{ left: "50%", transform: "translateX(-50%)" }}
                      />
                    ) : (
                      <motion.div
                        className="absolute left-0 top-0 w-8 h-8 self-center bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                        style={{ left: "50%", transform: "translateX(-50%)" }}
                        layoutId="activeLink-collapsed"
                        transition={transition.spring}
                      />
                    ))}
                </Link>
              </li>
            </Tooltip>
          );
        })}
      </ul>
    </nav>
  );
};
