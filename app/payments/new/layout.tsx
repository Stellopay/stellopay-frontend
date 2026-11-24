import type React from "react";
import type { Metadata } from "next";
import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";

export const metadata: Metadata = {
  title: "Send Payment",
  description:
    "Send a Stellar payment with address validation, fee preview, and wallet signing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewPaymentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppLayout>
        <ScopedErrorBoundary
          scope="payments"
          fallbackHref="/dashboard"
          fallbackLabel="Back to dashboard"
        >
          {children}
        </ScopedErrorBoundary>
      </AppLayout>
    </SidebarProvider>
  );
}
