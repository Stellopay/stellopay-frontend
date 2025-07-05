import { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Stellopay | Transactions",
  description: "Pay with Stellopay"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {/* <SidebarProvider> */}
        {children}
        {/* </SidebarProvider> */}
      </body>
    </html>
  );
}
