"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AuthFormField } from "@/components/ui/form-field";
import { Loader2, ArrowLeft, CheckCircle2, MailQuestion } from "lucide-react";
import { sendPasswordResetEmail, AuthError } from "@/lib/api/auth";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/types/auth";
import { useCountdown } from "@/hooks/useCountdown";

const RESEND_COOLDOWN_SECONDS = 30;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const { secondsLeft, isActive, start } = useCountdown({
    onComplete: () => {},
  });

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(_data: ForgotPasswordFormValues) {
    setIsLoading(true);
    setErrorMessage("");
    setIsNetworkError(false);

    try {
      await sendPasswordResetEmail(_data.email);
      setConfirmationSent(true);
      start(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
        setIsNetworkError(error.kind === "network");
      } else {
        setErrorMessage("An error occurred. Please try again later.");
        setIsNetworkError(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (isActive || isLoading) return;
    const email = form.getValues("email");
    setIsLoading(true);
    setErrorMessage("");

    try {
      await sendPasswordResetEmail(email);
      start(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    setConfirmationSent(false);
    setErrorMessage("");
  }

  if (confirmationSent) {
    return (
      <section className="w-full order-1 lg:order-2">
        <div className="space-y-6">
          <div role="status" aria-live="polite" className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#92569D]/20 flex items-center justify-center">
              <MailQuestion className="w-8 h-8 text-[#92569D]" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Check your email
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm">
              If an account exists for this email, you will receive a password
              reset link shortly.
            </p>

            <div className="text-xs text-zinc-500 pt-2">
              Didn&apos;t receive the email? Check your spam folder or
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isActive || isLoading}
              aria-label={
                isActive
                  ? `Resend in ${secondsLeft} seconds`
                  : "Resend password reset email"
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : isActive ? (
                `Resend in ${secondsLeft}s`
              ) : (
                "Resend link"
              )}
            </Button>

            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-[#92569D] hover:text-[#F8D2FE] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to forgot password
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full order-1 lg:order-2">
      <div className="space-y-12">
        <h2 className="text-foreground">Stellopay</h2>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl text-[#92569D] text-center md:text-left">
            Reset Password
          </h1>
          <p className="text-muted-foreground text-sm text-center md:text-left">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="underline underline-offset-4 text-foreground"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mt-8 mb-6">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <AuthFormField
            control={form.control}
            name="email"
            type="email"
            label="Email Address"
            placeholder="Enter your email"
            loading={isLoading}
            required
            autoComplete="email"
            inputMode="email"
          />

          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="bg-red-500/10 text-red-300 px-4 py-3 rounded-lg text-sm"
            >
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading}
            className="mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-1.5 text-sm text-[#92569D] hover:text-[#F8D2FE] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </form>
      </Form>
    </section>
  );
}
