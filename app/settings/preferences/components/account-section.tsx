'use client';

import { useState, useEffect } from "react";
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

  // Trim before validating so incidental whitespace can neither defeat
  // isValidEmail() nor end up persisted in a form the user never typed.
  const normalizedEmail = profile.email.trim();
  const isEmailValid = isValidEmail(normalizedEmail);
  const showEmailError = isEmailTouched && !isEmailValid;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  timezone: string;
  currency: string;
  legalEntity: string;
  billingCountry: string;
}

export const DEFAULT_PROFILE: ProfileData = {
  firstName: 'Demo',
  lastName: 'User',
  displayName: 'Demo User',
  email: 'user@example.com',
  timezone: 'Africa/Lagos',
  currency: 'USD',
  legalEntity: 'Demo Labs Inc.',
  billingCountry: 'United States',
};

export function isProfileComplete(profile: ProfileData): boolean {
  return Object.values(profile).every((v) => v !== '');
}

export function countCompletedProfileFields(profile: ProfileData): number {
  return Object.values(profile).filter((v) => v !== '').length;
}

export function totalProfileFields(): number {
  return Object.keys(DEFAULT_PROFILE).length;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Component ──────────────────────────────────────────────────────────────

interface AccountSectionProps {
  profile: ProfileData;
  onProfileChange: (profile: ProfileData) => void;
}

export default function AccountSection({
  profile,
  onProfileChange,
}: AccountSectionProps) {
  // Last-known-good snapshot so we can roll back on a failed save.
  const lastSavedProfile = useRef<ProfileData>({ ...profile });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Avatar state ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── Cookie preference state ──────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Restore previously saved cookie preferences from localStorage on mount.
  // The try-catch guards against environments where localStorage is unavailable
  // (SSR, tests with restrictive globals, or disabled storage).
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(
        'stellopay_cookie_preferences',
      );
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setAnalytics(!!parsed.analytics);
        setMarketing(!!parsed.marketing);
      }
    } catch {
      // Ignore when localStorage is unavailable or data is malformed
    }
  }, []);

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
        onSaved?.({ ...profile, email: normalizedEmail });
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
    <div className="space-y-6">
      {/* ── Profile Information ─────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <User className="size-5 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Profile Information
            </h2>
            <p className="text-sm text-muted-foreground">
              Update your personal details and regional defaults.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {profileFields.map(({ key, label, type }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                name={key}
                value={profile[key]}
                onChange={(e) => updateField(key, e.target.value)}
                type={type || 'text'}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Profile Photo ───────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Upload className="size-5 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">
              Profile Photo
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a profile photo. Accepted formats: JPEG, PNG, GIF, WebP.
              Max 5 MB.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-full border bg-muted">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Avatar preview"
                fill
                className="object-cover"
                data-testid="avatar-preview-image"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <User className="size-8" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
              data-testid="avatar-upload-input"
              aria-label="Choose avatar image"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>

            {avatarError && (
              <p className="text-xs text-destructive" role="alert">
                {avatarError}
              </p>
            )}
            {avatarSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400" role="status">
                {avatarSuccess}
              </p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Cookie Preferences ──────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-card-foreground">
          Cookie Preferences
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Manage your granular cookie categories and tracking choices.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Essential Cookies</p>
              <p className="text-xs text-muted-foreground">
                Required for the website to function properly.
              </p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              className="cursor-not-allowed opacity-75"
              aria-label="Essential cookies locked on"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Analytics Cookies</p>
              <p className="text-xs text-muted-foreground">
                Help us improve our website by collecting usage data.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label="Analytics cookies toggle"
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Marketing Cookies</p>
              <p className="text-xs text-muted-foreground">
                Used to deliver relevant advertisements and tracking.
              </p>
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveCookiePreferences}
          className="mt-4"
        >
          Save Cookie Preferences
        </Button>
      </section>

      {/* ── Save bar ────────────────────────────────────────────────────── */}
      <div
        className={`sticky bottom-4 rounded-xl border p-4 shadow-lg backdrop-blur-sm ${
          saveStatus === 'error'
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-border bg-card/95'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-card-foreground">
              Profile Changes
            </p>
            <p className="text-xs text-muted-foreground">
              Unsaved changes will be lost if you navigate away.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badges */}
            {saveStatus === 'success' && (
              <Badge
                variant="secondary"
                className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3.5" />
                Saved
              </Badge>
            )}
            {saveStatus === 'error' && (
              <Badge
                variant="destructive"
                className="gap-1.5"
              >
                <AlertCircle className="size-3.5" />
                Error
              </Badge>
            )}
            {saveStatus === 'saving' && (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
              >
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </Badge>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {saveError && (
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>
    </div>
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
  if (value.trim() === token) return 'Remove extra spaces — type exactly "${token}"';
  if (value.toLowerCase() === token.toLowerCase()) return 'Check capitalization — type exactly "${token}"';
  return 'The text doesn
