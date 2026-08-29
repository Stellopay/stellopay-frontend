'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DestructiveActionDialog } from "./destructive-action-dialog";
import { OAuthCallbackError } from "@/lib/api/auth";

export interface ProfileState {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  timezone: string;
  currency: string;
}

/**
 * Default profile values seeded from demo data. Exported so a parent surface
 * (e.g. the settings summary cards) can own the same initial state when it
 * lifts this section into a controlled component.
 */
export const DEFAULT_PROFILE: ProfileState = {
  firstName: DEMO_PROFILE.firstName,
  lastName: DEMO_PROFILE.lastName,
  displayName: DEMO_PROFILE.displayName,
  email: DEMO_PROFILE.email,
  timezone: DEMO_PROFILE.timezone,
  currency: DEMO_PROFILE.currency,
};

/** Number of profile fields that have a non-empty value. */
export function countCompletedProfileFields(profile: ProfileState): number {
  return (Object.values(profile) as string[]).filter(
    (value) => value.trim().length > 0,
  ).length;
}

/** Total number of profile fields tracked. */
export function totalProfileFields(profile: ProfileState): number {
  return Object.keys(profile).length;
}

/** A profile is "complete" once every tracked field is filled in. */
export function isProfileComplete(profile: ProfileState): boolean {
  return countCompletedProfileFields(profile) === totalProfileFields(profile);
}

interface StatusState {
  message: string;
  type: "success" | "error" | null;
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

export function useDirtyGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const message = "You have unsaved changes. Discard them?";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    let discardConfirmed = false;

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const trigger = target?.closest?.(
        "a, [data-dirty-guard], [data-account-change], [data-wallet-change]",
      ) as HTMLElement | null;
      if (!trigger) return;

      if (trigger instanceof HTMLAnchorElement) {
        if (trigger.target === "_blank" || trigger.hasAttribute("download")) return;
        const href = trigger.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (confirmDiscard()) {
        trigger.click();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const trigger = target?.closest?.(
        "a, [data-dirty-guard], [data-account-change], [data-wallet-change]",
      ) as HTMLElement | null;
      if (!trigger) return;

      if (trigger instanceof HTMLAnchorElement) {
        if (trigger.target === "_blank" || trigger.hasAttribute("download")) return;
        const href = trigger.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (confirmDiscard()) {
        trigger.click();
      }
    };

    const confirmDiscard = (): boolean => {
      if (discardConfirmed) return true;
      if (!window.confirm(message)) return false;
      discardConfirmed = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      return true;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isDirty]);
}

/**
 * AccountSection component.
 * Renders user profile information, identity details, and regional settings.
 * Uses placeholder demo data pending full backend API integration.
 */
interface AccountSectionProps {
  /**
   * Controlled profile state. When provided the component renders this value
   * and reports edits through `onProfileChange`. When omitted the section
   * manages its own internal state (standalone use).
   */
  profile?: ProfileState;
  onProfileChange?: (next: ProfileState) => void;
  /**
   * Called with the final saved profile once a save succeeds, so a parent
   * tracking a dirty/unsaved-changes flag can clear it. Not called on
   * validation failure or a simulated save error.
   */
  onSaved?: (saved: ProfileState) => void;
}

export default function AccountSection({
  profile: controlledProfile,
  onProfileChange,
  onSaved,
}: AccountSectionProps = {}) {
  const [internalProfile, setInternalProfile] =
    useState<ProfileState>(DEFAULT_PROFILE);
  const profile = controlledProfile ?? internalProfile;
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const statusTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const savedProfileRef = useRef<ProfileState>(profile);
  const isDirty = (Object.keys(profile) as (keyof ProfileState)[]).some((key) =>
    key === "email"
      ? profile[key].trim() !== savedProfileRef.current[key].trim()
      : profile[key] !== savedProfileRef.current[key],
  );
  useDirtyGuard(isDirty);

  // Trim before validating so incidental whitespace can neither defeat
  // isValidEmail() nor end up persisted in a form the user never typed.
  const normalizedEmail = profile.email.trim();
  const isEmailValid = isValidEmail(normalizedEmail);
  const showEmailError = isEmailTouched && !isEmailValid;

  useEffect(() => {
    const savedPreferences = localStorage.getItem('stellopay_cookie_preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setAnalytics(!!parsed.analytics);
        setMarketing(!!parsed.marketing);
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setStatus({ message: "", type: null });
    clearQueuedStatusReset();
    try {
      // Simulate async API call
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          // Simulate occasional failure for testing
          if (Math.random() > 0.8) {
            reject(new Error("Failed to save"));
          } else {
            resolve(null);
          }
        }, 1500),
      );
      if (isMountedRef.current) {
        setStatus({
          message:
            "Account profile changes are staged and ready for backend save.",
          type: "success",
        });
        const savedProfile = { ...profile, email: normalizedEmail };
        savedProfileRef.current = savedProfile;
        onSaved?.(savedProfile);
      }
    } catch {
      if (isMountedRef.current) {
        setStatus({
          message: "Failed to save changes. Please try again.",
          type: "error",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
        queueStatusReset();
      }
    }
  };

  return (
    <section className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Cookie Preferences</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
        Manage your granular cookie categories and tracking choices.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Essential Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Required for the website to function properly.</p>
          </div>
          <input type="checkbox" checked disabled className="cursor-not-allowed opacity-75" aria-label="Essential cookies locked on" />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Analytics Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Help us improve our website by collecting usage data.</p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            aria-label="Analytics cookies toggle"
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-md">
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Marketing Cookies</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Used to deliver relevant advertisements and tracking.</p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            aria-label="Marketing cookies toggle"
            className="cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={handleSaveProfile}
        className="mt-5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-md hover:opacity-95 transition"
      >
        Save Preferences
      </button>
    </section>
  );
};

interface AccountSectionProps {
  profile: any;
  onProfileChange: (profile: any) => void;
}

interface DeletionDialogProps {
  title: string;
  description: string;
  impactItems: string[];
  confirmationToken: string;
  confirmationLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}

const getConfirmationError = (value: string, token: string): string | null => {
  if (value === token) return null;
  if (value.trim() === token) return `Remove extra spaces — type exactly "${token}"`;
  if (value.toLowerCase() === token.toLowerCase()) return `Check capitalization — type exactly "${token}"`;
  return `The text doesn't match — type exactly "${token}"`;
};
