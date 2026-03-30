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
import AccountSection from "./account-section";
import NotificationsSection from "./notifications-section";
import SecurityTab from "./security-tab";
import WalletsSection from "./wallets-section";

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

  const handleSectionChange = (nextSection: string) => {
    setActiveSection(nextSection);
    router.replace(`${pathname}?section=${nextSection}`, {
      scroll: false,
    });
  };

  return (
    <Tabs
      value={activeSection}
      onValueChange={handleSectionChange}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,244,245,0.96))] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_22%),linear-gradient(180deg,_#09090B,_#111113)]"
    >
      <SettingsHeader
        pageTitle="Settings that stay easy to scan"
        pageDescription="Grouped sections keep high-frequency work within a couple of taps, while advanced and destructive actions stay clearly separated."
        sections={sections}
        activeSection={activeSection}
      />

      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={UserRound}
            label="Profile readiness"
            value="Complete"
            description="Identity, locale, and billing defaults are grouped together."
          />
          <SummaryCard
            icon={Bell}
            label="Alerts enabled"
            value="5 active"
            description="Critical alerts remain above lower-priority updates."
          />
          <SummaryCard
            icon={Shield}
            label="Security posture"
            value="2-step on"
            description="Password, verification, and session controls share one section."
          />
          <SummaryCard
            icon={Wallet}
            label="Wallet coverage"
            value="2 linked"
            description="Connected wallets sit next to transfer safeguards."
          />
        </section>

        <TabsContent value="account" className="mt-0">
          <AccountSection />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="wallets" className="mt-0">
          <WalletsSection />
        </TabsContent>
      </div>
    </Tabs>
  );
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
