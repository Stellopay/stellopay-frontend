"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";

export default function PaymentHistory() {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Array<{ title: string; message: string; read: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const result = await apiGet<{ notifications: Array<{ title: string; message: string; read: boolean }> }>(
          `/notifications/${address}?limit=3`
        );
        console.log("[payment-history] Fetched notifications:", result.notifications?.length || 0);
        setNotifications(result.notifications || []);
      } catch (e) {
        console.error("[payment-history] Failed to fetch notifications:", e);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [address]);

  if (loading) {
    return (
      <div className="max-w-full h-[15.5rem] gap-4 mt-3.5 flex items-center justify-center text-[#A0A0A0]">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="max-w-full h-[15.5rem] gap-4 mt-3.5 flex items-center justify-center text-[#A0A0A0]">
        No notifications
      </div>
    );
  }

  return (
    <div className="max-w-full h-[15.5rem] gap-4 mt-3.5">
      <div className='flex flex-col gap-3.5'>
        {notifications.map((notification, index) => (
          <div key={`${notification.title}-${index}`}>
            <div className='w-full h-[4.5rem] font-[Inter] text-sm align-middle gap-2.5 py-3 px-6 border border-[#2D2D2D] rounded-md text-[#E5E5E5] flex'>
              <div className="w-full">
                {notification.title}
                <div className='font-[Inter] font-medium text-xs align-middle text-[#535353]'> 
                  {notification.message}
                </div> 
              </div>

              <div className='w-6 h-6 border-[0.75px] relative border-[#2E2E2E] rounded-[6px] flex justify-center items-center'>
                <Image src='/notification.png' alt="notify" width={24} height={24} className="w-4 h-4 object-contain"/>
                {!notification.read && (
                  <span className="w-1 h-1 absolute -top-0.5 -right-0.5 bg-[#EB6945] rounded-full"></span>
                )}
              </div>     
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

 