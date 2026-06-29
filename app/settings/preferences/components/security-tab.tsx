"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  KeyRound,
  Monitor,
  ShieldCheck,
  Smartphone,
  Loader2,
} from "lucide-react";
import ToggleCard from "@/components/common/toggle-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { FormFieldPassword } from "@/components/ui/form-field";
import { changePasswordSchema, ChangePasswordFormValues } from "@/types/auth";
import { checkPasswordRequirements } from "@/utils/authUtils";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_SECURITY } from "@/lib/demo-data";
import { passwordPolicy, passwordSchema } from "@/types/auth";

const sessions = [
  {
    name: "Chrome on Windows",
    location: "Lagos, Nigeria",
    status: "Current session",
    icon: Monitor,
  },
  {
    name: "iPhone 15 Pro",
    location: "Mobile app",
    status: "Last active 2 hours ago",
    icon: Smartphone,
  },
];

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

function getPasswordValidationMessages(
  password: string,
  confirmPassword: string,
) {
  const messages: string[] = [];

  if (password.length === 0) {
    return messages;
  }

  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) {
    messages.push(...parsedPassword.error.issues.map((issue) => issue.message));
  }

  if (password !== confirmPassword) {
    messages.push("Passwords don't match");
  }

  return messages;
}

/** Default two-factor state, exported so a parent can own the same initial value. */
export const DEFAULT_TWO_FACTOR_ENABLED = true;

interface SecurityTabProps {
  /**
   * Controlled two-factor state. When provided the component renders this value
   * and reports changes through `onTwoFactorEnabledChange`. When omitted the
   * section manages its own internal state (standalone use).
   */
  twoFactorEnabled?: boolean;
  onTwoFactorEnabledChange?: (next: boolean) => void;
}

/**
 * SecurityTab — password change, verification controls, and active sessions.
 *
 * ## Password-change validation flow
 *
 * The form is backed by {@link changePasswordSchema} via `zodResolver`, which
 * enforces the same policy as sign-up:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one special character (`@!#%$^&*()_+...`)
 * - New password and confirmation must match (cross-field refinement)
 *
 * Validation mode is `"onTouched"`: errors surface on the first blur then
 * update on every subsequent keystroke, so the UI stays quiet while the user
 * is still composing their password. Each field drives `aria-invalid` through
 * `FormControl → Input`, and `FormMessage` surfaces the zod error text inline
 * below the field.
 *
 * The submit button is disabled until `form.formState.isValid` is `true`
 * **and** both fields contain text, so an initially-empty form can never be
 * submitted accidentally. While the async save is in-flight the button shows a
 * spinner and is disabled; the form re-enables when the promise resolves.
 *
 * @security Password values are never logged, printed, or stored outside the
 *   react-hook-form internal state. The `handleSaveChanges` callback receives
 *   the validated `ChangePasswordFormValues` but ignores all field values —
 *   the parameter is prefixed with `_` to make the intent explicit. The form
 *   is reset to empty strings on success to prevent values lingering in state.
 */
