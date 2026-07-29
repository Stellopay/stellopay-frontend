"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_PROFILE } from "@/lib/demo-data";
import { isValidEmail } from "@/utils/authUtils";
import { formatDateTimeWithTimezone } from "@/utils/date-utils";
import { formatCurrencyWithCode } from "@/utils/formatUtils";

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

/** Fixed reference date used for the timezone preview so the output is stable across renders. */
const SAMPLE_DATE = new Date("2026-07-29T14:30:00Z");

/** Fixed reference amount used for the currency preview. */
const SAMPLE_AMOUNT = 1250.5;

export const AVATAR_CROP_OUTPUT_SIZE = 512;
export const AVATAR_ZOOM_MIN = 1;
export const AVATAR_ZOOM_MAX = 3;
export const AVATAR_ZOOM_STEP = 0.1;
export const AVATAR_PAN_LIMIT = 80;
export const AVATAR_PAN_KEYBOARD_STEP = 8;

interface AvatarCropTransform {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

const DEFAULT_AVATAR_CROP: AvatarCropTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
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

export function clampAvatarCropValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
}

export default function AccountSection({
  profile: controlledProfile,
  onProfileChange,
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
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState("/Image.png");
  const [avatarDraftSrc, setAvatarDraftSrc] = useState<string | null>(null);
  const [avatarDraftName, setAvatarDraftName] = useState("");
  const [avatarCrop, setAvatarCrop] =
    useState<AvatarCropTransform>(DEFAULT_AVATAR_CROP);
  const [avatarError, setAvatarError] = useState("");
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarDragStartRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Trim before validating so incidental whitespace can neither defeat
  // isValidEmail() nor end up persisted in a form the user never typed.
  const normalizedEmail = profile.email.trim();
  const isEmailValid = isValidEmail(normalizedEmail);
  const showEmailError = isEmailTouched && !isEmailValid;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current);
      }
      if (avatarDraftSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarDraftSrc);
      }
    };
  }, [avatarDraftSrc]);

  const clearQueuedStatusReset = () => {
    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  };

  const queueStatusReset = () => {
    clearQueuedStatusReset();
    statusTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        setStatus({ message: "", type: null });
      }
      statusTimeoutRef.current = null;
    }, 5000);
  };

  const updateProfileField = (field: keyof ProfileState, value: string) => {
    const next: ProfileState = { ...profile, [field]: value };
    if (onProfileChange) {
      onProfileChange(next);
    } else {
      setInternalProfile(next);
    }
  };

  const updateAvatarCrop = (next: Partial<AvatarCropTransform>) => {
    setAvatarCrop((current) => ({
      zoom: clampAvatarCropValue(
        next.zoom ?? current.zoom,
        AVATAR_ZOOM_MIN,
        AVATAR_ZOOM_MAX,
      ),
      panX: clampAvatarCropValue(
        next.panX ?? current.panX,
        -AVATAR_PAN_LIMIT,
        AVATAR_PAN_LIMIT,
      ),
      panY: clampAvatarCropValue(
        next.panY ?? current.panY,
        -AVATAR_PAN_LIMIT,
        AVATAR_PAN_LIMIT,
      ),
      rotation: next.rotation ?? current.rotation,
    }));
  };

  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose an image file to continue.");
      setAvatarDraftSrc(null);
      setAvatarDraftName("");
      return;
    }

    if (avatarDraftSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarDraftSrc);
    }

    setAvatarDraftSrc(URL.createObjectURL(file));
    setAvatarDraftName(file.name);
    setAvatarCrop(DEFAULT_AVATAR_CROP);
    setAvatarError("");
  };

  const handleAvatarDialogChange = (open: boolean) => {
    setAvatarDialogOpen(open);
    if (!open) {
      setIsDraggingAvatar(false);
      avatarDragStartRef.current = null;
    }
  };

  const rotateAvatar = (direction: "left" | "right") => {
    updateAvatarCrop({
      rotation:
        (avatarCrop.rotation + (direction === "right" ? 90 : -90) + 360) % 360,
    });
  };

  const panAvatar = (deltaX: number, deltaY: number) => {
    updateAvatarCrop({
      panX: avatarCrop.panX + deltaX,
      panY: avatarCrop.panY + deltaY,
    });
  };

  const handleAvatarCropKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const step = event.shiftKey
      ? AVATAR_PAN_KEYBOARD_STEP * 2
      : AVATAR_PAN_KEYBOARD_STEP;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      panAvatar(-step, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      panAvatar(step, 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      panAvatar(0, -step);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      panAvatar(0, step);
    }
  };

  const handleAvatarPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!avatarDraftSrc) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    avatarDragStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      panX: avatarCrop.panX,
      panY: avatarCrop.panY,
    };
    setIsDraggingAvatar(true);
  };

  const handleAvatarPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const start = avatarDragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) {
      return;
    }

    updateAvatarCrop({
      panX: start.panX + event.clientX - start.clientX,
      panY: start.panY + event.clientY - start.clientY,
    });
  };

  const handleAvatarPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (avatarDragStartRef.current?.pointerId === event.pointerId) {
      avatarDragStartRef.current = null;
      setIsDraggingAvatar(false);
    }
  };

  const handleSaveAvatarCrop = () => {
    if (!avatarDraftSrc) {
      setAvatarError("Upload an image before saving the crop.");
      return;
    }

    setAvatarPreviewSrc(avatarDraftSrc);
    setAvatarDialogOpen(false);
    setStatus({
      message: `Profile photo crop saved at ${AVATAR_CROP_OUTPUT_SIZE} x ${AVATAR_CROP_OUTPUT_SIZE}.`,
      type: "success",
    });
    queueStatusReset();
  };

  /**
   * Validates the email on blur and normalizes the field by trimming
   * leading/trailing whitespace, so the displayed value always matches
   * what {@link isValidEmail} checked and what save would persist.
   */
  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    const trimmed = profile.email.trim();
    if (trimmed !== profile.email) {
      updateProfileField("email", trimmed);
    }
  };

  /**
   * Re-validates the email with the shared isValidEmail() helper before
   * saving. Blocks the save and surfaces an inline status error for
   * malformed emails instead of persisting them.
   */
  const handleSave = async () => {
    setIsEmailTouched(true);

    if (!isEmailValid) {
      setStatus({
        message: "Enter a valid email address before saving.",
        type: "error",
      });
      return;
    }

    if (normalizedEmail !== profile.email) {
      updateProfileField("email", normalizedEmail);
    }

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-[88px] w-[88px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-white/5">
                  {avatarPreviewSrc === "/Image.png" ? (
                    <Image
                      src="/Image.png"
                      alt="Profile photo"
                      width={88}
                      height={88}
                      className="h-full w-full object-cover"
                      priority
                    />
                  ) : (
                    // Uploaded object URLs are runtime-only browser assets, so
                    // they render through a native image element.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreviewSrc}
                      alt="Profile photo"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#09090B]" />
              </div>
              <div className="space-y-1">
                <CardTitle className="font-general text-2xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
                  Account identity
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
                    Demo Data
                  </span>
                </CardTitle>
                <CardDescription className="max-w-lg text-zinc-600 dark:text-zinc-400">
                  High-frequency profile fields are visible immediately, while
                  longer-tail metadata stays tucked into disclosure below.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <Camera className="size-4" />
              Change photo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="first-name"
              label="First name"
              value={profile.firstName}
              onChange={(value) => updateProfileField("firstName", value)}
              disabled={isSaving}
            />
            <Field
              id="last-name"
              label="Last name"
              value={profile.lastName}
              onChange={(value) => updateProfileField("lastName", value)}
              disabled={isSaving}
            />
            <Field
              id="display-name"
              label="Display name"
              value={profile.displayName}
              onChange={(value) => updateProfileField("displayName", value)}
              disabled={isSaving}
            />
            <Field
              id="email-address"
              label="Email address"
              type="email"
              value={profile.email}
              onChange={(value) => updateProfileField("email", value)}
              onBlur={handleEmailBlur}
              disabled={isSaving}
              error={showEmailError}
              errorMessage="Enter a valid email address, e.g. name@example.com."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              id="timezone"
              label="Timezone"
              value={profile.timezone}
              options={["Africa/Lagos", "Europe/London", "UTC"]}
              onChange={(value) => updateProfileField("timezone", value)}
              disabled={isSaving}
            />
            <SelectField
              id="currency"
              label="Settlement currency"
              value={profile.currency}
              options={["USD", "NGN", "EUR"]}
              onChange={(value) => updateProfileField("currency", value)}
              disabled={isSaving}
            />
          </div>

          {/* Live locale preview — updates on every field change */}
          <div
            role="region"
            aria-label="Locale format preview"
            aria-live="polite"
            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Preview
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-800 dark:text-zinc-200">
              <span className="inline-flex items-center gap-2">
                <CalendarPreviewIcon aria-hidden="true" />
                <span data-testid="locale-date-preview">
                  {formatDateTimeWithTimezone(SAMPLE_DATE, profile.timezone)}
                </span>
              </span>
              <span
                className="hidden h-4 w-px bg-zinc-300 dark:bg-white/20 sm:block"
                aria-hidden="true"
              />
              <span className="inline-flex items-center gap-2">
                <CurrencyPreviewIcon aria-hidden="true" />
                <span data-testid="locale-currency-preview">
                  {formatCurrencyWithCode(SAMPLE_AMOUNT, profile.currency)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Core account edits stay on one card so users do not bounce between
              routes.
            </p>
            <Button onClick={handleSave} disabled={isSaving || !isEmailValid}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save account changes"
              )}
            </Button>
          </div>

          {status.message && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 ${
                status.type === "success"
                  ? "border-success/20 bg-success/10"
                  : "border-destructive/20 bg-destructive/10"
              }`}
            >
              <p
                role="alert"
                className={`text-sm ${
                  status.type === "success"
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {status.message}
              </p>
            </div>
          )}

          <details className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show advanced identity and billing fields
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                id="legal-name"
                label="Legal entity"
                value={DEMO_PROFILE.legalEntity}
                onChange={() => undefined}
                disabled
              />
              <Field
                id="billing-country"
                label="Billing country"
                value={DEMO_PROFILE.billingCountry}
                onChange={() => undefined}
                disabled
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <Dialog open={avatarDialogOpen} onOpenChange={handleAvatarDialogChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white sm:max-w-2xl">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Crop profile photo</DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              Upload a photo, then zoom, pan, and rotate it inside the fixed
              square crop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="avatar-upload"
                className="text-sm font-medium text-zinc-900 dark:text-white"
              >
                Photo
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                error={Boolean(avatarError)}
                aria-describedby={
                  avatarError ? "avatar-upload-error" : "avatar-upload-help"
                }
                className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
              />
              <p
                id="avatar-upload-help"
                className="text-xs text-zinc-600 dark:text-zinc-400"
              >
                Output is saved as a fixed square crop at{" "}
                {AVATAR_CROP_OUTPUT_SIZE} x {AVATAR_CROP_OUTPUT_SIZE}.
              </p>
              {avatarError && (
                <p
                  id="avatar-upload-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {avatarError}
                </p>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <div
                  role="group"
                  aria-label="Avatar crop preview. Use arrow keys to pan the photo."
                  tabIndex={0}
                  onKeyDown={handleAvatarCropKeyDown}
                  onPointerDown={handleAvatarPointerDown}
                  onPointerMove={handleAvatarPointerMove}
                  onPointerUp={handleAvatarPointerEnd}
                  onPointerCancel={handleAvatarPointerEnd}
                  className={`relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#09090B] ${
                    isDraggingAvatar ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  data-testid="avatar-crop-preview"
                >
                  {avatarDraftSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarDraftSrc}
                      alt={`Crop preview for ${avatarDraftName}`}
                      draggable={false}
                      className="absolute left-1/2 top-1/2 h-full w-full select-none object-cover"
                      style={{
                        transform: `translate(calc(-50% + ${avatarCrop.panX}px), calc(-50% + ${avatarCrop.panY}px)) scale(${avatarCrop.zoom}) rotate(${avatarCrop.rotation}deg)`,
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Upload a photo to begin cropping.
                    </div>
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/20"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Drag to pan, or focus the crop preview and use arrow keys.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="avatar-zoom"
                    className="text-sm font-medium text-zinc-900 dark:text-white"
                  >
                    Zoom
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Zoom out"
                      onClick={() =>
                        updateAvatarCrop({
                          zoom: avatarCrop.zoom - AVATAR_ZOOM_STEP,
                        })
                      }
                      disabled={!avatarDraftSrc}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      id="avatar-zoom"
                      type="range"
                      min={AVATAR_ZOOM_MIN}
                      max={AVATAR_ZOOM_MAX}
                      step={AVATAR_ZOOM_STEP}
                      value={avatarCrop.zoom}
                      onChange={(event) =>
                        updateAvatarCrop({
                          zoom: Number(event.target.value),
                        })
                      }
                      disabled={!avatarDraftSrc}
                      aria-valuemin={AVATAR_ZOOM_MIN}
                      aria-valuemax={AVATAR_ZOOM_MAX}
                      aria-valuenow={avatarCrop.zoom}
                      aria-valuetext={`${Math.round(avatarCrop.zoom * 100)} percent`}
                      className="h-2 min-w-0 flex-1 cursor-pointer accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:accent-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Zoom in"
                      onClick={() =>
                        updateAvatarCrop({
                          zoom: avatarCrop.zoom + AVATAR_ZOOM_STEP,
                        })
                      }
                      disabled={!avatarDraftSrc}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Pan
                  </p>
                  <div
                    className="grid grid-cols-3 gap-2"
                    aria-label="Pan avatar"
                  >
                    <span />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Pan up"
                      onClick={() => panAvatar(0, -AVATAR_PAN_KEYBOARD_STEP)}
                      disabled={!avatarDraftSrc}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <span />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Pan left"
                      onClick={() => panAvatar(-AVATAR_PAN_KEYBOARD_STEP, 0)}
                      disabled={!avatarDraftSrc}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div
                      className="flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
                      aria-hidden="true"
                    >
                      Move
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Pan right"
                      onClick={() => panAvatar(AVATAR_PAN_KEYBOARD_STEP, 0)}
                      disabled={!avatarDraftSrc}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <span />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Pan down"
                      onClick={() => panAvatar(0, AVATAR_PAN_KEYBOARD_STEP)}
                      disabled={!avatarDraftSrc}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <span />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Rotate
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => rotateAvatar("left")}
                      disabled={!avatarDraftSrc}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Rotate left
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => rotateAvatar("right")}
                      disabled={!avatarDraftSrc}
                    >
                      <RotateCw className="h-4 w-4" />
                      Rotate right
                    </Button>
                  </div>
                </div>

                <dl
                  className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
                  aria-label="Current crop values"
                >
                  <div>
                    <dt className="font-medium text-zinc-900 dark:text-white">
                      Zoom
                    </dt>
                    <dd>{Math.round(avatarCrop.zoom * 100)}%</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900 dark:text-white">
                      Rotate
                    </dt>
                    <dd>{avatarCrop.rotation} deg</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900 dark:text-white">
                      Pan X
                    </dt>
                    <dd>{avatarCrop.panX}px</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-900 dark:text-white">
                      Pan Y
                    </dt>
                    <dd>{avatarCrop.panY}px</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAvatarDialogChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAvatarCrop}
              disabled={!avatarDraftSrc}
            >
              Save cropped photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
              Section map
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Frequent tasks are grouped into four clear sections to stay within
              the click-depth target.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {sectionMap.map((section) => (
              <div
                key={section.label}
                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {section.label}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {section.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-400"
                >
                  {section.badge}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-white/90 shadow-sm dark:bg-white/5">
          <CardHeader className="border-b border-red-500/10">
            <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
              Danger zone
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Destructive actions are isolated from normal profile tasks and
              require explicit typed confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-zinc-600 dark:text-zinc-400">
              Deactivation is intentionally separated from editable profile
              fields to reduce accidental account loss.
            </div>
            <DestructiveActionDialog
              triggerLabel="Deactivate account"
              title="Deactivate this account"
              description="This pauses sign-in and stops access to settings until recovery or support review."
              impactItems={[
                "Wallet operations and new transfers would be blocked.",
                "Team members would lose access until the account is restored.",
                "Support review may be required before reactivation.",
              ]}
              confirmationToken="DEACTIVATE"
              confirmationLabel='Type "DEACTIVATE" to confirm'
              confirmLabel="Confirm deactivation"
              onConfirm={() =>
                setStatus({
                  message:
                    "Deactivation request captured. Keep this action gated until backend approval exists.",
                  type: "success",
                })
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  disabled = false,
  error = false,
  errorMessage,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
}) {
  const fieldId = id;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        id={`${fieldId}-label`}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </Label>
      <Input
        id={fieldId}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        error={error}
        errorId={errorId}
        className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
        labelId={`${fieldId}-label`}
        descriptionId={descriptionId}
      />
      {error && errorMessage && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = id;
  const descriptionId = `${fieldId}-description`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className="text-sm font-medium text-zinc-900 dark:text-white"
      >
        {label}
      </Label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white disabled:opacity-50"
        aria-describedby={descriptionId}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CalendarPreviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-zinc-400 dark:text-zinc-500"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CurrencyPreviewIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-zinc-400 dark:text-zinc-500"
      {...props}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
