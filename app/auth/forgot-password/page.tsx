import type { Metadata } from "next";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { ForgotPasswordForm } from "@/components/auth/forgot-password/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your StelloPay account password. Enter your email to receive a password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <main
      id="main-content"
      className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen"
    >
      <ForgotPasswordForm />
      <AuthShowcase
        title="StelloPay streamlines global payroll with fast, secure blockchain payments."
        description="Reset your password to regain access to your account"
        imagePosition="right"
      />
    </main>
  );
}
