import type React from "react";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellopay | Dashboard",
  description: "Stellopay Dashboard - View and manage your dashboard",
};

export default function DashboardLayout({
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
