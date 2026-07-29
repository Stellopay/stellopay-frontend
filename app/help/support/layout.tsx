import type React from "react";

import { SidebarProvider } from "@/context/sidebar-context";
import type { Metadata } from "next";
import AppLayout from "@/components/common/app-layout";
import { Breadcrumb } from "@/components/common/breadcrumb";

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
      <AppLayout>
        <div className="px-4 py-4 md:px-6 w-full max-w-screen-xl mx-auto">
          <Breadcrumb />
        </div>
        {children}
      </AppLayout>
    </SidebarProvider>
  );
}
