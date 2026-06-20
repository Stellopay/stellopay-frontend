import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider } from "@/context/sidebar-context";
import { ThemeProvider } from "@/context/theme-context";
import { WalletProvider } from "@/context/wallet-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const clashDisplay = localFont({
  src: "../public/font/clash-display-variable.ttf",
  variable: "--font-clash",
  weight: "500",
  display: "swap",
});

const generalSans = localFont({
  src: "../public/font/general-sans-variable.ttf",
  variable: "--font-general",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stellopay",
  description: "Stellopay — fast, secure blockchain payroll and payments powered by Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${clashDisplay.variable} ${generalSans.variable} antialiased`}
      >
        {/* Skip navigation link — first focusable element on every page.
            Allows keyboard/screen-reader users to bypass repeated nav. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <WalletProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
