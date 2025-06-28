"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const iconsClassName =
    "absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateInputs = () => {
    const { fullName, email, password, confirmPassword } = inputs;
    if (!fullName || !email || !password || !confirmPassword) {
      return false;
    }
    if (password !== confirmPassword) {
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-20 p-10 md:max-w-7xl mx-auto lg:h-screen">
      {/* Left side: Sign up form */}
      <section className="w-full">
        {/* Title */}
        <div className="space-y-12">
          <h2 className="text-[#E5E5E5]">Stellopay</h2>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl text-[#F8D2FE] text-center md:text-left">
              Get Started Now
            </h1>

            <div>
              <p className="text-muted-foreground text-sm text-center md:text-left">
                Already have an account?{" "}
                <Link
                  href={"/auth/sign-in"}
                  className="underline underline-offset-4 text-white"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Social */}
        <div className="flex md:flex-row flex-col justify-center items-center gap-3 mt-10">
          <Button
            variant={"outline"}
            asChild
            className="border-muted-foreground cursor-pointer"
          >
            <span>
              <Image
                src={"/google-logo.svg"}
                alt="Google logo"
                width={20}
                height={20}
              />
              Continue With Google
            </span>
          </Button>
          <Button
            variant={"outline"}
            asChild
            className="border-muted-foreground cursor-pointer"
          >
            <span>
              <Image
                src={"/apple-logo.svg"}
                alt="Apple logo"
                width={20}
                height={20}
              />
              Continue With Apple
            </span>
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6 gap-2">
          <Separator className="flex-1 bg-muted-foreground" />
          <span className="text-sm text-muted-foreground">Or</span>
          <Separator className="flex-1 bg-muted-foreground" />
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4">
          <div className="relative">
            <Input
              type="text"
              name="fullName"
              value={inputs.fullName}
              placeholder="Full Name"
              onChange={handleInputChange}
              className="pr-10 py-4 border-muted-foreground"
            />
            <User className={iconsClassName} />
          </div>

          <div className="relative">
            <Input
              type="email"
              name="email"
              value={inputs.email}
              placeholder="Email Address"
              onChange={handleInputChange}
              className="pr-10 py-4 border-muted-foreground"
            />
            <Mail className={iconsClassName} />
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={inputs.password}
              placeholder="Password"
              onChange={handleInputChange}
              className="pr-10 py-4 border-muted-foreground"
            />
            {showPassword ? (
              <EyeOff
                className={`${iconsClassName} cursor-pointer`}
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className={`${iconsClassName} cursor-pointer`}
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={inputs.confirmPassword}
              placeholder="Confirm Password"
              onChange={handleInputChange}
              className="pr-10 py-4 border-muted-foreground"
            />
            {showPassword ? (
              <EyeOff
                className={`${iconsClassName} cursor-pointer`}
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <Eye
                className={`${iconsClassName} cursor-pointer`}
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <p className="text-xs md:text-sm text-center text-[#E5E5E5]">
            By selecting Agree and continue, I agree to Stellopay&apos;s{" "}
            <Link
              href={"/terms"}
              className="text-[#92569D] underline underline-offset-4"
            >
              Terms of Service,
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              href={"/terms"}
              className="text-[#92569D] underline underline-offset-4"
            >
              Privacy Policy.
            </Link>
          </p>

          <Button variant={"secondary"} disabled={!validateInputs()}>
            Continue
          </Button>
        </form>
      </section>

      {/* Right side: Product description and dashboard preview */}
      <section className="w-full">
        <Card className="bg-[#35183A] border-0 p-0 pl-14 pt-20">
          <CardContent className="p-0 space-y-14">
            <div className="space-y-3">
              <h2 className="text-2xl text-[#F8D2FE]">
                StelloPay streamlines global payroll with fast, secure
                blockchain payments.
              </h2>
              <p className="text-[#E5E5E5] text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            <Image
              src={"/dashboard-preview.jpg"}
              alt="Dashboard Preview"
              width={500}
              height={500}
              className="rounded-br-xl rounded-tl-xl w-full"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
