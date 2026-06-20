import type React from "react";
import type { Metadata } from "next";

/**
 * Metadata configuration for the verify-email route.
 * Restricts search engines from indexing the verification flow pages.
 */
export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to complete your registration and secure your StelloPay account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
