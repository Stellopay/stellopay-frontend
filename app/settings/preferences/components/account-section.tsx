"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_PROFILE } from "@/lib/demo-data";
import { isValidEmail } from "@/utils/authUtils";

export interface ProfileState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  timezone: string;
  currency: string;
}

/**
 * Default profile values seeded from demo data. Exported so a parent surface
 * (e.g. the settings summary cards) can own the same initial state when it
 * lifts this section into a controlled component.
 */
export const DEFAULT_PROFILE: ProfileState = {
  firstName: DEMO_PROFILE.firstName,
  lastName: DEMO_PROFILE.lastName,
  displayName: DEMO_PROFILE.displayName,
  email: DEMO_PROFILE.email,
  timezone: DEMO_PROFILE.timezone,
  currency: DEMO_PROFILE.currency,
};

/** Number of profile fields that have a non-empty value. */
export function countCompletedProfileFields(profile: ProfileState): number {
  return (Object.values(profile) as string[]).filter(
    (value) => value.trim().length > 0,
  ).length;
}

/** Total number of profile fields tracked. */
export function totalProfileFields(profile: ProfileState): number {
  return Object.keys(profile).length;
}

/** A profile is "complete" once every tracked field is filled in. */
export function isProfileComplete(profile: ProfileState): boolean {
  return countCompletedProfileFields(profile) === totalProfileFields(profile);
}

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

const sectionMap = [
  {
    label: "Account",
    description: "Profile, identity, and region defaults.",
    badge: "Core",
  },
  {
    label: "Notifications",
    description: "Transaction alerts and delivery channels.",
    badge: "Alerts",
  },
  {
    label: "Security",
    description: "Password, verification, and sessions.",
    badge: "Protected",
  },
  {
    label: "Wallets",
    description: "Connected wallets and transfer safeguards.",
    badge: "2 linked",
  },
];

/**
 * AccountSection component.
 * Renders user profile information, identity details, and regional settings.
 * Uses placeholder demo data pending full backend API integration.
 */
interface AccountSectionProps {
  /**
   * Controlled profile state. When provided the component renders this value
   * and reports edits through `onProfileChange`. When omitted the section
   * manages its own internal state (standalone use).
   */
  profile?: ProfileState;
  onProfileChange?: (next: ProfileState) => void;
}

