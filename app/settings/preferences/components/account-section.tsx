"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { saveProfile } from "@/lib/api/profile";
import { PROFILE_PLACEHOLDER_MESSAGES } from "@/lib/api/profile";
import { DEMO_PROFILE } from "@/lib/demo-data";
import {
  PROFILE_FIELDS,
  countCompletedProfileDataFields,
  isProfileDataComplete,
  totalProfileDataFields,
  type ProfileData,
  type ProfileSource,
} from "@/types/profile";
import { isValidEmail } from "@/utils/authUtils";

export type { ProfileData };

/** Largest avatar we accept, in bytes. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/**
 * Default profile values seeded from demo data. Exported so a parent surface
 * (e.g. the settings summary cards) can own the same initial state when it
 * lifts this section into a controlled component.
 */
export const DEFAULT_PROFILE: ProfileData = {
  firstName: DEMO_PROFILE.firstName,
  lastName: DEMO_PROFILE.lastName,
  displayName: DEMO_PROFILE.displayName,
  email: DEMO_PROFILE.email,
  timezone: DEMO_PROFILE.timezone,
  currency: DEMO_PROFILE.currency,
  legalEntity: DEMO_PROFILE.legalEntity,
  billingCountry: DEMO_PROFILE.billingCountry,
};

/** Number of profile fields that have a non-empty value. */
export function countCompletedProfileFields(profile: ProfileData): number {
  return countCompletedProfileDataFields(profile);
}

/**
 * Total number of profile fields tracked. Defaults to the standard profile so
 * callers that only need the total do not have to pass one.
 */
export function totalProfileFields(profile: ProfileData = DEFAULT_PROFILE): number {
  return totalProfileDataFields();
}

/** A profile is "complete" once every tracked field is filled in. */
export function isProfileComplete(profile: ProfileData): boolean {
  return isProfileDataComplete(profile);
}

export function useDirtyGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const message = "You have unsaved changes. Discard them?";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    let discardConfirmed = false;

    const confirmDiscard = (): boolean => {
      if (discardConfirmed) return true;
      if (!window.confirm(message)) return false;
      discardConfirmed = true;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      return true;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}

/** Human labels for each profile field, keyed by field name. */
const FIELD_LABELS: Record<keyof ProfileData, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  displayName: "Display Name",
  email: "Email",
  timezone: "Timezone",
  currency: "Currency",
  legalEntity: "Legal Entity",
  billingCountry: "Billing Country",
};

/** DOM ids for each profile field, kept stable for e2e and label wiring. */
const FIELD_IDS: Record<keyof ProfileData, string> = {
  firstName: "first-name",
  lastName: "last-name",
  displayName: "display-name",
  email: "email-address",
  timezone: "timezone",
  currency: "currency",
  legalEntity: "legal-name",
  billingCountry: "billing-country",
};

/** Fields shown only inside the collapsible "advanced" disclosure. */
const ADVANCED_FIELDS: readonly (keyof ProfileData)[] = [
  "legalEntity",
  "billingCountry",
];

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

/**
 * Renders the profile form.
 *
 * Every consumer of the profile goes through one of these states, so no screen
 * can end up silently rendering seeded data as if it were real:
 *
 * - `loading` — a skeleton, so the layout does not jump when data lands.
 * - `error`   — a retryable panel; the request failing is a visible state.
 * - `empty`   — the profile loaded but has no populated fields.
 * - `success` — the form, plus a visible "Demo Data" badge whenever the values
 *               came from the placeholder path rather than the API.
 */
