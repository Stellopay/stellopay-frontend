"use client";
import {
  DashBoardIcon,
  HelpCircleIcon,
  SettinIcon,
  TransactionIcon,
} from "@/public/svg/svg";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import useSidebar from "@/context/SidebarContext";
import { Tooltip } from "@material-tailwind/react";

export const NavLink = () => {
  const [activeLink, setActiveLink] = useState("dashboard");
  const { isSidebarOpen, isMobile } = useSidebar();

  // Show expanded view on mobile or when desktop sidebar is expanded
  const isExpanded = isMobile || (isSidebarOpen && !isMobile);

  useEffect(() => {
    const savedLink = localStorage.getItem("activeLink");
    if (savedLink) setActiveLink(savedLink);
  }, []);

  const links = [
    {
      link: "Dashboard",
      icon: (color: string) => <DashBoardIcon color={color} />,
    },
    {
      link: "Transactions",
      icon: (color: string) => <TransactionIcon color={color} />,
    },
    {
      link: "Help/Support",
      icon: (color: string) => <HelpCircleIcon color={color} />,
    },
    {
      link: "Settings",
      icon: (color: string) => <SettinIcon color={color} />,
    },
  ];

  const transactionNotification = 10;

  return (
    <nav>
      <ul className="space-y-1 flex items-center flex-col">
        {links.map((link, index) => {
          const isActive = activeLink.toLowerCase() === link.link.toLowerCase();
          const iconColor = isActive ? "#0D0D0D" : "#E5E5E5";

          const commonClickHandler = () => {
            setActiveLink(link.link);
            localStorage.setItem("activeLink", link.link);
          };

          // Expanded version for mobile or desktop
          if (isExpanded) {
            return (
              <li
                key={index}
                onClick={commonClickHandler}
                className="cursor-pointer py-4 px-3 w-full relative rounded-lg flex justify-between items-center hover:bg-[#1c1c1c] transition-colors duration-150"
              >
                <div className="flex gap-3 items-center relative z-20">
                  <div className="flex items-center justify-center">
                    {link.icon(iconColor)}
                  </div>
                  <span
                    className={`${
                      isActive ? "text-[#0D0D0D]" : "text-white"
                    } transition-colors duration-150`}
                  >
                    {link.link}
                  </span>
                </div>

                {link.link.toLowerCase() === "transactions" && (
                  <div className="px-2 bg-[#191919] rounded-[10px] absolute top-1/2 right-3 -translate-y-1/2 z-20">
                    <p className="text-white text-xs font-medium">
                      {transactionNotification}
                    </p>
                  </div>
                )}

                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 w-full h-full bg-white transition duration-75 ease-in-out rounded-lg z-10"
                    layoutId={
                      isMobile ? "activeLink-mobile" : "activeLink-desktop"
                    }
                  />
                )}
              </li>
            );
          }

          // Collapsed version for desktop only
          return (
            <Tooltip
              key={index}
              placement="right"
              content={link.link}
              className="border border-blue-gray-50 text-black bg-white px-2 py-2 shadow-xl shadow-black/10"
            >
              <li
                onClick={commonClickHandler}
                className="cursor-pointer my-4 w-fit self-center p-2 relative rounded-lg flex items-center justify-center hover:bg-[#1c1c1c] transition-colors duration-150"
              >
                <span className="relative z-20 flex items-center justify-center">
                  {link.icon(iconColor)}
                </span>

                {link.link.toLowerCase() === "transactions" && (
                  <div className="bg-[#191919] rounded-full -bottom-2 right-0 absolute z-20 p-1">
                    <p className="text-white text-xs font-normal ">
                      {transactionNotification}
                    </p>
                  </div>
                )}

                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 w-full h-full bg-white transition duration-75 ease-in-out rounded-lg z-10 "
                    layoutId="activeLink-collapsed"
                    id="activeLink-collapsed"
                  />
                )}
              </li>
            </Tooltip>
          );
        })}
      </ul>
    </nav>
  );
};
