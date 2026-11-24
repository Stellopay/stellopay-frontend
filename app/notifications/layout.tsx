import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { ScopedErrorBoundary } from "@/components/common/scoped-error-boundary";
import { Metadata } from "next";

/**
 * Metadata configuration for the private Notifications route.
 * Employs robots noindex directives to prevent indexing of a user's
 * notification feed.
 */
export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Review payment, security and system notifications for your StelloPay account.",
  alternates: {
    canonical: "https://stellopay.com/notifications",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppLayout>
        <ScopedErrorBoundary
          scope="notifications"
          fallbackHref="/dashboard"
          fallbackLabel="Back to dashboard"
        >
          {children}
        </ScopedErrorBoundary>
      </AppLayout>
    </SidebarProvider>
  );
}
