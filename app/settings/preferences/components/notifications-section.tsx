"use client";

import { useState, useEffect } from "react";
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

export interface NotificationSettingsState {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  marketing: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
  smsChannel: boolean;
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
};

/**
 * Count how many notification preferences are currently enabled. Used by the
 * settings summary "Alerts enabled" card so the number tracks real state.
 */
export function countActiveNotifications(
  settings: NotificationSettingsState,
): number {
  return Object.values(settings).filter(Boolean).length;
}

interface NotificationsSectionProps {
  /**
   * Controlled notification state. When provided the component renders this
   * value and reports edits through `onSettingsChange`. When omitted the
   * section manages its own internal state (standalone use).
   */
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
      localStorage.setItem("notification_preferences", JSON.stringify(settings));

      // Mock API call
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (baseUrl) {
        const res = await fetch(`${baseUrl}/api/user/preferences/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!res.ok) throw new Error("API failed");
      } else {
        // Fallback delay to simulate network UX
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setStatusType("success");
      setStatusMessage("Notification preferences updated. Critical alerts remain prioritized.");
    } catch (_error) {
      setStatusType("error");
      setStatusMessage("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (
    field: keyof NotificationSettingsState,
    value: boolean,
  ) => {
    const next: NotificationSettingsState = { ...settings, [field]: value };
    if (onSettingsChange) {
      onSettingsChange(next);
    } else {
      setInternalSettings(next);
    }
  };

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
            onToggle={(value) => updateSetting("transactionAlerts", value)}
          />
          <ToggleCard
            title="Security notifications"
            description="Get alerted for sign-ins, password resets, and suspicious activity."
            badge="Critical"
            enabled={settings.securityAlerts}
            onToggle={(value) => updateSetting("securityAlerts", value)}
          />
          <ToggleCard
            title="Product updates"
            description="Receive updates when new features or policy changes affect your account."
            enabled={settings.productUpdates}
            onToggle={(value) => updateSetting("productUpdates", value)}
          />
          <ToggleCard
            title="Marketing and announcements"
            description="Optional campaigns, launch notes, and educational content."
            enabled={settings.marketing}
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
              <ToggleCard
                title="Push notifications"
                description="Fastest way to catch changes while you are signed in."
                enabled={settings.pushChannel}
                onToggle={(value) => updateSetting("pushChannel", value)}
              />
              <ToggleCard
                title="SMS fallback"
                description="Reserved for urgent or delivery-critical events."
                enabled={settings.smsChannel}
                onToggle={(value) => updateSetting("smsChannel", value)}
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
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
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
                  className={statusType === "success" ? "text-success" : "text-destructive"}
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
