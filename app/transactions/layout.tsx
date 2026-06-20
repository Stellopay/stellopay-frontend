import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { Metadata } from "next";

/**
 * Metadata configuration for the private Transactions route.
 * Employs robots noindex directives to prevent indexing of authenticated transactions list.
 */
export const metadata: Metadata = {
  title: "Transactions",
  description: "View and filter your StelloPay payroll payments history and transaction status on the blockchain.",
  robots: {
    index: false,
    follow: false,
  },
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
