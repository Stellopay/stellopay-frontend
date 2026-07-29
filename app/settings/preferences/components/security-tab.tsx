"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
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
import { Input } from "@/components/ui/input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { changePasswordSchema, ChangePasswordFormValues } from "@/types/auth";
import {
  calculatePasswordStrength,
  checkPasswordRequirements,
} from "@/utils/authUtils";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_SECURITY } from "@/lib/demo-data";

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

/** Default two-factor state, exported so a parent can own the same initial value. */
export const DEFAULT_TWO_FACTOR_ENABLED = true;

/**
 * The exact length a TOTP/authenticator-app verification code must be to pass
 * client-side validation in the two-factor setup panel.
 */
export const TWO_FACTOR_CODE_LENGTH = 6;

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
 * Client-side validation for a 2FA/authenticator verification code.
 *
 * Rejects anything that isn't exactly {@link TWO_FACTOR_CODE_LENGTH} ASCII
 * digits — whitespace, letters, separators (e.g. `-`), partial lengths, and
 * over-length values all produce a distinct, user-actionable message so a
 * silent failure can never occur before the network is hit.
 *
 * @security The raw value is never logged; it is only inspected in-memory and
 *   the returned string intentionally contains only user-facing guidance text
 *   (never a substring of the typed code).
 *
 * @param value - The raw typed value (never trimmed — a leading/trailing space
 *   is considered an explicit mismatch the user must fix).
 * @returns An inline error string when the value is invalid, or `null` when
 *   the value is acceptable: empty ("user hasn't typed yet") → null; valid
 *   6-digit numeric code → null.
 */
export function getVerificationCodeError(value: string): string | null {
  if (value.length === 0) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    return `Code can only contain digits. Type the ${TWO_FACTOR_CODE_LENGTH}-digit code from your app.`;
  }

  if (value.length < TWO_FACTOR_CODE_LENGTH) {
    const missing = TWO_FACTOR_CODE_LENGTH - value.length;
    return `Code is ${missing} digit${missing === 1 ? "" : "s"} too short.`;
  }

  if (value.length > TWO_FACTOR_CODE_LENGTH) {
    const extra = value.length - TWO_FACTOR_CODE_LENGTH;
    return `Code is ${extra} digit${extra === 1 ? "" : "s"} too long.`;
  }

  return null;
}

