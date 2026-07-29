"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ChannelPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationSettingsState {
  transactionAlerts: ChannelPreferences;
  securityAlerts: ChannelPreferences;
  productUpdates: ChannelPreferences;
  marketing: ChannelPreferences;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  transactionAlerts: { email: true, push: true, sms: false },
  securityAlerts: { email: true, push: true, sms: false },
  productUpdates: { email: true, push: true, sms: false },
  marketing: { email: false, push: false, sms: false },
};

const NOTIFICATION_TYPES = [
  {
    key: "transactionAlerts" as const,
    label: "Transaction alerts",
    description:
      "Receive deposits, withdrawals, and transfer status changes as they happen.",
  },
  {
    key: "securityAlerts" as const,
    label: "Security notifications",
    description:
      "Get alerted for sign-ins, password resets, and suspicious activity.",
    badge: "Critical",
  },
  {
    key: "productUpdates" as const,
    label: "Product updates",
    description:
      "Receive updates when new features or policy changes affect your account.",
  },
  {
    key: "marketing" as const,
    label: "Marketing and announcements",
    description:
      "Optional campaigns, launch notes, and educational content.",
  },
] as const;

const CHANNELS = [
  { key: "email" as const, label: "Email" },
  { key: "push" as const, label: "Push" },
  { key: "sms" as const, label: "SMS" },
] as const;

export function countActiveNotifications(
  settings: NotificationSettingsState,
): number {
  let count = 0;
  const types = Object.values(settings);
  for (const channels of types) {
    const values = Object.values(channels);
    for (const v of values) {
      if (v) count++;
    }
  }
  return count;
}

interface NotificationsSectionProps {
  settings?: NotificationSettingsState;
  onSettingsChange?: (next: NotificationSettingsState) => void;
}

export default function NotificationsSection({
  settings: controlledSettings,
  onSettingsChange,
}: NotificationsSectionProps = {}) {
  const [internalSettings, setInternalSettings] =
    useState<NotificationSettingsState>(DEFAULT_NOTIFICATION_SETTINGS);
  const settings = controlledSettings ?? internalSettings;
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("notification_preferences");
      if (stored) {
        setInternalSettings(JSON.parse(stored));
      }
    } catch (_e) {
      // Ignore parse errors or disabled storage
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      localStorage.setItem(
        "notification_preferences",
        JSON.stringify(settings),
      );

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (baseUrl) {
        const res = await fetch(
          `${baseUrl}/api/user/preferences/notifications`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
          },
        );
        if (!res.ok) throw new Error("API failed");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setStatusType("success");
      setStatusMessage(
        "Notification preferences updated. Critical alerts remain prioritized.",
      );
    } catch (_error) {
      setStatusType("error");
      setStatusMessage("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (
    typeKey: keyof NotificationSettingsState,
    channelKey: keyof ChannelPreferences,
    value: boolean,
  ) => {
    if (settings[typeKey][channelKey] === value) return;

    const next = {
      ...settings,
      [typeKey]: { ...settings[typeKey], [channelKey]: value },
    };

    if (onSettingsChange) {
      onSettingsChange(next);
    } else {
      setInternalSettings(next);
    }
  };

  const checkboxId = (
    typeKey: string,
    channelKey: string,
  ) => `notif-${typeKey}-${channelKey}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            Notification preferences
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Choose which events to receive and which channels to deliver them
            on. Each combination can be set independently.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* ── Desktop: matrix table ── */}
          <div
            role="table"
            aria-label="Notification type and delivery channel matrix"
            className="hidden md:block"
            data-testid="notif-matrix-desktop"
          >
            <div
              role="row"
              className="grid grid-cols-[1fr_80px_80px_80px] gap-4 border-b border-border px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <div role="columnheader">Notification type</div>
              <div role="columnheader" className="text-center">Email</div>
              <div role="columnheader" className="text-center">Push</div>
              <div role="columnheader" className="text-center">SMS</div>
            </div>

            {NOTIFICATION_TYPES.map((type, idx) => (
              <div
                key={type.key}
                role="row"
                className={`grid grid-cols-[1fr_80px_80px_80px] gap-4 px-4 py-3 ${
                  idx < NOTIFICATION_TYPES.length - 1
                    ? "border-b border-border/50"
                    : ""
                }`}
              >
                <div role="cell">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {type.label}
                    </span>
                    {"badge" in type && type.badge ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                        {type.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {type.description}
                  </p>
                </div>

                {CHANNELS.map((channel) => (
                  <div
                    key={channel.key}
                    role="cell"
                    className="flex items-center justify-center"
                  >
                    <Checkbox
                      id={checkboxId(type.key, channel.key)}
                      checked={settings[type.key][channel.key]}
                      onCheckedChange={(checked) =>
                        updateSetting(type.key, channel.key, checked === true)
                      }
                      aria-label={`${type.label}, ${channel.key} channel`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Mobile: stacked layout ── */}
          <div className="space-y-4 md:hidden" data-testid="notif-matrix-mobile">
            {NOTIFICATION_TYPES.map((type) => (
              <div
                key={type.key}
                className="rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {type.label}
                    </span>
                    {"badge" in type && type.badge ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                        {type.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {type.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {CHANNELS.map((channel) => (
                    <label
                      key={channel.key}
                      htmlFor={checkboxId(type.key, channel.key)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5"
                    >
                      <Checkbox
                        id={checkboxId(type.key, channel.key)}
                        checked={settings[type.key][channel.key]}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            type.key,
                            channel.key,
                            checked === true,
                          )
                        }
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {channel.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
            Delivery windows
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Quiet hours and response expectations help users understand how
            alerts are routed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Quiet hours
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              10:00 PM to 6:00 AM local time. Security alerts bypass quiet
              hours.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Channel fallback order
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Push, then email, then SMS for urgent account protection notices.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save notification settings"}
          </Button>
          <div aria-live="polite" aria-atomic="true">
            {statusMessage ? (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  statusType === "success"
                    ? "border-success/20 bg-success/10"
                    : "border-destructive/20 bg-destructive/10"
                }`}
              >
                <FormMessage
                  variant={statusType}
                  className={
                    statusType === "success"
                      ? "text-success"
                      : "text-destructive"
                  }
                >
                  {statusMessage}
                </FormMessage>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