export default function AccountSection({
  profile: controlledProfile,
  onProfileChange,
}: AccountSectionProps = {}) {
  const [internalProfile, setInternalProfile] =
    useState<ProfileState>(DEFAULT_PROFILE);
  const profile = controlledProfile ?? internalProfile;
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const statusTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Trim before validating so incidental whitespace can neither defeat
  // isValidEmail() nor end up persisted in a form the user never typed.
  const normalizedEmail = profile.email.trim();
  const isEmailValid = isValidEmail(normalizedEmail);
  const showEmailError = isEmailTouched && !isEmailValid;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const clearQueuedStatusReset = () => {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  };

  const queueStatusReset = () => {
    clearQueuedStatusReset();
    statusTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        setStatus({ message: "", type: null });
      }
      statusTimeoutRef.current = null;
    }, 5000);
  };

  const updateProfileField = (field: keyof ProfileState, value: string) => {
    const next: ProfileState = { ...profile, [field]: value };
    if (onProfileChange) {
      onProfileChange(next);
    } else {
      setInternalProfile(next);
    }
  };


  /**
   * Validates the email on blur and normalizes the field by trimming
   * leading/trailing whitespace, so the displayed value always matches
   * what {@link isValidEmail} checked and what save would persist.
   */
  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    const trimmed = profile.email.trim();
    if (trimmed !== profile.email) {
      updateProfileField("email", trimmed);
    }
  };

  /**
   * Re-validates the email with the shared isValidEmail() helper before
   * saving. Blocks the save and surfaces an inline status error for
   * malformed emails instead of persisting them.
   */
  const handleSave = async () => {
    setIsEmailTouched(true);

    if (!isEmailValid) {
      setStatus({
        message: "Enter a valid email address before saving.",
        type: "error",
      });
      return;
    }

    if (normalizedEmail !== profile.email) {
      updateProfileField("email", normalizedEmail);
    }

    setIsSaving(true);
    setStatus({ message: "", type: null });
    clearQueuedStatusReset();
    try {
      // Simulate async API call
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          // Simulate occasional failure for testing
          if (Math.random() > 0.8) {
            reject(new Error("Failed to save"));
          } else {
            resolve(null);
          }
        }, 1500),
      );
      if (isMountedRef.current) {
        setStatus({
          message:
            "Account profile changes are staged and ready for backend save.",
          type: "success",
        });
      }
    } catch {
      if (isMountedRef.current) {
        setStatus({
          message: "Failed to save changes. Please try again.",
          type: "error",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
        queueStatusReset();
      }
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src="/Image.png"
                  alt="Profile photo"
                  width={88}
                  height={88}
                  className="rounded-3xl border border-zinc-200 object-cover dark:border-white/10"
                  priority
                />
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#09090B]" />
              </div>
              <div className="space-y-1">
                <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
                  Account identity
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
                    Demo Data
                  </span>
                </CardTitle>
                <CardDescription className="max-w-lg text-zinc-600 dark:text-zinc-400">
                  High-frequency profile fields are visible immediately, while
                  longer-tail metadata stays tucked into disclosure below.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Camera className="size-4" />
              Change photo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="first-name"
              label="First name"
              value={profile.firstName}
              onChange={(value) => updateProfileField("firstName", value)}
              disabled={isSaving}
            />
            <Field
              id="last-name"
              label="Last name"
              value={profile.lastName}
              onChange={(value) => updateProfileField("lastName", value)}
              disabled={isSaving}
            />
            <Field
              id="display-name"
              label="Display name"
              value={profile.displayName}
              onChange={(value) => updateProfileField("displayName", value)}
              disabled={isSaving}
            />
            <Field
              id="email-address"
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfileField("email", value)}
              onBlur={handleEmailBlur}
              disabled={isSaving}
              error={showEmailError}
              errorMessage="Enter a valid email address, e.g. name@example.com."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="timezone"
              label="Timezone"
              value={profile.timezone}
              options={["Africa/Lagos", "Europe/London", "UTC"]}
              onChange={(value) => updateProfileField("timezone", value)}
              disabled={isSaving}
            />
            <SelectField
              id="currency"
              label="Settlement currency"
              value={profile.currency}
              options={["USD", "NGN", "EUR"]}
              onChange={(value) => updateProfileField("currency", value)}
              disabled={isSaving}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Core account edits stay on one card so users do not bounce between
              routes.
            </p>
            <Button onClick={handleSave} disabled={isSaving || !isEmailValid}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save account changes"
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
                  status.type === "success" ? "text-success" : "text-destructive"
                }`}
              >
                {status.message}
              </p>
            </div>
          )}

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show advanced identity and billing fields
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                id="legal-name"
                label="Legal entity"
                value={DEMO_PROFILE.legalEntity}
                onChange={() => undefined}
                disabled
              />
              <Field
                id="billing-country"
                label="Billing country"
                value={DEMO_PROFILE.billingCountry}
                onChange={() => undefined}
                disabled
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
              Section map
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Frequent tasks are grouped into four clear sections to stay within
              the click-depth target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {sectionMap.map((section) => (
              <div
                key={section.label}
                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {section.label}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {section.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-400"
                >
                  {section.badge}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-white/90 shadow-sm dark:bg-white/5">
          <CardHeader className="border-b border-red-500/10">
            <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
              Danger zone
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Destructive actions are isolated from normal profile tasks and
              require explicit typed confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-zinc-600 dark:text-zinc-400">
              Deactivation is intentionally separated from editable profile
              fields to reduce accidental account loss.
            </div>
            <DestructiveActionDialog
              triggerLabel="Deactivate account"
              title="Deactivate this account"
              description="This pauses sign-in and stops access to settings until recovery or support review."
              impactItems={[
                "Wallet operations and new transfers would be blocked.",
                "Team members would lose access until the account is restored.",
                "Support review may be required before reactivation.",
              ]}
              confirmationToken="DEACTIVATE"
              confirmationLabel='Type "DEACTIVATE" to confirm'
              confirmLabel="Confirm deactivation"
              onConfirm={() =>
                setStatus({
                  message:
                    "Deactivation request captured. Keep this action gated until backend approval exists.",
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

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  disabled = false,
  error = false,
  errorMessage,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
}) {
  const fieldId = id;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        id={`${fieldId}-label`}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        error={error}
        errorId={errorId}
        className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
        labelId={`${fieldId}-label`}
        descriptionId={descriptionId}
      />
      {error && errorMessage && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = id;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </Label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white disabled:opacity-50"
        aria-describedby={descriptionId}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