function AccountSectionView({
  profile,
  onProfileChange,
  onSaved,
  highlightedSearchLabel,
  profileSource,
  status,
  setStatus,
  isSaving,
  setIsSaving,
  loadError,
  retryLoad,
  isLoading,
}: {
  profile: ProfileData;
  onProfileChange?: (next: ProfileData) => void;
  onSaved?: (saved: ProfileData) => void;
  highlightedSearchLabel?: string | null;
  profileSource: ProfileSource;
  status: StatusState;
  setStatus: (status: StatusState) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  loadError: Error | null;
  retryLoad?: () => void;
  isLoading: boolean;
}) {
  useSearchHighlight(highlightedSearchLabel ?? null);

  // Snapshot by value: a controlled parent owns this object and may mutate it
  // in place, so holding the reference would let edits leak into the "last
  // known good" snapshot and make the rollback a no-op.
  const lastKnownGoodRef = useRef<ProfileData>({ ...profile });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const normalizedEmail = profile.email.trim();
  const isEmailValid = isValidEmail(normalizedEmail);
  const hasDirtyEdits = useMemo(
    () =>
      PROFILE_FIELDS.some(
        (field) => profile[field] !== lastKnownGoodRef.current[field],
      ),
    [profile],
  );

  useDirtyGuard(hasDirtyEdits);

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    const next = { ...profile, [field]: value };
    if (onProfileChange) onProfileChange(next);
    setStatus({ message: "", type: null });
  };

  const handleSaveProfile = async () => {
    if (!isEmailValid) {
      setStatus({ message: "Enter a valid email address.", type: "error" });
      return;
    }

    setIsSaving(true);
    setStatus({ message: "", type: null });

    const submitted: ProfileData = { ...profile, email: normalizedEmail };
    const previous: ProfileData = { ...lastKnownGoodRef.current };

    try {
      // `saveProfile` issues a real request when the API is configured and
      // otherwise reports that the change was only staged locally.
      const outcome = await saveProfile(submitted);
      const staged = outcome?.source === "placeholder";

      if (isMountedRef.current) {
        setStatus({
          message: staged
            ? "Account profile changes are staged and ready for backend save."
            : "Account profile changes saved.",
          type: "success",
        });
        lastKnownGoodRef.current = { ...submitted };
        // No `onProfileChange` here: the parent already holds the edited value
        // (this is the controlled source of truth), so re-emitting it would
        // look like a rollback to any parent tracking its own draft.
        onSaved?.(submitted);
        toast.success(
          staged
            ? "Profile changes staged — the profile API is not configured yet."
            : "Profile changes saved.",
        );
      }
    } catch {
      if (isMountedRef.current) {
        // Roll the form back to the last value the server actually accepted so
        // the user is never left looking at edits that were not persisted.
        lastKnownGoodRef.current = { ...previous };
        if (onProfileChange) onProfileChange(previous);
        setStatus({
          message: "Failed to save profile. Your changes were reverted.",
          type: "error",
        });
        toast.error("Failed to save profile — your changes were reverted.");
      }
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card
        data-testid="profile-loading"
        className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <CardHeader>
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            Account profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Loading profile…</span>
          <Skeleton className="h-10 w-24 rounded-full" />
          {PROFILE_FIELDS.filter((field) => !ADVANCED_FIELDS.includes(field)).map(
            (field) => (
              <div key={field} className="space-y-2">
                <SkeletonLine className="w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <Card
        data-testid="profile-error"
        className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <CardHeader>
          <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white">
            Account profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Could not load your profile"
            description={loadError.message}
            {...(retryLoad ? { onRetry: retryLoad } : {})}
          />
        </CardContent>
      </Card>
    );
  }

  const isEmptyProfile = PROFILE_FIELDS.every(
    (field) => profile[field].trim().length === 0,
  );

  const renderField = (field: keyof ProfileData) => (
    <div key={field} className="space-y-2">
      <Label htmlFor={FIELD_IDS[field]}>{FIELD_LABELS[field]}</Label>
      <Input
        id={FIELD_IDS[field]}
        value={profile[field]}
        onChange={(event) => handleFieldChange(field, event.target.value)}
        autoComplete={field === "email" ? "email" : "off"}
      />
    </div>
  );

  return (
    <div className="space-y-6" data-testid="profile-section">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <CardTitle className="flex flex-wrap items-center gap-3 font-general text-2xl text-zinc-950 dark:text-white">
            Account profile
            {profileSource === "placeholder" ? (
              <span
                data-testid="profile-placeholder-badge"
                className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
              >
                Demo Data
              </span>
            ) : null}
          </CardTitle>
          {profileSource === "placeholder" ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {PROFILE_PLACEHOLDER_MESSAGES.api_base_url_missing}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {isEmptyProfile ? (
            <p
              role="status"
              className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300"
            >
              Your profile is empty. Fill in your details below to get started.
            </p>
          ) : null}

          <AvatarUpload />

          <div className="grid gap-4 md:grid-cols-2">
            {PROFILE_FIELDS.filter(
              (field) => !ADVANCED_FIELDS.includes(field),
            ).map(renderField)}
          </div>

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show advanced identity and billing fields
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {ADVANCED_FIELDS.map(renderField)}
            </div>
          </details>

          {!isEmailValid ? (
            <p role="alert" className="text-sm text-destructive">
              Enter a valid email address.
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              data-search-label="Save Changes"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>

            <span
              role="status"
              aria-live="polite"
              data-testid="profile-save-status"
              className="text-sm font-medium"
            >
              {isSaving ? "Saving…" : null}
              {!isSaving && status.type === "success" ? "Saved" : null}
              {!isSaving && status.type === "error" ? "Error" : null}
            </span>
          </div>

          {status.message ? (
            <p
              data-testid="profile-save-message"
              className={
                status.type === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-success"
              }
            >
              {status.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <CookiePreferencesCard />
    </div>
  );
}

/** Avatar picker with client-side type and size validation. */
function AvatarUpload() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setIsError(true);
      setMessage("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setIsError(true);
      setMessage("File size must be less than 5MB.");
      return;
    }

    setIsError(false);
    setMessage("Photo staged for upload.");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="avatar-upload">Profile photo</Label>
      <input
        id="avatar-upload"
        data-testid="avatar-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-300 dark:file:bg-white dark:file:text-zinc-900"
      />
      {message ? (
        <p
          role="status"
          className={
            isError
              ? "text-sm text-destructive"
              : "text-sm text-success"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

/** Cookie category toggles persisted to local storage on save. */
function CookiePreferencesCard() {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stellopay_cookie_preferences");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setAnalytics(!!parsed.analytics);
      setMarketing(!!parsed.marketing);
    } catch (error) {
      console.error("Failed to parse cookie preferences", error);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem(
      "stellopay_cookie_preferences",
      JSON.stringify({ essential: true, analytics, marketing }),
    );
    setIsSaving(false);
    setStatus("Cookie preferences saved.");
  };

  return (
    <section
      data-testid="cookie-preferences"
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Cookie Preferences
      </h2>
      <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
        Manage your granular cookie categories and tracking choices.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-zinc-800/50">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Essential Cookies
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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

        <div className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-zinc-800/50">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Analytics Cookies
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Help us improve our website by collecting usage data.
            </p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) => setAnalytics(event.target.checked)}
            aria-label="Analytics cookies toggle"
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-zinc-800/50">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Marketing Cookies
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Used to deliver relevant advertisements and tracking.
            </p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(event) => setMarketing(event.target.checked)}
            aria-label="Marketing cookies toggle"
            className="cursor-pointer"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 dark:bg-white dark:text-black"
      >
        {isSaving ? "Saving…" : "Save cookie preferences"}
      </button>

      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </section>
  );
}

interface AccountSectionProps {
  /**
   * Controlled profile state. When provided the component renders this value
   * and reports edits through `onProfileChange`. When omitted the section
   * loads and owns its own state, including the loading and error states.
   */
  profile?: ProfileData;
  onProfileChange?: (next: ProfileData) => void;
  /**
   * Called with the final saved profile once a save succeeds, so a parent
   * tracking a dirty/unsaved-changes flag can clear it. Not called on
   * validation failure or a failed save.
   */
  onSaved?: (saved: ProfileData) => void;
  /** When set, scrolls to and highlights the matching control. */
  highlightedSearchLabel?: string | null;
  /**
   * Whether `profile` holds real API data or seeded placeholder data. Parents
   * that seed from {@link DEFAULT_PROFILE} must pass `"placeholder"` so the
   * section can label the data instead of presenting it as the user's own.
   */
  profileSource?: ProfileSource;
}

/**
 * Standalone variant: owns its own data.
 *
 * Split into its own component (rather than branching inside a single one)
 * so {@link useProfile} is only ever mounted when the section is actually
 * responsible for loading. A controlled section must not issue a request, and
 * conditionally calling a hook would break the rules of hooks.
 */
function StandaloneAccountSection({
  onProfileChange,
  onSaved,
  highlightedSearchLabel,
}: Omit<AccountSectionProps, "profile" | "profileSource">) {
  const load = useProfile();
  const [status, setStatus] = useState<StatusState>({ message: "", type: null });
  const [isSaving, setIsSaving] = useState(false);

  return (
    <AccountSectionView
      // While loading or erroring there is nothing to render yet; the view
      // returns the skeleton / error panel before touching these values.
      profile={load.profile ?? DEFAULT_PROFILE}
      onProfileChange={onProfileChange}
      onSaved={onSaved}
      highlightedSearchLabel={highlightedSearchLabel}
      profileSource={load.source ?? "placeholder"}
      status={status}
      setStatus={setStatus}
      isSaving={isSaving}
      setIsSaving={setIsSaving}
      loadError={load.error}
      retryLoad={load.retry}
      isLoading={load.status === "loading"}
    />
  );
}

/** Controlled variant: the parent owns the data and the load lifecycle. */
function ControlledAccountSection({
  profile,
  onProfileChange,
  onSaved,
  highlightedSearchLabel,
  profileSource,
}: Omit<AccountSectionProps, "profile"> & { profile: ProfileData }) {
  const [status, setStatus] = useState<StatusState>({ message: "", type: null });
  const [isSaving, setIsSaving] = useState(false);

  return (
    <AccountSectionView
      profile={profile}
      onProfileChange={onProfileChange}
      onSaved={onSaved}
      highlightedSearchLabel={highlightedSearchLabel}
      profileSource={profileSource ?? "api"}
      status={status}
      setStatus={setStatus}
      isSaving={isSaving}
      setIsSaving={setIsSaving}
      loadError={null}
      isLoading={false}
    />
  );
}

/**
 * AccountSection component.
 * Renders user profile information, identity details, and regional settings.
 *
 * In controlled mode the parent owns the data; in standalone mode the section
 * loads the profile itself through {@link useProfile} and renders the loading,
 * error, empty, and placeholder states.
 */
export default function AccountSection(props: AccountSectionProps = {}) {
  return props.profile === undefined ? (
    <StandaloneAccountSection
      onProfileChange={props.onProfileChange}
      onSaved={props.onSaved}
      highlightedSearchLabel={props.highlightedSearchLabel}
    />
  ) : (
    <ControlledAccountSection
      profile={props.profile}
      onProfileChange={props.onProfileChange}
      onSaved={props.onSaved}
      highlightedSearchLabel={props.highlightedSearchLabel}
      profileSource={props.profileSource}
    />
  );
}
