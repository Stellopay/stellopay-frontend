"use client";

import React, { useState } from "react";
import { BellIcon, ChevronRight, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationItem } from "@/types/notification-item";
import { NotificationProps } from "@/types/ui";

const NotificationPanel = ({ className, notifications }: NotificationProps) => {
  const [showAll, setShowAll] = useState(false);
  // Always show all notifications when "View All" is clicked, but make the container scrollable
  const displayedNotifications = notifications;

  return (
    <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] w-full max-w-[500px] rounded-xl p-3 text-[#E5E5E5] flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-3 flex-shrink-0 px-1 gap-4">
        <div className="flex items-center gap-2.5">
          <Button
            className="bg-[#121212] border border-[#2E2E2E] cursor-pointer hover:bg-inherit h-8 w-8"
            size="icon"
          >
            <BellIcon className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium">Notifications</span>
        </div>
        {notifications.length > 3 && (
          <Button 
            className="bg-[#12121266] border border-[#2E2E2E] cursor-pointer px-2.5 py-1.5 h-7 hover:bg-inherit flex items-center gap-1"
            onClick={() => setShowAll(!showAll)}
          >
            <p className="text-[#E5E5E5] font-light text-xs">{showAll ? "Show Less" : "View All"}</p>
            <ChevronRight className={`h-3 w-3 ${showAll ? "rotate-90" : ""}`} />
          </Button>
        )}
      </div>

      <div 
        className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-3 min-h-0 pb-0 notification-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#2D2D2D transparent',
        }}
      >
        {displayedNotifications.length === 0 ? (
          <div className="text-center text-[#A0A0A0] py-4 text-xs">No notifications</div>
        ) : (
          <>
            {showAll ? (
              // Show all notifications with scroll
              displayedNotifications.map((notification, index) => (
                <div
                  key={index}
                  className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-2.5 px-3 flex justify-between items-center flex-shrink-0"
                >
                  <div className="grid gap-0.5 flex-1 min-w-0 pr-2">
                    <p className="font-light text-[#E5E5E5] text-xs">
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-[#505050] truncate">
                      {notification.message}
                    </p>
                  </div>
                  <div className="relative w-5 h-5 flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm flex-shrink-0">
                    <IconBell className="h-3 w-3" />
                    {!notification.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-[#EB6945] rounded-full" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Show only first 3 notifications
              displayedNotifications.slice(0, 5).map((notification, index) => (
                <div
                  key={index}
                  className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-2.5 px-3 flex justify-between items-center flex-shrink-0"
                >
                  <div className="grid gap-0.5 flex-1 min-w-0 pr-2">
                    <p className="font-light text-[#E5E5E5] text-xs">
                      {notification.title}
                    </p>
                    <p className="text-[10px] text-[#505050] truncate">
                      {notification.message}
                    </p>
                  </div>
                  <div className="relative w-5 h-5 flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm flex-shrink-0">
                    <IconBell className="h-3 w-3" />
                    {!notification.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-[#EB6945] rounded-full" />
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
