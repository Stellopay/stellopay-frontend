import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { Metadata } from "next";

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
