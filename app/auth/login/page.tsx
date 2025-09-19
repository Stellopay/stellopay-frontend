import { AuthShowcase } from "@/components/auth/auth-showcase";
import { LoginForm } from "@/components/auth/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen">
      <LoginForm />
      <AuthShowcase
        title="StelloPay streamlines global payroll with fast, secure blockchain payments."
        description="Enter your credentials to access your account"
        imagePosition="left"
      />
    </div>
  );
}
