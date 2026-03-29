"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
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
import DestructiveActionDialog from "./destructive-action-dialog";

interface ProfileState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  timezone: string;
  currency: string;
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

export default function AccountSection() {
  const [profile, setProfile] = useState<ProfileState>({
    firstName: "Maya",
    lastName: "Sullivan",
    displayName: "Maya Sullivan",
    email: "maya.sullivan@stellopay.app",
    timezone: "Africa/Lagos",
    currency: "USD",
  });
  const [statusMessage, setStatusMessage] = useState("");

  const updateProfileField = (field: keyof ProfileState, value: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
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
                <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
                  Account identity
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
            />
            <Field
              id="last-name"
              label="Last name"
              value={profile.lastName}
              onChange={(value) => updateProfileField("lastName", value)}
            />
            <Field
              id="display-name"
              label="Display name"
              value={profile.displayName}
              onChange={(value) => updateProfileField("displayName", value)}
            />
            <Field
              id="email-address"
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfileField("email", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="timezone"
              label="Timezone"
              value={profile.timezone}
              options={["Africa/Lagos", "Europe/London", "UTC"]}
              onChange={(value) => updateProfileField("timezone", value)}
            />
            <SelectField
              id="currency"
              label="Settlement currency"
              value={profile.currency}
              options={["USD", "NGN", "EUR"]}
              onChange={(value) => updateProfileField("currency", value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Core account edits stay on one card so users do not bounce between
              routes.
            </p>
            <Button
              onClick={() =>
                setStatusMessage(
                  "Account profile changes are staged and ready for backend save.",
                )
              }
            >
              Save account changes
            </Button>
          </div>

          {statusMessage ? (
            <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </p>
          ) : null}

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show advanced identity and billing fields
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                id="legal-name"
                label="Legal entity"
                value="Stellopay Labs"
                onChange={() => undefined}
                disabled
              />
              <Field
                id="billing-country"
                label="Billing country"
                value="Nigeria"
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
                setStatusMessage(
                  "Deactivation request captured. Keep this action gated until backend approval exists.",
                )
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
  type = "text",
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white"
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
