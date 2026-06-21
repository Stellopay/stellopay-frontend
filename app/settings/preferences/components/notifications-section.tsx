"use client";

import { useEffect, useRef, useState } from "react";
import ToggleCard from "@/components/common/toggle-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { safeStorage } from "@/utils/safeStorage";

interface NotificationSettingsState {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  marketing: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
  smsChannel: boolean;
}

const NOTIFICATION_SETTINGS_KEY = "stellopay:notification-settings";

const persistNotificationSettings = async (
  settings: NotificationSettingsState,
) => {
  if (!settings.emailChannel && !settings.pushChannel && !settings.smsChannel) {
    throw new Error("Select at least one delivery channel.");
  }

  await new Promise((resolve) => window.setTimeout(resolve, 300));
  safeStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

export default function NotificationsSection() {
  const statusTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );
  const [settings, setSettings] = useState<NotificationSettingsState>({
    transactionAlerts: true,
    securityAlerts: true,
    productUpdates: true,
    marketing: false,
    emailChannel: true,
    pushChannel: true,
    smsChannel: false,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const updateSetting = (
    field: keyof NotificationSettingsState,
    value: boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  };

  const showStatus = (message: string, type: "success" | "error") => {
    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }

    setStatusMessage(message);
    setStatusType(type);
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage("");
      statusTimerRef.current = null;
    }, 5000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage("");

    try {
      await persistNotificationSettings(settings);
      showStatus(
        "Notification preferences saved. Critical alerts remain prioritized.",
        "success",
      );
    } catch (error) {
      showStatus(
        error instanceof Error
          ? error.message
          : "Failed to save notification preferences. Please try again.",
        "error",
      );
    } finally {
      setIsSaving(false);
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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Quiet hours
              </p>
              <Badge variant="outline">Read-only</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              10:00 PM to 6:00 AM local time. Security alerts bypass quiet
              hours. Editable scheduling is pending backend support.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Channel fallback order
              </p>
              <Badge variant="outline">Read-only</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Push, then email, then SMS for urgent account protection notices.
              Editable routing is pending backend support.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save notification settings"
            )}
          </Button>
          {statusMessage ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 ${
                statusType === "success"
                  ? "border-success/20 bg-success/10"
                  : "border-destructive/20 bg-destructive/10"
              }`}
            >
              <p
                className={
                  statusType === "success"
                    ? "text-success"
                    : "text-destructive"
                }
              >
                {statusMessage}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
