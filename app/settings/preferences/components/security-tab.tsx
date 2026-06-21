"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkPasswordRequirements } from "@/utils/authUtils";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_SECURITY } from "@/lib/demo-data";
import {
  passwordChangeSchema,
  PasswordChangeFormValues,
} from "@/types/auth";

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

/**
 * SecurityTab component.
 * Renders security-sensitive forms (password updates, two-factor authentication, active sessions).
 * Uses placeholder demo data pending full backend API integration.
 */
export default function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginApprovalEnabled, setLoginApprovalEnabled] = useState(true);
  const [transferApprovalEnabled, setTransferApprovalEnabled] = useState(true);
  const [status, setStatus] = useState<StatusState>({ message: "", type: null });
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");
  const passwordRequirements = checkPasswordRequirements(newPassword);

  const handleSaveChanges = async (_values: PasswordChangeFormValues) => {
    setStatus({ message: "", type: null });
    try {
      await new Promise((resolve, reject) => setTimeout(() => {
        if (Math.random() > 0.8) {
          reject(new Error("Failed to save"));
        } else {
          resolve(null);
        }
      }, 1500));
      setStatus({
        message: "Password policy satisfied. Changes are ready for backend wiring.",
        type: "success",
      });
      form.reset();
    } catch {
      setStatus({
        message: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
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
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSaveChanges)}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-900 dark:text-white">
                        Current password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-900 dark:text-white">
                        New password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Use a strong password"
                          autoComplete="new-password"
                          className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-900 dark:text-white">
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repeat the new password"
                          autoComplete="new-password"
                          className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
                  met={newPassword.length > 0 && newPassword === confirmPassword}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Recovery methods stay hidden until needed to keep the primary path
                  calm.
                </p>
                <Button
                  type="submit"
                  disabled={!form.formState.isValid || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>
            </form>
          </Form>

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
                className={
                  status.type === "success" ? "text-success" : "text-destructive"
                }
              >
                {status.message}
              </p>
            </div>
          )}

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
                  message: "Session reset requested. All other devices would be signed out.",
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
      />
      <span>{label}</span>
    </div>
  );
}
