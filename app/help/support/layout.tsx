import AppLayout from "@/app/components/AppLayout";
import { SidebarProvider } from "@/context/SidebarContext";
import { Metadata } from "next";



export const metadata: Metadata = {
  title: "Stellopay | Transactions",
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
