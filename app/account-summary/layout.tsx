import type React from "react";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Summary",
  description:
    "View your StelloPay account balance, paid transactions, and outstanding payments.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountSummaryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  );
}
