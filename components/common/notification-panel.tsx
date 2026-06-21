import React from "react";
import { BellIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationPanelProps extends NotificationProps {
  isLoading?: boolean;
}

const NotificationPanel = ({
  className: _className,
  notifications,
  isLoading = false,
}: NotificationPanelProps) => {
  if (isLoading) {
    return (
      <div className="bg-[#0D0D0D80] bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl p-4 text-[#E5E5E5]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-3 px-5 flex justify-between items-center"
            >
              <div className="grid gap-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="w-6 h-6 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D0D80]  bg-opacity-50 border border-[#2D2D2D] max-w-[400px] rounded-xl  p-4 text-[#E5E5E5]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Open notifications"
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

      <div
        role="region"
        aria-label="Notifications list"
        aria-live="polite"
        className="flex flex-col gap-4"
      >
        {notifications.length === 0 ? (
          <div className="bg-[#12121266] bg-opacity-40 border border-[#2D2D2D] rounded-lg p-5 text-center">
            <p className="font-light text-[#E5E5E5] text-sm">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-xs text-[#707070]">
              New transaction notifications will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              data-testid={`notification-${notification.id}`}
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
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
