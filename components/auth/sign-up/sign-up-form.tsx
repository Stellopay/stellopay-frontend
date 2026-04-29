"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormFieldInput, FormFieldCheckbox } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, User, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SignUpEmailModal } from "./sign-up-email-modal";
import { AuthSocialButtons } from "../auth-social-buttons";
import { signUpSchema, SignUpFormValues } from "@/types/auth";
import { checkPasswordRequirements } from "@/utils/authUtils";

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    uppercase: false,
    specialChar: false,
  });
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handlePasswordCheck = (password: string) => {
    const requirements = checkPasswordRequirements(password);
    setPasswordRequirements(requirements);
    const allMet = Object.values(requirements).every((req) => req);
    setIsPasswordStrong(allMet);
    return allMet;
  };

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  function onSubmit(data: SignUpFormValues) {
    console.log("Form submitted:", data);
    setSubmittedEmail(data.email);
    setShowEmailModal(true);
  }

  const iconsClassName =
    "absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";

  return (
    <section className="w-full order-1 lg:order-1">
      {/* Title */}
      <div className="space-y-12">
        <h2 className="text-[#E5E5E5]">Stellopay</h2>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl text-[#F8D2FE] text-center md:text-left">
            Get Started Now
          </h1>
          <div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Already have an account?
              <Link
                href="/auth/login"
                className="ml-1 text-white underline underline-offset-4 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
              >
                Log in
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
          <FormFieldInput
            control={form.control}
            name="fullName"
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />
          <FormFieldInput
            control={form.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Password{" "}
                  <span
                    className="text-destructive"
                    aria-label="required field"
                  >
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pr-10 py-4"
                      autoComplete="new-password"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const value = e.target.value;
                        if (value.length > 0) {
                          setShowPasswordRequirements(true);
                          handlePasswordCheck(value);
                        } else {
                          setShowPasswordRequirements(false);
                        }
                      }}
                    />
                    {showPassword ? (
                      <EyeOff
                        className={`${iconsClassName} cursor-pointer`}
                        onClick={() => setShowPassword(false)}
                        aria-label="Hide password"
                      />
                    ) : (
                      <Eye
                        className={`${iconsClassName} cursor-pointer`}
                        onClick={() => setShowPassword(true)}
                        aria-label="Show password"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Password Requirements */}
          {showPasswordRequirements && (
            <div
              className="mt-2 p-3 bg-gray-800/50 rounded-md"
              role="region"
              aria-label="Password requirements"
            >
              <p className="text-gray-300 text-sm mb-2">
                Password must contain:
              </p>
              <ul
                className="space-y-1"
                aria-label="Password requirements checklist"
              >
                <li className="flex items-center text-sm">
                  {passwordRequirements.minLength ? (
                    <Check
                      size={16}
                      className="text-green-400 mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <X
                      size={16}
                      className="text-red-400 mr-2"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      passwordRequirements.minLength
                        ? "text-green-400"
                        : "text-gray-300"
                    }
                  >
                    Minimum of 8 characters
                  </span>
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.uppercase ? (
                    <Check
                      size={16}
                      className="text-green-400 mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <X
                      size={16}
                      className="text-red-400 mr-2"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      passwordRequirements.uppercase
                        ? "text-green-400"
                        : "text-gray-300"
                    }
                  >
                    One UPPERCASE character
                  </span>
                </li>
                <li className="flex items-center text-sm">
                  {passwordRequirements.specialChar ? (
                    <Check
                      size={16}
                      className="text-green-400 mr-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <X
                      size={16}
                      className="text-red-400 mr-2"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      passwordRequirements.specialChar
                        ? "text-green-400"
                        : "text-gray-300"
                    }
                  >
                    One unique character (e.g., @!#%$^&*)
                  </span>
                </li>
              </ul>
              {isPasswordStrong && (
                <p
                  className="text-green-400 text-sm mt-2 font-medium"
                  role="status"
                >
                  Password is strong and secure.
                </p>
              )}
            </div>
          )}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Confirm Password{" "}
                  <span
                    className="text-destructive"
                    aria-label="required field"
                  >
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pr-10 py-4"
                      autoComplete="new-password"
                      {...field}
                    />
                    {showConfirmPassword ? (
                      <EyeOff
                        className={`${iconsClassName} cursor-pointer`}
                        onClick={() => setShowConfirmPassword(false)}
                        aria-label="Hide password"
                      />
                    ) : (
                      <Eye
                        className={`${iconsClassName} cursor-pointer`}
                        onClick={() => setShowConfirmPassword(true)}
                        aria-label="Show password"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => {
              const fieldId = React.useId();
              return (
                <FormItem>
                  <div className="flex items-start space-x-2 pt-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        id={fieldId}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border border-input text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </FormControl>
                    <div className="text-xs leading-relaxed">
                      <label
                        htmlFor={fieldId}
                        className="text-[#E5E5E5] cursor-pointer"
                      >
                        By selecting Agree and continue, I agree to Stellopay's{" "}
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
                        <span
                          className="text-destructive ml-1"
                          aria-label="required field"
                        >
                          *
                        </span>
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button type="submit" variant={"secondary"} className="">
            Create Account
          </Button>
        </form>
      </Form>
      <SignUpEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onContinue={() => {
          setShowEmailModal(false);
          // Handle continuation logic
        }}
        onGoBack={() => setShowEmailModal(false)}
        email={submittedEmail}
      />
    </section>
  );
}
