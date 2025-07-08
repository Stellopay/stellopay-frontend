import React from "react";
import { BellIcon, ChevronRight, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationItem } from "@/types/notification-item";
import { NotificationProps } from "@/types/ui";

const NotificationPanel = ({ className, notifications }: NotificationProps) => {
  return (
    <div className="bg-[#0D0D0D80]  bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl  p-4 text-[#E5E5E5]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            className="bg-[#121212] border border-[#2E2E2E] cursor-pointer hover:bg-inherit "
            size="icon"
          >
            <BellIcon />
          </Button>

          <span>Notifications</span>
        </div>
        <Button className="bg-[#12121266] border border-[#2E2E2E] cursor-pointer px-2! hover:bg-inherit">
          <p className="text-[#E5E5E5] font-light">View All</p>
          <ChevronRight />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center"
          >
            <div className="grid gap-1">
              <p className="font-light text-[#E5E5E5] text-sm">
                {notification.title}
              </p>
              <p className="text-xs text-[#505050] truncate">
                {notification.message}
              </p>
            </div>
            <div className="relative w-[24px] h-[24px] flex items-center justify-center bg-[#0D0D0D80]/50 border border-[#2E2E2E] rounded-sm">
              <IconBell />
              {!notification.read && (
                <div className=" absolute top-2 right-[7px]  w-1 h-1 bg-[#EB6945] rounded-full" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
