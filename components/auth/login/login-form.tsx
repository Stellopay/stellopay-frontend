"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  FormFieldInput,
  FormFieldCheckbox,
  FormFieldPassword,
} from "@/components/ui/form-field";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { AuthSocialButtons } from "../auth-social-buttons";
import { loginSchema, LoginFormValues } from "@/types/auth";

/**
 * LoginForm – renders the `/auth/login` page form.
 *
 * Uses `FormFieldPassword` for the password field which internally handles
 * the Eye/EyeOff visibility toggle, aria attributes, and autoComplete.
 *
 * @security Password visibility defaults to hidden (`type="password"`).
 *           Password values are never logged. `autoComplete="current-password"`
 *           is preserved for password-manager compatibility.
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(_data: LoginFormValues) {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Simulate API call
      await new Promise((resolve, reject) => setTimeout(() => {
        // Simulate error for demonstration
        if (_data.email === "error@example.com") {
          reject(new Error("Invalid credentials"));
        } else {
          resolve(null);
        }
      }, 2000));
      // Handle login logic here
    } catch {
      setErrorMessage("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <section className="w-full order-1 lg:order-2">
      {/* Title */}
      <div className="space-y-12">
        <h2 className="text-foreground">Stellopay</h2>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl text-[#92569D] text-center md:text-left">
            Welcome Back
          </h1>
          <div>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Don&apos;t have an account?{" "}
              <Link
                href={"/auth/sign-up"}
                className="underline underline-offset-4 text-foreground"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Social Login */}
      <AuthSocialButtons />

      {/* Divider */}
      <div className="flex items-center my-6 gap-2">
        <Separator className="flex-1 bg-muted-foreground" />
        <span className="text-sm text-muted-foreground">Or</span>
        <Separator className="flex-1 bg-muted-foreground" />
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormFieldInput
            control={form.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            loading={isLoading}
            required
            autoComplete="email"
          />

          <FormFieldPassword
            control={form.control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            disabled={isLoading}
            required
            autoComplete="current-password"
          />

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-red-500/10 text-red-300 px-4 py-3 rounded-lg text-sm"
            >
              {errorMessage}
            </div>
          )}

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <FormFieldCheckbox
              control={form.control}
              name="rememberMe"
              label="Remember me"
              disabled={isLoading}
            />
            <Link
              href="/auth/forgot-password"
              className="text-[#92569D] underline underline-offset-4 text-sm hover:text-[#F8D2FE] transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant={"secondary"}
            disabled={isLoading}
            className="mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>
    </section>
  );
}
