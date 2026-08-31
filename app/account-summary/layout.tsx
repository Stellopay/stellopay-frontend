import type React from "react";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";
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
      <AppLayout>
        <ScopedErrorBoundary
          scope="account-summary"
          fallbackHref="/dashboard"
          fallbackLabel="Back to dashboard"
        >
          {children}
        </ScopedErrorBoundary>
      </AppLayout>
    </SidebarProvider>
  );
}
