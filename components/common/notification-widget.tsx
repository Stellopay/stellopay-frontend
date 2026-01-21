import React from "react";
import { BellIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBell } from "@/components/icons/bell-fill-icon";
import { NotificationProps } from "@/types/ui";

const NotificationWidget = ({ className, notifications }: NotificationProps) => {
    return (
        <div className={`w-full md:w-auto md:min-w-[350px] lg:min-w-[400px] h-full flex flex-col border-[#2D2D2D] bg-[#0D0D0D] text-[#E5E5E5] border rounded-xl overflow-hidden ${className}`}>
            <div className="p-4 border-b border-[#2D2D2D] flex justify-between items-center shrink-0">
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

            <div className="p-4 space-y-3 overflow-y-auto flex-1 h-0">
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
        </div>
    );
};

export default NotificationWidget;
