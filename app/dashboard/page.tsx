import DashboardHeader from "@/components/DashboardHeader";
import NotificationPanel from "@/components/NotificationPanel";
import React from "react";

const page = () => {
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
  ];
  return (
    <div>
      {" "}
      <DashboardHeader pageTitle="Dashboard" />
      <main className="min-h-screen flex justify-center items-center">
        {" "}
        <NotificationPanel notifications={notifications} />
      </main>
    </div>
  );
};

export default page;
