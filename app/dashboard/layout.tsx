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
  description:
    "View and manage your StelloPay payroll payments, account activity, and transaction metrics.",
  alternates: {
    canonical: "https://stellopay.com/dashboard",
  },
  openGraph: {
    title: "Dashboard | StelloPay",
    description:
      "View and manage your StelloPay payroll payments, account activity, and transaction metrics.",
    url: "https://stellopay.com/dashboard",
    siteName: "StelloPay",
    images: [
      {
        url: "/dashboard-preview.jpg",
        width: 1200,
        height: 630,
        alt: "StelloPay Dashboard — Payroll and account activity overview.",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | StelloPay",
    description:
      "View and manage your StelloPay payroll payments, account activity, and transaction metrics.",
    images: [
      {
        url: "/dashboard-preview.jpg",
        alt: "StelloPay Dashboard — Payroll and account activity overview.",
      },
    ],
  },
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
