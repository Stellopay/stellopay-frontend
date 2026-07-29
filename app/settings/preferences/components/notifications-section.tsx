"use client";

import { useState, useEffect, useId } from "react";
import ToggleCard from "@/components/common/toggle-card";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
}

/**
 * Default notification preferences. Exported so a parent surface (e.g. the
 * settings summary cards) can own the same initial state when it lifts this
 * section into a controlled component.
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
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
  /**
   * Controlled notification state. When provided the component renders this
   * value and reports edits through `onSettingsChange`. When omitted the
   * section manages its own internal state (standalone use).
   */
  settings?: NotificationSettingsState;
  onSettingsChange?: (next: NotificationSettingsState) => void;
  /**
   * Called with the saved settings once a save succeeds, so a parent
   * tracking a dirty/unsaved-changes flag can clear it. Not called when the
   * save fails.
   */
  onSaved?: (saved: NotificationSettingsState) => void;
}

export default function NotificationsSection({
  settings: controlledSettings,
  onSettingsChange,
  onSaved,
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
        const parsed = JSON.parse(stored);
        // Merge with defaults so new fields (digest frequencies) have
        // sensible values even when loaded from older stored payloads.
        setInternalSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
      }
    } catch (_e) {
      // Ignore parse errors or disabled storage
    }
  }, []);

  /**
   * Persists the notification preferences to storage.
   * Prioritizes a mock API base URL if available, falling back to localStorage.
   *
   * SECURITY NOTE: Only safe boolean preferences are persisted.
   * Do not attach PII or sensitive tokens in this client payload.
   */
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      // Persist to safeStorage (localStorage)
      localStorage.setItem(
        "notification_preferences",
        JSON.stringify(settings),
      );

      // Mock API call
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
        // Fallback delay to simulate network UX
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
    field: keyof NotificationSettingsState,
    value: boolean | DigestFrequency,
  ) => {
    if (settings[field] === value) {
      return;
    }

    const next = { ...settings, [field]: value };

    if (onSettingsChange) {
      onSettingsChange(next);
    } else {
      setInternalSettings(next);
    }
  };

  /**
   * Whether per-event notification toggles should be disabled.
   * When any channel has a digest frequency set, we disable the
   * individual event toggles because the user prefers summaries.
   */
  const eventTogglesDisabled =
    isDigestActive(settings, "email") ||
    isDigestActive(settings, "push") ||
    isDigestActive(settings, "sms");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            Notification priorities
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Critical alerts appear first, with marketing and channel preferences
            progressively disclosed below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <ToggleCard
            title="Transaction alerts"
            description="Receive deposits, withdrawals, and transfer status changes as they happen."
            enabled={settings.transactionAlerts}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("transactionAlerts", value)}
          />
          <ToggleCard
            title="Security notifications"
            description="Get alerted for sign-ins, password resets, and suspicious activity."
            badge="Critical"
            enabled={settings.securityAlerts}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("securityAlerts", value)}
          />
          <ToggleCard
            title="Product updates"
            description="Receive updates when new features or policy changes affect your account."
            enabled={settings.productUpdates}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("productUpdates", value)}
          />
          <ToggleCard
            title="Marketing and announcements"
            description="Optional campaigns, launch notes, and educational content."
            enabled={settings.marketing}
            disabled={eventTogglesDisabled}
            onToggle={(value) => updateSetting("marketing", value)}
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
              />
              <DigestFrequencySelector
                value={settings.smsDigestFrequency}
                channel="sms"
                channelEnabled={settings.smsChannel}
                onChange={(freq) =>
                  updateSetting("smsDigestFrequency", freq)
                }
              />
            </div>
          </details>
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
