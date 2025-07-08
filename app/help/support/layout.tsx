import type React from "react";

import { SidebarProvider } from "@/context/SidebarContext";
import type { Metadata } from "next";
import AppLayout from "@/components/common/AppLayout";

export const metadata: Metadata = {
  title: "Stellopay | Transactions",
  description:
    "Stellopay Transactions - View and manage your transaction history",
};

export default function TransactionsLayout({
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