/**
 * SecurityTab — password change, two-factor verification setup, and active sessions.
 *
 * ## Two-factor setup flow (verification code validation)
 *
 * When the user toggles the "Authenticator app verification" switch **on** and
 * 2FA is not yet enabled, the component refuses to flip the toggle directly.
 * Instead, it opens a gated setup panel where the user must type a 6-digit
 * numeric TOTP code. Validation layers:
 *
 * 1. **Client-side, on every keystroke** — {@link getVerificationCodeError}
 *    rejects non-digits, partial codes, and over-length codes immediately with
 *    a distinct inline error. `aria-invalid` and `aria-describedby` are wired
 *    to the input so the error is announced.
 * 2. **Submit gate** — the "Verify and enable" button is disabled until the
 *    typed value is a valid 6-digit numeric code AND the async submit is not
 *    in flight.
 * 3. **Second client-side check at submit time** — `handleVerifyTwoFactor`
 *    re-runs `getVerificationCodeError` just before the simulated fetch, so
 *    calling the handler programmatically (or a stale React state) can never
 *    bypass validation.
 *
 * Security behaviour for the verification code:
 * - Input is **cleared immediately** after a failed submit so a code cannot be
 *   re-submitted accidentally or left on-screen.
 * - Input is also cleared after a successful submit (together with the form
 *   state being reset).
 * - The code is never passed to `console.log`, errors, or any `StatusState`
 *   message; only the validation *pattern* is surfaced.
 *
 * @see {@link getVerificationCodeError} for the inline validation rules.
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

  // --- Two-factor setup panel state ---------------------------------------
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSetupInlineError, setTwoFactorSetupInlineError] = useState<
    string | null
  >(null);
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

  const twoFactorCodeError = useMemo(
    () => getVerificationCodeError(twoFactorCode),
    [twoFactorCode],
  );

  /**
   * Whether the typed verification code is valid for submit:
   * - Exactly {@link TWO_FACTOR_CODE_LENGTH} digits
   * - No inline validation error
   * - Async submit not in flight
   *
   * This is the single source of truth for the submit button's `disabled`
   * prop so the form cannot accidentally be submitted with a partial or
   * malformed code.
   */
  const twoFactorCanVerify =
    !twoFactorSubmitting &&
    twoFactorCode.length === TWO_FACTOR_CODE_LENGTH &&
    twoFactorCodeError === null;

  const closeTwoFactorSetup = () => {
    setIsTwoFactorSetupOpen(false);
    setTwoFactorCode("");
    setTwoFactorSetupInlineError(null);
  };

  /**
   * Called when the "Authenticator app verification" ToggleCard is clicked.
   *
   * - If the user is turning 2FA **off** → allow it directly (no code needed;
   *   destructive action flow would be a separate concern, out of scope here).
   * - If the user is turning 2FA **on** → open the gated verification panel
   *   so a code must be typed before the state flips.
   */
  const handleTwoFactorToggleRequest = (nextRequested: boolean) => {
    if (!nextRequested) {
      setTwoFactorEnabled(false);
      closeTwoFactorSetup();
      return;
    }
    setIsTwoFactorSetupOpen(true);
    setTwoFactorCode("");
    setTwoFactorSetupInlineError(null);
  };

  /**
   * Validates + submits the 2FA verification code.
   *
   * @security Re-checks {@link getVerificationCodeError} synchronously before
   *   any awaits so a stale prop/programmatic call cannot skip validation.
   *   After a failed submit the code input is cleared so the value never
   *   lingers in the DOM. After success the code is also cleared + the panel
   *   is closed and the 2FA toggle is flipped on.
   */
  const handleVerifyTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();

    const syncError = getVerificationCodeError(twoFactorCode);
    if (syncError) {
      setTwoFactorSetupInlineError(syncError);
      return;
    }

    setTwoFactorSetupInlineError(null);
    setTwoFactorSubmitting(true);
    try {
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error("Verification failed"));
          } else {
            resolve();
          }
        }, 1200),
      );

      setTwoFactorEnabled(true);
      closeTwoFactorSetup();
      setStatus({
        message:
          "Authenticator app verified. Two-factor is now enabled for this account.",
        type: "success",
      });
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    } catch {
      // Security: clear the failed code immediately so the user must re-type.
      setTwoFactorCode("");
      setTwoFactorSetupInlineError(
        "That code didn't work. Check your authenticator app and try again.",
      );
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchedPassword = form.watch("newPassword");
  const watchedConfirm = form.watch("confirmPassword");
  const passwordRequirements = checkPasswordRequirements(watchedPassword);
  const passwordStrengthResult = useMemo(
    () => calculatePasswordStrength(watchedPassword),
    [watchedPassword],
  );
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
                <div className="space-y-4">
                  <FormFieldPassword
                    control={form.control}
                    name="confirmPassword"
                    label="Confirm password"
                    placeholder="Repeat the new password"
                    autoComplete="new-password"
                    disabled={isSaving}
                  />
                  {watchedPassword.length > 0 && (
                    <PasswordStrengthIndicator
                      strengthResult={passwordStrengthResult}
                    />
                  )}
                </div>
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
                <RequirementItem label="Passwords match" met={passwordsMatch} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Recovery methods stay hidden until needed to keep the primary
                  path calm.
                </p>
                <Button type="submit" disabled={!canSubmit || isSaving}>
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
              onToggle={handleTwoFactorToggleRequest}
            />

            {isTwoFactorSetupOpen && (
              <form
                onSubmit={handleVerifyTwoFactor}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4"
                aria-label="Authenticator verification setup"
              >
                <div className="space-y-3">
                  <p className="flex gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
                    Enter the code displayed in your authenticator app to finish
                    enabling 2FA.
                  </p>

                  <div className="space-y-2">
                    <label
                      htmlFor="two-factor-verification-code"
                      className="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      {`${TWO_FACTOR_CODE_LENGTH}-digit verification code`}
                    </label>
                    <p
                      id="two-factor-code-instruction"
                      className="text-xs text-zinc-600 dark:text-zinc-400"
                    >
                      Type the code exactly as shown — no spaces or letters.
                    </p>
                    <Input
                      id="two-factor-verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={`${"0".repeat(TWO_FACTOR_CODE_LENGTH)}`}
                      value={twoFactorCode}
                      onChange={(event) => {
                        setTwoFactorCode(event.target.value);
                        if (twoFactorSetupInlineError) {
                          setTwoFactorSetupInlineError(null);
                        }
                      }}
                      maxLength={TWO_FACTOR_CODE_LENGTH + 4}
                      disabled={twoFactorSubmitting}
                      error={Boolean(
                        twoFactorCodeError ?? twoFactorSetupInlineError,
                      )}
                      aria-required
                      aria-describedby={
                        [
                          "two-factor-code-instruction",
                          twoFactorCodeError || twoFactorSetupInlineError
                            ? "two-factor-code-error"
                            : undefined,
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined
                      }
                      className="tracking-[0.35em] font-mono text-base text-center"
                    />
                    {(twoFactorCodeError ?? twoFactorSetupInlineError) && (
                      <p
                        id="two-factor-code-error"
                        role="alert"
                        aria-live="polite"
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {twoFactorCodeError ?? twoFactorSetupInlineError}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeTwoFactorSetup}
                      disabled={twoFactorSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!twoFactorCanVerify}
                      className="gap-2"
                    >
                      {twoFactorSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Verify and enable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}

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
        className={`size-4 ${
          met ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
