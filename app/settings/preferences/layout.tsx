import AppLayout from "@/components/common/AppLayout";
import { SidebarProvider } from "@/context/SidebarContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellopay | Settings/Preferences",
  description: "Pay with Stellopay",
};

export default function RootLayout({
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
