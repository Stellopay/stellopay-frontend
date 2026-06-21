"use client";

import { useState } from "react";
import { Bell, Shield, UserRound, Wallet } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SettingsHeader, {
  SettingsHeaderSection,
} from "@/components/settings-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DEMO_WALLETS } from "@/lib/demo-data";
import AccountSection, {
  INITIAL_PROFILE_STATE,
  ProfileState,
} from "./account-section";
import NotificationsSection, {
  INITIAL_NOTIFICATION_SETTINGS,
  NotificationSettingsState,
} from "./notifications-section";
import SecurityTab, {
  INITIAL_SECURITY_SUMMARY,
  SecuritySummaryState,
} from "./security-tab";
import WalletsSection, {
  INITIAL_WALLET_SETTINGS,
  WalletSettingsState,
} from "./wallets-section";

const sections: SettingsHeaderSection[] = [
  {
    value: "account",
    label: "Account",
    description: "Profile, identity, and region defaults.",
    badge: "Core",
  },
  {
    value: "notifications",
    label: "Notifications",
    description: "Transaction alerts and delivery channels.",
    badge: "Alerts",
  },
  {
    value: "security",
    label: "Security",
    description: "Password, verification, and sessions.",
    badge: "Protected",
  },
  {
    value: "wallets",
    label: "Wallets",
    description: "Connected wallets and transfer safeguards.",
    badge: "2 linked",
  },
];

interface SettingsPageShellProps {
  initialSection?: string;
}

export default function SettingsPageShell({
  initialSection,
}: SettingsPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedInitialSection = sections.some(
    (section) => section.value === initialSection,
  )
    ? initialSection!
    : "account";
  const [activeSection, setActiveSection] = useState(resolvedInitialSection);
  const [profileSummary, setProfileSummary] =
    useState<ProfileState>(INITIAL_PROFILE_STATE);
  const [notificationSummary, setNotificationSummary] =
    useState<NotificationSettingsState>(INITIAL_NOTIFICATION_SETTINGS);
  const [securitySummary, setSecuritySummary] =
    useState<SecuritySummaryState>(INITIAL_SECURITY_SUMMARY);
  const [walletSummary, setWalletSummary] = useState<WalletSettingsState>(
    INITIAL_WALLET_SETTINGS,
  );

  const handleSectionChange = (nextSection: string) => {
    setActiveSection(nextSection);
    router.replace(`${pathname}?section=${nextSection}`, {
      scroll: false,
    });
  };

  const profileFieldCount = Object.values(profileSummary).filter(
    (value) => value.trim().length > 0,
  ).length;
  const profileTotalFields = Object.keys(profileSummary).length;
  const profileValue =
    profileFieldCount === profileTotalFields
      ? "Complete"
      : `${profileFieldCount}/${profileTotalFields} ready`;
  const notificationActiveCount =
    countEnabledSettings(notificationSummary);
  const securityActiveCount = countEnabledSettings(securitySummary);
  const walletSafeguardCount = countEnabledSettings(walletSummary);
  const walletCount = DEMO_WALLETS.length;
  const walletCountLabel = formatCount(walletCount, "linked");

  const dynamicSections: SettingsHeaderSection[] = sections.map((section) => {
    if (section.value === "account") {
      return { ...section, badge: profileValue };
    }

    if (section.value === "notifications") {
      return {
        ...section,
        badge: formatCount(notificationActiveCount, "active"),
      };
    }

    if (section.value === "security") {
      return {
        ...section,
        badge: formatCount(securityActiveCount, "active"),
      };
    }

    if (section.value === "wallets") {
      return { ...section, badge: walletCountLabel };
    }

    return section;
  });

  return (
    <Tabs
      value={activeSection}
      onValueChange={handleSectionChange}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,244,245,0.96))] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_22%),linear-gradient(180deg,_#09090B,_#111113)]"
    >
      <SettingsHeader
        pageTitle="Settings that stay easy to scan"
        pageDescription="Grouped sections keep high-frequency work within a couple of taps, while advanced and destructive actions stay clearly separated."
        sections={dynamicSections}
        activeSection={activeSection}
      />

      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={UserRound}
            label="Profile readiness"
            value={profileValue}
            description="Identity, locale, and billing defaults are grouped together."
          />
          <SummaryCard
            icon={Bell}
            label="Alerts enabled"
            value={formatCount(notificationActiveCount, "active")}
            description="Critical alerts remain above lower-priority updates."
          />
          <SummaryCard
            icon={Shield}
            label="Security posture"
            value={formatCount(securityActiveCount, "active")}
            description="Password, verification, and session controls share one section."
          />
          <SummaryCard
            icon={Wallet}
            label="Wallet coverage"
            value={walletCountLabel}
            description={`${formatCount(walletSafeguardCount, "safeguard")} active beside connected wallets.`}
          />
        </section>

        <TabsContent value="account" className="mt-0">
          <AccountSection onSummaryChange={setProfileSummary} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationsSection onSummaryChange={setNotificationSummary} />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecurityTab onSummaryChange={setSecuritySummary} />
        </TabsContent>

        <TabsContent value="wallets" className="mt-0">
          <WalletsSection onSummaryChange={setWalletSummary} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function countEnabledSettings(settings: object) {
  return Object.values(settings).filter(Boolean).length;
}

function formatCount(count: number, label: string) {
  return `${count} ${label}`;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Bell;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="border-zinc-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <Icon className="size-5" />
        </span>
        <div>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {label}
          </CardDescription>
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            {value}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
