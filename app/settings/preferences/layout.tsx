import AppLayout from "@/components/common/app-layout";
import { SidebarProvider } from "@/context/sidebar-context";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellopay | Settings",
  description:
    "Stellopay Settings - Manage your account, alerts, security, and wallet preferences",
};

export default function SettingsPreferencesLayout({
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
