"use client";

import React from "react";
import { BellIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useSidebar from "@/context/sidebar-context";

const NotificationPanel = ({ className, notifications }: NotificationProps) => {
  const { isMobile } = useSidebar();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 rounded-md relative cursor-pointer group">
          <BellIcon
            className="w-10 h-10 sm:w-6 sm:h-6 text-[#6e6d6e] group-hover:text-[#FFFFFF] transition-colors"
          />
          {notifications.some((n) => !n.read) && (
            <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2.5 h-2.5 bg-[#EB6945] rounded-full"></span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align={isMobile ? "center" : "end"}
        className="w-screen sm:w-[400px] p-0 border-[#2D2D2D] bg-[#0D0D0D] text-[#E5E5E5] shadow-xl z-50"
      >
        <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#121212] border border-[#2E2E2E] p-2 rounded-md">
              <BellIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">Notifications</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-[#E5E5E5] hover:bg-[#121212] hover:text-white border border-[#2E2E2E] bg-[#12121266]">
            <p className="font-light text-xs mr-1">View All</p>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No new notifications
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div
                key={index}
                className="bg-[#12121266] hover:bg-[#121212] transition-colors border border-[#2D2D2D] rounded-lg p-3 flex justify-between items-start gap-3"
              >
                <div className="grid gap-1">
                  <p className="font-medium text-[#E5E5E5] text-sm">
                    {notification.title}
                  </p>
                  <p className="text-xs text-[#888] line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                <div className="relative shrink-0 w-8 h-8 flex items-center justify-center bg-[#0D0D0D80] border border-[#2E2E2E] rounded-md">
                  <IconBell className="w-4 h-4" />
                  {!notification.read && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EB6945] rounded-full" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPanel;
