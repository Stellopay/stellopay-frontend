import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";
import { Metadata } from "next";

/**
 * Metadata configuration for the private Transactions route.
 * Employs robots noindex directives to prevent indexing of authenticated transactions list.
 */
export const metadata: Metadata = {
  title: "Transactions",
  description:
    "View and filter your StelloPay payroll payments history and transaction status on the blockchain.",
  alternates: {
    canonical: "https://stellopay.com/transactions",
  },
  openGraph: {
    title: "Transactions | StelloPay",
    description:
      "View and filter your StelloPay payroll payments history and transaction status on the blockchain.",
    url: "https://stellopay.com/transactions",
    siteName: "StelloPay",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "StelloPay Transactions — Filter and track payroll history.",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transactions | StelloPay",
    description:
      "View and filter your StelloPay payroll payments history and transaction status on the blockchain.",
    images: [
      {
        url: "/opengraph-image",
        alt: "StelloPay Transactions — Filter and track payroll history.",
      },
    ],
  },
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
      <AppLayout>
        <ScopedErrorBoundary
          scope="transactions"
          fallbackHref="/dashboard"
          fallbackLabel="Back to dashboard"
        >
          {children}
        </ScopedErrorBoundary>
      </AppLayout>
    </SidebarProvider>
  );
}
