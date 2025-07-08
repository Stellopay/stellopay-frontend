import type React from "react";
import AppLayout from "@/components/common/AppLayout";
import { SidebarProvider } from "@/context/SidebarContext";
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
