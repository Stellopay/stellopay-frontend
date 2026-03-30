"use client";

import { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Monitor,
  ShieldCheck,
  Smartphone,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkPasswordRequirements } from "@/utils/authUtils";
import DestructiveActionDialog from "./destructive-action-dialog";

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

export default function SecurityTab() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginApprovalEnabled, setLoginApprovalEnabled] = useState(true);
  const [transferApprovalEnabled, setTransferApprovalEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const passwordRequirements = checkPasswordRequirements(password);
  const isPasswordReady =
    Object.values(passwordRequirements).every(Boolean) &&
    password.length > 0 &&
    password === confirmPassword;

  const handleSaveChanges = () => {
    if (!isPasswordReady) {
      return;
    }

    setStatusMessage(
      "Password policy satisfied. Changes are ready for backend wiring.",
    );
    setPassword("");
    setConfirmPassword("");
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
              <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                Password and recovery
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                Keep password work scoped to one card and show validation before
                save.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="text-sm font-medium text-zinc-900 dark:text-white"
              >
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use a strong password"
                className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium text-zinc-900 dark:text-white"
              >
                Confirm password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat the new password"
                className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
              />
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
            <RequirementItem
              label="Passwords match"
              met={password.length > 0 && password === confirmPassword}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Recovery methods stay hidden until needed to keep the primary path
              calm.
            </p>
            <Button disabled={!isPasswordReady} onClick={handleSaveChanges}>
              Update password
            </Button>
          </div>

          {statusMessage ? (
            <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </p>
          ) : null}

          <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show recovery methods
            </summary>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Primary email: maya.sullivan@stellopay.app</p>
              <p>Recovery codes: generated and stored offline</p>
              <p>Backup contact: +234 801 234 5678</p>
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
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
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
                setStatusMessage(
                  "Session reset requested. All other devices would be signed out.",
                )
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
