"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, FileText, Shield, UserRound, Wallet } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DEMO_WALLETS } from "@/lib/demo-data";
import AccountSection, {
  DEFAULT_PROFILE,
  isProfileComplete,
  countCompletedProfileFields,
  totalProfileFields,
} from "./account-section";
import NotificationsSection, {
  DEFAULT_NOTIFICATION_SETTINGS,
  countActiveNotifications,
} from "./notifications-section";
import SecurityTab, { DEFAULT_TWO_FACTOR_ENABLED } from "./security-tab";
import TaxDocumentsSection, {
  AVAILABLE_TAX_DOCUMENTS,
  type TaxDocument,
} from "./tax-documents-section";
import WalletsSection from "./wallets-section";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { isShallowEqual } from "@/utils/objectUtils";

/**
 * Number of wallets currently linked. Sourced from the wallets data the
 * Wallets section renders (eventually `useWallet()` context) rather than a
 * hardcoded "2 linked" literal so the summary stays in sync with reality.
 */
const linkedWalletCount = DEMO_WALLETS.length;

function buildSections(statementCount: number): SettingsHeaderSection[] {
  return [
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
      badge: `${linkedWalletCount} linked`,
    },
    {
      value: "documents",
      label: "Statements",
      description: "Periodic statements and tax summaries.",
      badge: `${statementCount} ready`,
    },
  ];
}

interface SettingsPageShellProps {
  initialSection?: string;
  statements?: TaxDocument[];
}

export default function SettingsPageShell({
  initialSection,
  statements = AVAILABLE_TAX_DOCUMENTS,
}: SettingsPageShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sections = buildSections(statements.length);
  const resolvedInitialSection = sections.some(
    (section) => section.value === initialSection,
  )
    ? initialSection!
    : "account";
  const [activeSection, setActiveSection] = useState(resolvedInitialSection);

  // The shell owns the summary-relevant slice of each section's state so the
  // summary cards and the section editors share a single source of truth. The
  // sections fall back to their own internal state when rendered standalone.
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    DEFAULT_TWO_FACTOR_ENABLED,
  );

  // Snapshots of the two sections that have an explicit "Save" step
  // (Account, Notifications) as of their last successful save. Security's
  // two-factor toggle applies immediately (no draft to lose) and Wallets
  // manages its own unlifted state, so neither contributes to the dirty
  // flag below. Compared against the live state to know whether either
  // section has an edit that hasn't been saved yet.
  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE);
  const [savedNotificationSettings, setSavedNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const hasUnsavedChanges =
    !isShallowEqual(profile, savedProfile) ||
    !isShallowEqual(notificationSettings, savedNotificationSettings);

  const { confirmDiscard } = useUnsavedChangesGuard(hasUnsavedChanges);

  // Summary card values, derived from live state rather than hardcoded copy.
  const profileReadiness = isProfileComplete(profile)
    ? "Complete"
    : `${countCompletedProfileFields(profile)}/${totalProfileFields(
        profile,
      )} done`;
  const activeAlerts = countActiveNotifications(notificationSettings);
  const securityPosture = twoFactorEnabled ? "2-step on" : "2-step off";
  const walletCoverage = `${linkedWalletCount} linked`;
  const statementCoverage = `${statements.length} ready`;

  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [highlightedSearchLabel, setHighlightedSearchLabel] = useState<string | null>(null);

  // Determine if there are unsaved edits. We use a simple deep comparison
  // against the initial defaults since this shell tracks the state.
  const isProfileDirty = JSON.stringify(profile) !== JSON.stringify(DEFAULT_PROFILE);
  const isDirty = isProfileDirty;

  const handleSectionChange = (nextSection: string, searchLabel?: string) => {
    if (nextSection === activeSection && !searchLabel) return;
    if (!confirmDiscard()) return;
    setActiveSection(nextSection);
    if (searchLabel) {
      setHighlightedSearchLabel(searchLabel);
    }
    router.replace(`${pathname}?section=${nextSection}`, {
      scroll: false,
    });
  };

  // Clear the search highlight after the next render cycle so the
  // section component can pick it up and scroll to the control.
  const prevHighlighted = useRef(highlightedSearchLabel);
  useEffect(() => {
    if (prevHighlighted.current && highlightedSearchLabel) {
      prevHighlighted.current = null;
      const timer = setTimeout(() => setHighlightedSearchLabel(null), 4000);
      return () => clearTimeout(timer);
    }
    prevHighlighted.current = highlightedSearchLabel;
  }, [highlightedSearchLabel]);

  const handleDiscardChanges = () => {
    // Reset state to clear the dirty flag
    setProfile(DEFAULT_PROFILE);
    
    if (pendingSection) {
      commitSectionChange(pendingSection);
      setPendingSection(null);
    }
  };

  const handleStay = () => {
    setPendingSection(null);
  };

  return (
    <Tabs
      value={activeSection}
      onValueChange={handleSectionChange}
      orientation="horizontal"
      activationMode="automatic"
      className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,244,245,0.96))] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_22%),linear-gradient(180deg,_#09090B,_#111113)]"
    >
      <SettingsHeader
        pageTitle="Settings that stay easy to scan"
        pageDescription="Grouped sections keep high-frequency work within a couple of taps, while advanced and destructive actions stay clearly separated."
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <div className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-8 px-4 py-8 md:px-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={UserRound}
            label="Profile readiness"
            value={profileReadiness}
            description="Identity, locale, and billing defaults are grouped together."
          />
          <SummaryCard
            icon={Bell}
            label="Alerts enabled"
            value={`${activeAlerts} active`}
            description="Critical alerts remain above lower-priority updates."
          />
          <SummaryCard
            icon={Shield}
            label="Security posture"
            value={securityPosture}
            description="Password, verification, and session controls share one section."
          />
          <SummaryCard
            icon={Wallet}
            label="Wallet coverage"
            value={walletCoverage}
            description="Connected wallets sit next to transfer safeguards."
          />
          <SummaryCard
            icon={FileText}
            label="Statements"
            value={statementCoverage}
            description="Tax summaries and statements stay available for export."
          />
        </section>

        <TabsContent value="account" className="mt-0">
          <AccountSection
            profile={profile}
            onProfileChange={setProfile}
            onSaved={setSavedProfile}
            highlightedSearchLabel={highlightedSearchLabel}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <NotificationsSection
            settings={notificationSettings}
            onSettingsChange={setNotificationSettings}
            onSaved={setSavedNotificationSettings}
            highlightedSearchLabel={highlightedSearchLabel}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecurityTab
            twoFactorEnabled={twoFactorEnabled}
            onTwoFactorEnabledChange={setTwoFactorEnabled}
            highlightedSearchLabel={highlightedSearchLabel}
          />
        </TabsContent>

        <TabsContent value="wallets" className="mt-0">
          <WalletsSection highlightedSearchLabel={highlightedSearchLabel} />
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <TaxDocumentsSection statements={statements} />
        </TabsContent>
      </div>

      <Dialog open={pendingSection !== null} onOpenChange={(open) => !open && handleStay()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved edits in the current tab. If you switch tabs now, those changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStay}>
              Stay
            </Button>
            <Button variant="destructive" onClick={handleDiscardChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
