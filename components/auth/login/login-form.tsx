"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AuthFormField,
  FormFieldCheckbox,
} from "@/components/ui/form-field";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { AuthSocialButtons } from "../auth-social-buttons";
import { login, sendMagicLink, AuthError } from "@/lib/api/auth";
import { loginSchema, LoginFormValues, magicLinkSchema } from "@/types/auth";
import { safeStorage } from "@/utils/safeStorage";
import { useCountdown } from "@/hooks/useCountdown";

const REMEMBERED_EMAIL_KEY = "stellopay:rememberedEmail";
const MAGIC_LINK_COOLDOWN_SECONDS = 30;

type SignInMethod = "password" | "magic-link";

/**
 * LoginForm – renders the `/auth/login` page form with support for both
 * password-based and passwordless magic-link sign-in.
 *
 * Users can switch between methods via a tab/toggle UI. Magic-link sends
 * a one-time sign-in link to the user's email, with a resend cooldown.
 *
 * @security Password visibility defaults to hidden (`type="password"`).
 *           Password values are never logged. `autoComplete="current-password"`
 *           is preserved for password-manager compatibility.
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");

  const { secondsLeft, isActive, start } = useCountdown({
    onComplete: () => {},
  });

  const rememberedEmail = safeStorage.getItem(REMEMBERED_EMAIL_KEY);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail ?? "",
      password: "",
      rememberMe: !!rememberedEmail,
    },
  });

  /** Focus the first field that failed validation so screen-reader users
   *  can correct it without manually navigating back to the top of the form. */
  function onValidationError(errors: FieldErrors<LoginFormValues>) {
    const firstErrorField = Object.keys(errors)[0] as keyof LoginFormValues;
    if (firstErrorField) {
      // Exclude hidden inputs (e.g. the native checkbox behind Radix) so
      // focus always lands on a visible, interactive element.
      const element = document.querySelector<HTMLElement>(
        `[name="${firstErrorField}"]:not([type="hidden"])`,
      );
      element?.focus();
    }
  }

  async function onSubmit(_data: LoginFormValues) {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await login(_data);
      // Persist only a non-sensitive identifier (email). The password is
      // never written to storage in any branch of this logic.
      if (_data.rememberMe) {
        safeStorage.setItem(REMEMBERED_EMAIL_KEY, _data.email);
      } else {
        safeStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      // Handle successful login redirect or state update here
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMagicLink() {
    const email = form.getValues("email");
    const result = magicLinkSchema.safeParse({ email });

    if (!result.success) {
      const fieldError = result.error.errors[0];
      setErrorMessage(fieldError?.message ?? "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await sendMagicLink(email);
      setMagicLinkEmail(email);
      setMagicLinkSent(true);
      start(MAGIC_LINK_COOLDOWN_SECONDS);
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

  async function handleResendMagicLink() {
    if (isActive) return;
    await handleSendMagicLink();
  }

  function switchToPasswordMethod() {
    setSignInMethod("password");
    setMagicLinkSent(false);
    setErrorMessage("");
  }

  function switchToMagicLinkMethod() {
    setSignInMethod("magic-link");
    setMagicLinkSent(false);
    setErrorMessage("");
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

      {/* Social Login (includes accessible divider) */}
      <AuthSocialButtons />

      {/* Divider */}
      <div className="flex items-center my-6 gap-2">
        <Separator className="flex-1 bg-muted-foreground" />
        <span className="text-sm text-muted-foreground">Or</span>
        <Separator className="flex-1 bg-muted-foreground" />
      </div>

      {/* Sign-in method tabs */}
      <div
        className="flex rounded-lg border border-[#2D2D2D] p-1 mb-6"
        role="tablist"
        aria-label="Sign-in method"
      >
        <button
          role="tab"
          aria-selected={signInMethod === "password"}
          aria-controls="password-signin-panel"
          id="password-signin-tab"
          onClick={switchToPasswordMethod}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
            signInMethod === "password"
              ? "bg-[#2D2D2D] text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" />
          Password
        </button>
        <button
          role="tab"
          aria-selected={signInMethod === "magic-link"}
          aria-controls="magic-link-signin-panel"
          id="magic-link-signin-tab"
          onClick={switchToMagicLinkMethod}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
            signInMethod === "magic-link"
              ? "bg-[#2D2D2D] text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-[#1A1A1A]"
          }`}
        >
<Mail className="w-4 h-4" aria-hidden="true" />
          Send Link
        </button>
      </div>

      {signInMethod === "password" ? (
        /* ─── Password sign-in panel ─────────────────────────────────────── */
        <div
          role="tabpanel"
          id="password-signin-panel"
          aria-labelledby="password-signin-tab"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onValidationError)}
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

              <AuthFormField
                control={form.control}
                name="password"
                type="password"
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
        </div>
      ) : magicLinkSent ? (
        /* ─── Magic-link sent confirmation ───────────────────────────────── */
        <div
          role="tabpanel"
          id="magic-link-signin-panel"
          aria-labelledby="magic-link-signin-tab"
        >
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#92569D]/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#92569D]" />
            </div>
            <h3 className="text-xl font-semibold text-white">Check your email</h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              We sent a login link to{" "}
              <span className="font-medium text-white">{magicLinkEmail}</span>.
              Click the link in the email to sign in instantly.
            </p>

            <div className="text-xs text-zinc-500">
              Didn&apos;t receive the email? Check your spam folder or
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleResendMagicLink}
              disabled={isActive || isLoading}
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
              onClick={switchToPasswordMethod}
              className="flex items-center gap-1.5 text-sm text-[#92569D] hover:text-[#F8D2FE] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to password sign-in
            </button>
          </div>
        </div>
      ) : (
        /* ─── Magic-link form ────────────────────────────────────────────── */
        <div
          role="tabpanel"
          id="magic-link-signin-panel"
          aria-labelledby="magic-link-signin-tab"
        >
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMagicLink();
              }}
              className="flex flex-col gap-4"
              noValidate
            >
              <p className="text-sm text-zinc-400">
                Enter your email address and we&apos;ll send you a one-time
                sign-in link. No password needed.
              </p>

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

              <Button
                type="submit"
                variant={"secondary"}
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send login link"
                )}
              </Button>

              <button
                type="button"
                onClick={switchToPasswordMethod}
                className="flex items-center justify-center gap-1.5 text-sm text-[#92569D] hover:text-[#F8D2FE] transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                Sign in with password instead
              </button>
            </form>
          </Form>
        </div>
      )}
    </section>
  );
}
