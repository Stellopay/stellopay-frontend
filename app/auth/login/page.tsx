import type { Metadata } from "next";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { LoginForm } from "@/components/auth/login/login-form";

/**
 * Metadata configuration for the StelloPay login route.
 */
export const metadata: Metadata = {
  title: "Login",
  description:
    "Log in to your StelloPay account to access secure blockchain payroll and manage your digital workspace.",
};

export default async function LoginPage(props: {
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const searchParams = await props.searchParams;
  const returnTo = searchParams?.returnTo;

  return (
    <main
      id="main-content"
      className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen"
    >
      <LoginForm returnTo={returnTo} />
      <AuthShowcase
        title="StelloPay streamlines global payroll with fast, secure blockchain payments."
        description="Enter your credentials to access your account"
        imagePosition="left"
      />
    </main>
  );
}
