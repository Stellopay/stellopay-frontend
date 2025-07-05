"use client"

import NotificationPanel from "@/components/NotificationPanel"
import DashboardHeader from "@/components/DashboardHeader"

// Mock notifications
const notifications = [
  {
    title: "Payment Sent",
    message: "#TXN12345 · Your payment of 250 XLM to...",
    read: false,
  },
  {
    title: "Payment Received",
    message: "#TXN12345 · You've received 500 USDC...",
    read: true,
  },
  {
    title: "Low Balance Alert",
    message: "Your balance is below 50 XLM. Consider adding...",
    read: false,
  },
]

export default function Home() {
  return (
    <>
      <DashboardHeader pageTitle="" />
      <div className="flex flex-col gap-[32px] items-center mt-12 pb-20">
        <NotificationPanel notifications={notifications} />
      </div>
    </>
  )
}
