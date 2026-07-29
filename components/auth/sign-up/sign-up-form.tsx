"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AuthFormField,
  FormFieldCheckbox,
} from "@/components/ui/form-field";
import { Check, X } from "lucide-react";
import { SignUpEmailModal } from "./sign-up-email-modal";
import { AuthSocialButtons } from "../auth-social-buttons";
import { passwordPolicy, signUpSchema, SignUpFormValues } from "@/types/auth";
import { checkPasswordRequirements, calculatePasswordStrength, PasswordStrengthResult } from "@/utils/authUtils";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

/**
 * Minimum time (ms) a human needs to reasonably fill out the form.
 * Submissions faster than this are silently rejected as bot activity.
 */
const MINIMUM_FORM_TIME_MS = 3_000;

/**
 * Name attribute used for the honeypot field so that automated bots
 * that fill every visible input will populate it.
 */
const HONEYPOT_FIELD_NAME = "website";

/**
 * SignUpForm – renders the `/auth/sign-up` page form.
 *
 * Uses `FormFieldPassword` for both the password and confirm-password fields.
 * `FormFieldPassword` internally handles the Eye/EyeOff visibility toggle,
 * aria attributes, and autoComplete.
 *
 * @security Password visibility defaults to hidden (`type="password"`).
 *           Password values are never logged. `autoComplete="new-password"`
 *           is preserved for password-manager compatibility.
 */
export function SignUpForm() {
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    uppercase: false,
    specialChar: false,
  });
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult>({
    strength: "weak",
    score: 0,
    feedback: "Enter a password",
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [honeypotValue, setHoneypotValue] = useState("");

  // Track when the component mounted to guard against instant submissions
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const handlePasswordCheck = (password: string) => {
    // Calculate strength for the live meter
    const strengthResult = calculatePasswordStrength(password);
    setPasswordStrength(strengthResult);
    
    // Keep existing requirements checking for the checklist UI
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

  /**
   * Checks the honeypot field and submission-rate guard.
   * If either detects bot-like behavior, the submission is silently
   * discarded without showing any error to avoid tipping off bots.
   */
  function isSubmissionBlocked(): boolean {
    // Honeypot must be empty (real users never see this field)
    if (honeypotValue.trim().length > 0) {
      return true;
    }

    // Submission must take at least MINIMUM_FORM_TIME_MS
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < MINIMUM_FORM_TIME_MS) {
      return true;
    }

    return false;
  }

  function onSubmit(data: SignUpFormValues) {
    // Silently reject bot-like submissions
    if (isSubmissionBlocked()) {
      return;
    }

    // No sensitive data logging
    setSubmittedEmail(data.email);
    setShowEmailModal(true);
  }

  return (
    <section className="w-full order-1 lg:order-1">
      {/* Title */}
      <div className="space-y-12">
        <h2 className="text-foreground">Stellopay</h2>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl text-[#92569D] text-center md:text-left">
            Get Started Now
          </h1>
          <div>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Already have an account?
              <Link
                href="/auth/login"
                className="ml-1 text-foreground underline underline-offset-4 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Social Login (includes accessible divider) */}
      <AuthSocialButtons />
      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <AuthFormField
            control={form.control}
            name="fullName"
            type="text"
            label="Full Name"
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />
          <AuthFormField
            control={form.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            required
            autoComplete="email"
            inputMode="email"
          />
          <AuthFormField
            control={form.control}
            name="password"
            type="password"
            label="Password"
            placeholder="Create a password"
            required
            autoComplete="new-password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              if (value.length > 0) {
                setShowPasswordRequirements(true);
                handlePasswordCheck(value);
              } else {
                setShowPasswordRequirements(false);
                // Reset strength meter when password is cleared
                setPasswordStrength({
                  strength: "weak",
                  score: 0,
                  feedback: "Enter a password",
                });
              }
            }}
          />
          {/* Password Strength Indicator */}
          {showPasswordRequirements && (
            <PasswordStrengthIndicator
              strengthResult={passwordStrength}
              className="mt-2"
              showFeedback={true}
            />
          )}
          {/* Password Requirements */}
          {showPasswordRequirements && (
            <div
              id="password-requirements"
              className="mt-2 p-3 bg-gray-800/50 rounded-md"
              role="region"
              aria-label="Password requirements"
              aria-live="polite"
            >
              <p className="text-gray-300 text-sm mb-2">
                {passwordPolicy.title}
              </p>
              <ul
                className="space-y-1"
                aria-label="Password requirements checklist"
              >
                {passwordPolicy.rules.map((rule) => {
                  const isMet =
                    rule.id === "minLength"
                      ? passwordRequirements.minLength
                      : rule.id === "uppercase"
                        ? passwordRequirements.uppercase
                        : passwordRequirements.specialChar;

                  return (
                    <li key={rule.id} className="flex items-center text-sm">
                      {isMet ? (
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
                        className={isMet ? "text-green-400" : "text-gray-300"}
                      >
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
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
          <AuthFormField
            control={form.control}
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
          />
          <FormFieldCheckbox
            control={form.control}
            name="agreeToTerms"
            label={
              <span className="text-foreground cursor-pointer text-xs leading-relaxed">
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
                <span
                  className="text-destructive ml-1"
                  aria-label="required field"
                >
                  *
                </span>
              </span>
            }
          />
          {/* ── Honeypot field ──────────────────────────────────────
           *  Visually hidden text input that bots often auto-fill.
           *  - aria-hidden so screen readers ignore it entirely
           *  - tabIndex={-1} so keyboard navigation skips it
           *  - CSS: off-screen position with zero height, still in the
           *    DOM so bots that dispatch events also find it
           *  - Deceptively labelled "Website" to appear legitimate.
           */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] -top-[9999px] opacity-0 h-0 w-0 overflow-hidden"
          >
            <label htmlFor="honeypot-field" className="sr-only">
              Website
            </label>
            <input
              id="honeypot-field"
              name={HONEYPOT_FIELD_NAME}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypotValue}
              onChange={(e) => setHoneypotValue(e.target.value)}
              placeholder="Website"
            />
          </div>
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
