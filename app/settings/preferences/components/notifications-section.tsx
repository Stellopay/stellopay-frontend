"use client";

 ui/notifications-section-channel-matrix
import { useState, useEffect } from "react";

import { useState, useEffect, useId } from "react";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import ToggleCard from "@/components/common/toggle-card";
 main
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

 ui/notifications-section-channel-matrix
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

/** Available digest frequency options for each notification channel. */
export type DigestFrequency = "immediate" | "daily" | "weekly";

export const DIGEST_FREQUENCY_LABELS: Record<DigestFrequency, string> = {
  immediate: "Immediate",
  daily: "Daily digest",
  weekly: "Weekly digest",
};

export interface NotificationSettingsState {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  marketing: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
  smsChannel: boolean;
  /** Digest frequency for email channel. Defaults to "immediate". */
  emailDigestFrequency: DigestFrequency;
  /** Digest frequency for push channel. Defaults to "immediate". */
  pushDigestFrequency: DigestFrequency;
  /** Digest frequency for SMS channel. Defaults to "immediate". */
  smsDigestFrequency: DigestFrequency;
 main
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
 ui/notifications-section-channel-matrix
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

  transactionAlerts: true,
  securityAlerts: true,
  productUpdates: true,
  marketing: false,
  emailChannel: true,
  pushChannel: true,
  smsChannel: false,
  emailDigestFrequency: "immediate",
  pushDigestFrequency: "immediate",
  smsDigestFrequency: "immediate",
};

/**
 * Count how many notification preferences are currently enabled. Used by the
 * settings summary "Alerts enabled" card so the number tracks real state.
 *
 * Only counts boolean fields — digest frequency strings are excluded.
 */
export function countActiveNotifications(
  settings: NotificationSettingsState,
): number {
  return Object.entries(settings).filter(
    ([, value]) => typeof value === "boolean" && value === true,
  ).length;
}

// ─── Digest Frequency Selector ───────────────────────────────────────────────

interface DigestFrequencySelectorProps {
  value: DigestFrequency;
  channel: "email" | "push" | "sms";
  channelEnabled: boolean;
  onChange: (freq: DigestFrequency) => void;
}

/**
 * Radio-group-style selector for choosing digest frequency per channel.
 *
 * Accessibility:
 * - Uses native radio inputs inside a fieldset for keyboard navigation.
 * - Visually hidden when the parent channel is disabled.
 */
