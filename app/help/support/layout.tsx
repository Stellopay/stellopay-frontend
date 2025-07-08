import type React from "react";

import { SidebarProvider } from "@/context/SidebarContext";
import type { Metadata } from "next";
import AppLayout from "@/components/common/AppLayout";

export const metadata: Metadata = {
  title: "Stellopay | Hep/Support",
  description:
    "Stellopay Hep/Support - Contact support for assistance with your Stellopay account, transactions, security, and more.",
};

export default function HelpSupportLayout({
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
