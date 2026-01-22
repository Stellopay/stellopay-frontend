import type React from "react";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellopay | My Agreements",
  description: "View and manage your agreements",
};

export default function AgreementsLayout({
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