function DigestFrequencySelector({
  value,
  channel,
  channelEnabled,
  onChange,
}: DigestFrequencySelectorProps) {
  const legendId = useId();

  if (!channelEnabled) {
    return null;
  }

  const options: DigestFrequency[] = ["immediate", "daily", "weekly"];

  return (
    <fieldset
      aria-labelledby={legendId}
      className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/5"
    >
      <legend id={legendId} className="sr-only">
        {channel} digest frequency
      </legend>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Frequency:
        </span>
        {options.map((freq) => {
          const inputId = `digest-${channel}-${freq}`;
          return (
            <label
              key={freq}
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-1 dark:focus-within:ring-white ${
                value === freq
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 bg-transparent text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              <input
                type="radio"
                id={inputId}
                name={`digest-frequency-${channel}`}
                value={freq}
                checked={value === freq}
                onChange={() => onChange(freq)}
                data-testid={`digest-${channel}-${freq}`}
                className="sr-only"
              />
              {DIGEST_FREQUENCY_LABELS[freq]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
 main
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the given channel has a non-immediate digest frequency
 * selected, meaning per-event toggles should be visually disabled.
 */
function isDigestActive(
  s: NotificationSettingsState,
  channel: "email" | "push" | "sms",
): boolean {
  switch (channel) {
    case "email":
      return s.emailDigestFrequency !== "immediate";
    case "push":
      return s.pushDigestFrequency !== "immediate";
    case "sms":
      return s.smsDigestFrequency !== "immediate";
  }
}

// ─── Notifications Section ───────────────────────────────────────────────────

interface NotificationsSectionProps {
  settings?: NotificationSettingsState;
  onSettingsChange?: (next: NotificationSettingsState) => void;
  /**
   * Called with the saved settings once a save succeeds, so a parent
   * tracking a dirty/unsaved-changes flag can clear it. Not called when the
   * save fails.
   */
  onSaved?: (saved: NotificationSettingsState) => void;
  /** When set, scrolls to and highlights the matching control. */
  highlightedSearchLabel?: string | null;
}

export default function NotificationsSection({
  settings: controlledSettings,
  onSettingsChange,
  onSaved,
  highlightedSearchLabel,
}: NotificationsSectionProps = {}) {
  useSearchHighlight(highlightedSearchLabel ?? null);
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
        const parsed = JSON.parse(stored);
        // Merge with defaults so new fields (digest frequencies) have
        // sensible values even when loaded from older stored payloads.
        setInternalSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
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
      setStatusMessage("Notification preferences updated. Critical alerts remain prioritized.");
      onSaved?.(settings);
    } catch (_error) {
      setStatusType("error");
      setStatusMessage("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (
 ui/notifications-section-channel-matrix
    typeKey: keyof NotificationSettingsState,
    channelKey: keyof ChannelPreferences,
    value: boolean,
  ) => {
    if (settings[typeKey][channelKey] === value) return;

    const next = {
      ...settings,
      [typeKey]: { ...settings[typeKey], [channelKey]: value },
    };

    field: keyof NotificationSettingsState,
    value: boolean | DigestFrequency,
  ) => {
    if (settings[field] === value) {
      return;
    }

    const next = { ...settings, [field]: value };
 main

    if (onSettingsChange) {
      onSettingsChange(next);
    } else {
      setInternalSettings(next);
    }
  };

 ui/notifications-section-channel-matrix
  const checkboxId = (
    typeKey: string,
    channelKey: string,
  ) => `notif-${typeKey}-${channelKey}`;

  /**
   * Whether per-event notification toggles should be disabled.
   * When any channel has a digest frequency set, we disable the
   * individual event toggles because the user prefers summaries.
   */
  const eventTogglesDisabled =
    isDigestActive(settings, "email") ||
    isDigestActive(settings, "push") ||
    isDigestActive(settings, "sms");
 main

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
 ui/notifications-section-channel-matrix
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

        <CardContent className="space-y-4 pt-6">
          <ToggleCard
            title="Transaction alerts"
            description="Receive deposits, withdrawals, and transfer status changes as they happen."
            enabled={settings.transactionAlerts}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("transactionAlerts", value)}
            searchLabel="Transaction alerts"
          />
          <ToggleCard
            title="Security notifications"
            description="Get alerted for sign-ins, password resets, and suspicious activity."
            badge="Critical"
            enabled={settings.securityAlerts}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("securityAlerts", value)}
            searchLabel="Security notifications"
          />
          <ToggleCard
            title="Product updates"
            description="Receive updates when new features or policy changes affect your account."
            enabled={settings.productUpdates}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("productUpdates", value)}
            searchLabel="Product updates"
          />
          <ToggleCard
            title="Marketing and announcements"
            description="Optional campaigns, launch notes, and educational content."
            enabled={settings.marketing}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("marketing", value)}
            searchLabel="Marketing and announcements"
          />

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Customize delivery channels
            </summary>
            <div className="mt-4 space-y-3">
              <ToggleCard
                title="Email"
                description="Primary channel for receipts and account notices."
                enabled={settings.emailChannel}
                onToggle={(value) => updateSetting("emailChannel", value)}
                searchLabel="Email"
              />
              <DigestFrequencySelector
                value={settings.emailDigestFrequency}
                channel="email"
                channelEnabled={settings.emailChannel}
                onChange={(freq) =>
                  updateSetting("emailDigestFrequency", freq)
                }
              />
              <ToggleCard
                title="Push notifications"
                description="Fastest way to catch changes while you are signed in."
                enabled={settings.pushChannel}
                onToggle={(value) => updateSetting("pushChannel", value)}
                searchLabel="Push notifications"
              />
              <DigestFrequencySelector
                value={settings.pushDigestFrequency}
                channel="push"
                channelEnabled={settings.pushChannel}
                onChange={(freq) =>
                  updateSetting("pushDigestFrequency", freq)
                }
              />
              <ToggleCard
                title="SMS fallback"
                description="Reserved for urgent or delivery-critical events."
                enabled={settings.smsChannel}
                onToggle={(value) => updateSetting("smsChannel", value)}
                searchLabel="SMS fallback"
              />
              <DigestFrequencySelector
                value={settings.smsDigestFrequency}
                channel="sms"
                channelEnabled={settings.smsChannel}
                onChange={(freq) =>
                  updateSetting("smsDigestFrequency", freq)
                }
              />
 main
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
