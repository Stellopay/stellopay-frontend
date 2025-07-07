import { SignUpForm } from "@/components/auth/sign-up/sign-up-form";
import { SignUpShowcase } from "@/components/auth/sign-up/sign-up-showcase";

export default function SignUpPage() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen">
      <SignUpForm />
      <SignUpShowcase />
    </div>
  );
}
