"use client";
import {
  DashBoardIcon,
  HelpCircleIcon,
  SettinIcon,
  TransactionIcon,
} from "@/public/svg/svg";
import { motion } from "framer-motion";
import useSidebar from "@/context/sidebar-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/theme-context";
import {
  isLinkActive,
  shouldExpandSidebar,
  getActiveLinkLayoutId,
} from "@/utils/navigationUtils";

/**
 * Renders sidebar navigation with text labels when expanded and accessible
 * Radix tooltips for the icon-only collapsed state.
 */
export const NavLink = () => {
  const pathname = usePathname() || "/";
  const { theme } = useTheme();
  const { isSidebarOpen, isMobile } = useSidebar();

  const isExpanded = shouldExpandSidebar(isMobile, isSidebarOpen);

  const links = [
    {
      link: "Dashboard",
      icon: (color: string) => <DashBoardIcon color={color} />,
      route: "/dashboard",
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
      <TooltipProvider>
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
                    className={`cursor-pointer py-3.5 px-4 w-full relative rounded-xl flex justify-between items-center transition-all duration-200 group ${
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

                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-0 w-full h-full bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                        layoutId={getActiveLinkLayoutId(isMobile, isExpanded)}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={link.route}
                className="w-fit self-center relative w-full flex justify-center"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.route}
                      aria-label={link.link}
                      aria-current={isActive ? "page" : undefined}
                      className={`cursor-pointer my-1.5 p-3 relative rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? ""
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="relative z-20 flex items-center justify-center">
                        {link.icon(iconColor)}
                      </span>

                      {link.link.toLowerCase() === "transactions" &&
                        !isActive && (
                          <div className="bg-[#EB6945] w-2 h-2 rounded-full -top-1 -right-1 absolute z-20 border border-white dark:border-[#101010]" />
                        )}

                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-0 w-8 h-8 self-center bg-zinc-900 dark:bg-white rounded-xl z-10 shadow-sm"
                          style={{ left: "50%", transform: "translateX(-50%)" }}
                          layoutId="activeLink-collapsed"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.link}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </TooltipProvider>
    </nav>
  );
};
