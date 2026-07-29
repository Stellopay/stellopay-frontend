import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { Metadata } from "next";
import { Breadcrumb } from "@/components/common/breadcrumb";

/**
 * Metadata configuration for the private settings preferences route.
 * Employs robots noindex directives to prevent indexing of settings dashboard.
 */
export const metadata: Metadata = {
  title: "Preferences",
  description:
    "Customize your StelloPay dashboard preferences, currency view, theme, and security parameters.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPreferencesLayout({
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