export default function SecurityTab({
  twoFactorEnabled: controlledTwoFactor,
  onTwoFactorEnabledChange,
}: SecurityTabProps = {}) {
  const [internalTwoFactor, setInternalTwoFactor] = useState(
    DEFAULT_TWO_FACTOR_ENABLED,
  );
  const twoFactorEnabled = controlledTwoFactor ?? internalTwoFactor;
  const setTwoFactorEnabled = (next: boolean) => {
    if (onTwoFactorEnabledChange) {
      onTwoFactorEnabledChange(next);
    } else {
      setInternalTwoFactor(next);
    }
  };
  const [loginApprovalEnabled, setLoginApprovalEnabled] = useState(true);
  const [transferApprovalEnabled, setTransferApprovalEnabled] = useState(true);
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchedPassword = form.watch("newPassword");
  const watchedConfirm = form.watch("confirmPassword");
  const passwordRequirements = checkPasswordRequirements(watchedPassword);
  const passwordsMatch =
    watchedPassword.length > 0 && watchedPassword === watchedConfirm;

  const canSubmit =
    form.formState.isValid &&
    watchedPassword.length > 0 &&
    watchedConfirm.length > 0;

  /**
   * Invoked by `form.handleSubmit` after zod passes all validations.
   *
   * `_data` is typed as `ChangePasswordFormValues` but intentionally unused —
   * no password value is read, stored, or logged anywhere in this function.
   */
  const handleSaveChanges = async (_data: ChangePasswordFormValues) => {
    setIsSaving(true);
    setStatus({ message: "", type: null });
    try {
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error("Failed to save"));
          } else {
            resolve();
          }
        }, 1500),
      );
      setStatus({
        message:
          "Password policy satisfied. Changes are ready for backend wiring.",
        type: "success",
      });
      form.reset();
    } catch {
      setStatus({
        message: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <KeyRound className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="font-general text-xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
                Password and recovery
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
                  Demo Data
                </span>
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                Keep password work scoped to one card and show validation before
                save.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSaveChanges)}
              noValidate
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldPassword
                  control={form.control}
                  name="newPassword"
                  label="New password"
                  placeholder="Use a strong password"
                  autoComplete="new-password"
                  disabled={isSaving}
                />
                <FormFieldPassword
                  control={form.control}
                  name="confirmPassword"
                  label="Confirm password"
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  disabled={isSaving}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <RequirementItem
                  label="At least 8 characters"
                  met={passwordRequirements.minLength}
                />
                <RequirementItem
                  label="One uppercase letter"
                  met={passwordRequirements.uppercase}
                />
                <RequirementItem
                  label="One special character"
                  met={passwordRequirements.specialChar}
                />
                <RequirementItem
                  label="Passwords match"
                  met={passwordsMatch}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Recovery methods stay hidden until needed to keep the primary
                  path calm.
                </p>
                <Button
                  type="submit"
                  disabled={!canSubmit || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>

              {status.message && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-2xl border px-4 py-3 ${
                    status.type === "success"
                      ? "border-success/20 bg-success/10"
                      : "border-destructive/20 bg-destructive/10"
                  }`}
                >
                  <p
                    role="alert"
                    className={`text-sm ${
                      status.type === "success"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {status.message}
                  </p>
                </div>
              )}
            </form>
          </Form>

          <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show recovery methods
            </summary>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Primary email: {DEMO_SECURITY.primaryEmail}</p>
              <p>Recovery codes: {DEMO_SECURITY.recoveryCodesStatus}</p>
              <p>Backup contact: {DEMO_SECURITY.backupContact}</p>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                <ShieldCheck className="size-5" />
              </span>
              <div className="space-y-1">
                <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                  Verification controls
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Security-sensitive toggles stay grouped with supporting
                  guidance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ToggleCard
              title="Authenticator app verification"
              description="Require a second factor for password resets and critical profile changes."
              badge="Recommended"
              enabled={twoFactorEnabled}
              onToggle={setTwoFactorEnabled}
            />
            <ToggleCard
              title="New device approval"
              description="Challenge sign-ins from browsers or devices you have not approved yet."
              enabled={loginApprovalEnabled}
              onToggle={setLoginApprovalEnabled}
            />
            <ToggleCard
              title="Large transfer approval"
              description="Hold transfers over your threshold for a second confirmation."
              enabled={transferApprovalEnabled}
              onToggle={setTransferApprovalEnabled}
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                  Active sessions
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Review current access before forcing sign-out everywhere.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
              >
                {sessions.length} devices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {sessions.map((session) => {
              const SessionIcon = session.icon;

              return (
                <div
                  key={session.name}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <SessionIcon className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {session.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {session.location}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {session.status}
                    </p>
                  </div>
                </div>
              );
            })}

            <DestructiveActionDialog
              triggerLabel="Sign out all sessions"
              title="Sign out every other session"
              description="This will invalidate every session except the current browser."
              impactItems={[
                "Every signed-in mobile or web session will need to log in again.",
                "Pending high-risk actions will be interrupted until re-authentication.",
                "This action should only be used if you suspect account access issues.",
              ]}
              confirmationToken="LOGOUT"
              confirmationLabel='Type "LOGOUT" to continue'
              confirmLabel="Force sign-out"
              onConfirm={() =>
                setStatus({
                  message:
                    "Session reset requested. All other devices would be signed out.",
                  type: "success",
                })
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
      <CheckCircle2
        className={`size-4 ${met ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
