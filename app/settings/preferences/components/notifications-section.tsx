"use client";

import { useState } from "react";
import ToggleCard from "@/components/common/toggle-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface NotificationSettingsState {
  transactionAlerts: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  marketing: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
  smsChannel: boolean;
}

export default function NotificationsSection() {
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

  const updateSetting = (
    field: keyof NotificationSettingsState,
    value: boolean,
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
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
            onClick={() =>
              setStatusMessage(
                "Notification preferences updated. Critical alerts remain prioritized.",
              )
            }
          >
            Save notification settings
          </Button>
          {statusMessage ? (
            <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              {statusMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
