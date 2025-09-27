"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthSocialButtons } from "../auth-social-buttons";
import { loginSchema, LoginFormValues } from "@/types/auth";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      console.log("Login form submitted:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Handle login logic here
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const iconsClassName =
    "absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";

  return (
    <section className="w-full order-1 lg:order-2">
      {/* Title */}
      <div className="space-y-12">
        <h2 className="text-[#E5E5E5]">Stellopay</h2>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl text-[#F8D2FE] text-center md:text-left">
            Welcome Back
          </h1>
          <div>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Don't have an account?{" "}
              <Link
                href={"/auth/sign-up"}
                className="underline underline-offset-4 text-white"
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
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Email Address"
                      className="pr-10 py-4 border-muted-foreground"
                      disabled={isLoading}
                      {...field}
                    />
                    <Mail className={iconsClassName} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="pr-10 py-4 border-muted-foreground"
                      disabled={isLoading}
                      {...field}
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="border-[#2D2D2D] data-[state=checked]:bg-[#201322] data-[state=checked]:border-[#2D2D2D]"
                      />
                    </FormControl>
                    <label className="text-[#E5E5E5] text-sm">
                      Remember me
                    </label>
                  </div>
                </FormItem>
              )}
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
