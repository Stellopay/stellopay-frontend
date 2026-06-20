import type React from "react";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import type { Metadata } from "next";

/**
 * Metadata configuration for the private Dashboard route.
 * Employs robots noindex directives to prevent indexing of authenticated user pages.
 */
export const metadata: Metadata = {
  title: "Dashboard",
  description: "View and manage your StelloPay payroll payments, account activity, and transaction metrics.",
  robots: {
    index: false,
    follow: false,
  },
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
