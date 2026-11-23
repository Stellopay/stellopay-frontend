import type React from "react";
import type { Metadata } from "next";
import AppLayout from "@/components/common/app-layout";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";
import { SidebarProvider } from "@/context/sidebar-context";

export const metadata: Metadata = {
  title: "Invoices",
  description: "Create, track and download StelloPay invoices.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvoicesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppLayout>
        <ScopedErrorBoundary
          scope="invoices"
          fallbackHref="/dashboard"
          fallbackLabel="Back to dashboard"
        >
          {children}
        </ScopedErrorBoundary>
      </AppLayout>
    </SidebarProvider>
  );
}
