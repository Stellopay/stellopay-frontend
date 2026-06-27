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

/**
 * Global metadata configuration for the StelloPay application.
 * Sets the default title templates and default OpenGraph and Twitter preview parameters.
 */
export const metadata: Metadata = {
  title: {
    default: "StelloPay",
    template: "%s | StelloPay",
  },
  description: "StelloPay — fast, secure blockchain payroll and payments powered by Stellar.",
  openGraph: {
    title: "StelloPay",
    description: "Fast, secure blockchain payroll and payments powered by Stellar.",
    url: "https://stellopay.com",
    siteName: "StelloPay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StelloPay Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StelloPay",
    description: "Fast, secure blockchain payroll and payments powered by Stellar.",
    images: ["/og-image.png"],
    creator: "@stellopay",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Pre-hydration theme initializer:
          Executes immediately on load to determine the user's preferred theme 
          from localStorage or system settings and applies the 'dark' class to 
          the <html> element before React hydrates. This prevents light flash on page load.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = null;
                try {
                  stored = window.localStorage.getItem('theme');
                } catch (e) {}
                try {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var useSystem = stored !== 'dark' && stored !== 'light';
                  if (stored === 'dark' || (useSystem && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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
