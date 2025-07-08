import { SignUpForm } from "@/components/auth/sign-up/sign-up-form";
import { AuthShowcase } from "@/components/auth/auth-showcase";

export default function SignUpPage() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen">
      <SignUpForm />
      <AuthShowcase
        title="StelloPay streamlines global payroll with fast, secure blockchain payments."
        description="Enter your credentials to access your account"
        imagePosition="right"
      />
    </div>
  );
}
