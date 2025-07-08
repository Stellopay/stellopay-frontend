import AppLayout from "@/components/common/AppLayout";
import { SidebarProvider } from "@/context/SidebarContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellopay | Settings/Preferences",
  description:
    "Stellopay Settings/Preferences - Manage your account settings and preferences",
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
