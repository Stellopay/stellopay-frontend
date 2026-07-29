"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  EyeOff,
  KeyRound,
  Monitor,
  Plus,
  ShieldCheck,
  Smartphone,
  Loader2,
} from "lucide-react";
import ToggleCard from "@/components/common/toggle-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form } from "@/components/ui/form";
import { FormFieldPassword } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { changePasswordSchema, ChangePasswordFormValues } from "@/types/auth";
import {
  calculatePasswordStrength,
  checkPasswordRequirements,
} from "@/utils/authUtils";
import DestructiveActionDialog from "./destructive-action-dialog";
import { DEMO_SECURITY } from "@/lib/demo-data";
import { generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import QRCode from "qrcode";

const sessions = [
  {
    name: "Chrome on Windows",
    location: "Lagos, Nigeria",
    status: "Current session",
    icon: Monitor,
  },
  {
    name: "iPhone 15 Pro",
    location: "Mobile app",
    status: "Last active 2 hours ago",
    icon: Smartphone,
  },
];

const initialApiKeys = [
  {
    id: "api_key_live_mobile",
    name: "Mobile payouts service",
    createdAt: "Jul 12, 2026",
    lastUsedAt: "2 hours ago",
    prefix: "sk_live_mob_",
  },
  {
    id: "api_key_live_reporting",
    name: "Reporting sync",
    createdAt: "Jun 28, 2026",
    lastUsedAt: "Never used",
    prefix: "sk_live_rep_",
  },
];

interface StatusState {
  message: string;
  type: "success" | "error" | null;
}

interface ApiKeyRecord {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string;
  prefix: string;
}

interface RevealedApiSecret {
  keyId: string;
  keyName: string;
  value: string;
  action: "created" | "rotated";
}

type CopyStatus = "idle" | "success" | "error";

/** Default two-factor state, exported so a parent can own the same initial value. */
export const DEFAULT_TWO_FACTOR_ENABLED = true;

/**
 * The exact length a TOTP/authenticator-app verification code must be to pass
 * client-side validation in the two-factor setup panel.
 */
export const TWO_FACTOR_CODE_LENGTH = 6;

export function createApiKeySecret(name: string): string {
  const normalizedName =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 12) || "key";
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2).padEnd(24, "0");

  return `sk_live_${normalizedName}_${randomPart.slice(0, 24)}`;
}

/** How many single-use two-factor backup codes are issued per set. */
export const BACKUP_CODE_COUNT = 10;

/**
 * Generates a set of single-use two-factor backup (recovery) codes.
 *
 * Each code is derived from a cryptographically strong source when available
 * (`crypto.randomUUID`) and normalised to an unambiguous, human-transcribable
 * `XXXXX-XXXXX` shape. Uniqueness within the set is guaranteed by collecting
 * into a `Set` before returning, so no two codes in the same batch collide.
 *
 * @security The returned codes are secrets: they are shown to the user once and
 *   must never be logged, echoed into a `StatusState` message, or persisted
 *   anywhere the raw values could leak. Callers own clearing them from state
 *   once the user has saved them.
 *
 * @param count - How many codes to produce. Defaults to {@link BACKUP_CODE_COUNT}.
 * @returns An array of `count` distinct backup codes.
 */
export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    const raw =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2).padEnd(24, "0");
    // Uppercase alphanumerics only — drop any separators the source produced.
    const normalized = raw.replace(/[^a-z0-9]/gi, "").toUpperCase();

    if (normalized.length < 10) {
      continue;
    }

    codes.add(`${normalized.slice(0, 5)}-${normalized.slice(5, 10)}`);
  }

  return Array.from(codes);
}

/**
 * Renders a set of backup codes as the plain-text file the user downloads.
 *
 * Kept as a pure, exported helper (separate from the DOM download side effect)
 * so the exact on-disk contents can be asserted in tests without a real Blob.
 *
 * @security The header only contains guidance text — the caller is responsible
 *   for treating the produced string as a secret (it embeds the raw codes).
 */
export function formatBackupCodesFile(codes: string[]): string {
  const header = [
    "StelloPay two-factor backup codes",
    "",
    "Each code can be used once to sign in if you lose access to your",
    "authenticator app. Store them somewhere safe and private — anyone with",
    "these codes can bypass two-factor authentication.",
    "",
  ];
  const body = codes.map((code, index) => `${index + 1}. ${code}`);

  return [...header, ...body, ""].join("\n");
}

interface SecurityTabProps {
  /**
   * Controlled two-factor state. When provided the component renders this value
   * and reports changes through `onTwoFactorEnabledChange`. When omitted the
   * section manages its own internal state (standalone use).
   */
  twoFactorEnabled?: boolean;
  onTwoFactorEnabledChange?: (next: boolean) => void;
  /** When set, scrolls to and highlights the matching control. */
  highlightedSearchLabel?: string | null;
}

/**
 * Client-side validation for a 2FA/authenticator verification code.
 *
 * Rejects anything that isn't exactly {@link TWO_FACTOR_CODE_LENGTH} ASCII
 * digits — whitespace, letters, separators (e.g. `-`), partial lengths, and
 * over-length values all produce a distinct, user-actionable message so a
 * silent failure can never occur before the network is hit.
 *
 * @security The raw value is never logged; it is only inspected in-memory and
 *   the returned string intentionally contains only user-facing guidance text
 *   (never a substring of the typed code).
 *
 * @param value - The raw typed value (never trimmed — a leading/trailing space
 *   is considered an explicit mismatch the user must fix).
 * @returns An inline error string when the value is invalid, or `null` when
 *   the value is acceptable: empty ("user hasn't typed yet") → null; valid
 *   6-digit numeric code → null.
 */
export function getVerificationCodeError(value: string): string | null {
  if (value.length === 0) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    return `Code can only contain digits. Type the ${TWO_FACTOR_CODE_LENGTH}-digit code from your app.`;
  }

  if (value.length < TWO_FACTOR_CODE_LENGTH) {
    const missing = TWO_FACTOR_CODE_LENGTH - value.length;
    return `Code is ${missing} digit${missing === 1 ? "" : "s"} too short.`;
  }

  if (value.length > TWO_FACTOR_CODE_LENGTH) {
    const extra = value.length - TWO_FACTOR_CODE_LENGTH;
    return `Code is ${extra} digit${extra === 1 ? "" : "s"} too long.`;
  }

  return null;
}

/**
 * SecurityTab — password change, two-factor verification setup, and active sessions.
 *
 * ## Two-factor setup flow (verification code validation)
 *
 * When the user toggles the "Authenticator app verification" switch **on** and
 * 2FA is not yet enabled, the component refuses to flip the toggle directly.
 * Instead, it opens a gated setup panel where the user must type a 6-digit
 * numeric TOTP code. Validation layers:
 *
 * 1. **Client-side, on every keystroke** — {@link getVerificationCodeError}
 *    rejects non-digits, partial codes, and over-length codes immediately with
 *    a distinct inline error. `aria-invalid` and `aria-describedby` are wired
 *    to the input so the error is announced.
 * 2. **Submit gate** — the "Verify and enable" button is disabled until the
 *    typed value is a valid 6-digit numeric code AND the async submit is not
 *    in flight.
 * 3. **Second client-side check at submit time** — `handleVerifyTwoFactor`
 *    re-runs `getVerificationCodeError` just before the simulated fetch, so
 *    calling the handler programmatically (or a stale React state) can never
 *    bypass validation.
 *
 * Security behaviour for the verification code:
 * - Input is **cleared immediately** after a failed submit so a code cannot be
 *   re-submitted accidentally or left on-screen.
 * - Input is also cleared after a successful submit (together with the form
 *   state being reset).
 * - The code is never passed to `console.log`, errors, or any `StatusState`
 *   message; only the validation *pattern* is surfaced.
 *
 * @see {@link getVerificationCodeError} for the inline validation rules.
 */
export default function SecurityTab({
  twoFactorEnabled: controlledTwoFactor,
  onTwoFactorEnabledChange,
  highlightedSearchLabel,
}: SecurityTabProps = {}) {
  useSearchHighlight(highlightedSearchLabel ?? null);
  const [internalTwoFactor, setInternalTwoFactor] = useState(
    controlledTwoFactor ?? DEFAULT_TWO_FACTOR_ENABLED,
  );
  const twoFactorEnabled = internalTwoFactor;
  const setTwoFactorEnabled = (next: boolean) => {
    setInternalTwoFactor(next);
    onTwoFactorEnabledChange?.(next);
  };
  const [loginApprovalEnabled, setLoginApprovalEnabled] = useState(true);
  const [transferApprovalEnabled, setTransferApprovalEnabled] = useState(true);
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(initialApiKeys);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyNameError, setApiKeyNameError] = useState("");
  const [apiKeyActionId, setApiKeyActionId] = useState<string | null>(null);
  const [revealedApiSecret, setRevealedApiSecret] =
    useState<RevealedApiSecret | null>(null);
  const [apiSecretCopyStatus, setApiSecretCopyStatus] =
    useState<CopyStatus>("idle");

  // --- Two-factor setup panel state ---------------------------------------
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSetupInlineError, setTwoFactorSetupInlineError] = useState<
    string | null
  >(null);
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const totpSecretRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isTwoFactorSetupOpen) return;
    let cancelled = false;
    (async () => {
      const { base32, otpauthUrl } = generateTotpSecret(
        "Stellopay",
        "user@stellopay.com",
      );
      if (cancelled) return;
      setTotpSecret(base32);
      totpSecretRef.current = base32;
      try {
        const url = await QRCode.toDataURL(otpauthUrl, {
          width: 200,
          margin: 2,
        });
        if (!cancelled) setQrCodeDataUrl(url);
      } catch {
        // QR generation failure is non-critical
      }
    })();
    return () => { cancelled = true; };
  }, [isTwoFactorSetupOpen]);

  // --- Two-factor backup (recovery) codes ---------------------------------
  // `backupCodes` holds the current, one-time-visible set. `null` means no set
  // has been generated (or the user dismissed the last one). These are secrets:
  // never log them or place them in a StatusState message.
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [backupCodesCopyStatus, setBackupCodesCopyStatus] =
    useState<CopyStatus>("idle");
  const [backupCodesGenerating, setBackupCodesGenerating] = useState(false);

  useEffect(() => {
    if (controlledTwoFactor !== undefined) {
      setInternalTwoFactor(controlledTwoFactor);
    }
  }, [controlledTwoFactor]);

  const twoFactorCodeError = useMemo(
    () => getVerificationCodeError(twoFactorCode),
    [twoFactorCode],
  );

  /**
   * Whether the typed verification code is valid for submit:
   * - Exactly {@link TWO_FACTOR_CODE_LENGTH} digits
   * - No inline validation error
   * - Async submit not in flight
   *
   * This is the single source of truth for the submit button's `disabled`
   * prop so the form cannot accidentally be submitted with a partial or
   * malformed code.
   */
  const twoFactorCanVerify =
    !twoFactorSubmitting &&
    twoFactorCode.length === TWO_FACTOR_CODE_LENGTH &&
    twoFactorCodeError === null;

  const closeTwoFactorSetup = () => {
    setIsTwoFactorSetupOpen(false);
    setTwoFactorCode("");
    setTwoFactorSetupInlineError(null);
    setTotpSecret(null);
    setQrCodeDataUrl(null);
    totpSecretRef.current = null;
  };

  /**
   * Called when the "Authenticator app verification" ToggleCard is clicked.
   *
   * - If the user is turning 2FA **off** → allow it directly (no code needed;
   *   destructive action flow would be a separate concern, out of scope here).
   * - If the user is turning 2FA **on** → open the gated verification panel
   *   so a code must be typed before the state flips.
   */
  const handleTwoFactorToggleRequest = (nextRequested: boolean) => {
    if (!nextRequested) {
      setTwoFactorEnabled(false);
      closeTwoFactorSetup();
      setBackupCodes(null);
      setBackupCodesCopyStatus("idle");
      return;
    }
    setIsTwoFactorSetupOpen(true);
    setTwoFactorCode("");
    setTwoFactorSetupInlineError(null);
  };

  /**
   * Validates + submits the 2FA verification code.
   *
   * @security Re-checks {@link getVerificationCodeError} synchronously before
   *   any awaits so a stale prop/programmatic call cannot skip validation.
   *   After a failed submit the code input is cleared so the value never
   *   lingers in the DOM. After success the code is also cleared + the panel
   *   is closed and the 2FA toggle is flipped on.
   */
  const handleVerifyTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();

    const syncError = getVerificationCodeError(twoFactorCode);
    if (syncError) {
      setTwoFactorSetupInlineError(syncError);
      return;
    }

    setTwoFactorSetupInlineError(null);
    setTwoFactorSubmitting(true);
    try {
      const secret = totpSecretRef.current;
      if (!secret) {
        throw new Error("TOTP secret not generated");
      }

      // Simulate a brief network delay to match the real async flow
      await new Promise((resolve) => setTimeout(resolve, 600));

      const isValid = verifyTotpCode(secret, twoFactorCode);
      if (!isValid) {
        throw new Error("Invalid code");
      }

      setTwoFactorEnabled(true);
      closeTwoFactorSetup();
      // Issue a fresh set of one-time recovery codes so the user has a way back
      // in if they lose their authenticator. Shown once, in the panel below.
      setBackupCodes(generateBackupCodes());
      setBackupCodesCopyStatus("idle");
      setStatus({
        message:
          "Authenticator app verified. Two-factor is now enabled for this account.",
        type: "success",
      });
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    } catch {
      // Security: clear the failed code immediately so the user must re-type.
      setTwoFactorCode("");
      setTwoFactorSetupInlineError(
        "That code didn't work. Check your authenticator app and try again.",
      );
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchedPassword = form.watch("newPassword");
  const watchedConfirm = form.watch("confirmPassword");
  const passwordRequirements = checkPasswordRequirements(watchedPassword);
  const passwordStrengthResult = useMemo(
    () => calculatePasswordStrength(watchedPassword),
    [watchedPassword],
  );
  const passwordsMatch =
    watchedPassword.length > 0 && watchedPassword === watchedConfirm;

  const canSubmit =
    form.formState.isValid &&
    watchedPassword.length > 0 &&
    watchedConfirm.length > 0;

  const canCreateApiKey = apiKeyName.trim().length >= 3 && !apiKeyActionId;

  const queueApiKeyAction = async (actionId: string, action: () => void) => {
    setApiKeyActionId(actionId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      action();
    } finally {
      setApiKeyActionId(null);
    }
  };

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = apiKeyName.trim();
    if (trimmedName.length < 3) {
      setApiKeyNameError("Name must be at least 3 characters.");
      return;
    }

    await queueApiKeyAction("create", () => {
      const secret = createApiKeySecret(trimmedName);
      const key: ApiKeyRecord = {
        id: `api_key_${Date.now()}`,
        name: trimmedName,
        createdAt: "Just now",
        lastUsedAt: "Never used",
        prefix: secret.slice(0, 12),
      };

      setApiKeys((current) => [key, ...current]);
      setApiKeyName("");
      setApiKeyNameError("");
      setApiSecretCopyStatus("idle");
      setRevealedApiSecret({
        keyId: key.id,
        keyName: key.name,
        value: secret,
        action: "created",
      });
    });
  };

  const handleRotateApiKey = (key: ApiKeyRecord) => {
    void queueApiKeyAction(`rotate-${key.id}`, () => {
      const secret = createApiKeySecret(key.name);

      setApiKeys((current) =>
        current.map((item) =>
          item.id === key.id
            ? {
                ...item,
                createdAt: "Just now",
                lastUsedAt: "Never used",
                prefix: secret.slice(0, 12),
              }
            : item,
        ),
      );
      setApiSecretCopyStatus("idle");
      setRevealedApiSecret({
        keyId: key.id,
        keyName: key.name,
        value: secret,
        action: "rotated",
      });
    });
  };

  const handleRevokeApiKey = (key: ApiKeyRecord) => {
    void queueApiKeyAction(`revoke-${key.id}`, () => {
      setApiKeys((current) => current.filter((item) => item.id !== key.id));
      if (revealedApiSecret?.keyId === key.id) {
        setRevealedApiSecret(null);
        setApiSecretCopyStatus("idle");
      }
    });
  };

  const handleCopyApiSecret = () => {
    if (!revealedApiSecret) {
      return;
    }

    copyToClipboardWithFeedback(
      revealedApiSecret.value,
      () => {
        setApiSecretCopyStatus("success");
        setTimeout(() => setApiSecretCopyStatus("idle"), 2000);
      },
      () => {
        setApiSecretCopyStatus("error");
        setTimeout(() => setApiSecretCopyStatus("idle"), 3000);
      },
    );
  };

  /**
   * Copies the whole backup-code set to the clipboard, one code per line, and
   * toggles transient feedback. The codes are only ever passed to the clipboard
   * util — never logged or placed in a status message.
   */
  const handleCopyBackupCodes = () => {
    if (!backupCodes) {
      return;
    }

    copyToClipboardWithFeedback(
      backupCodes.join("\n"),
      () => {
        setBackupCodesCopyStatus("success");
        setTimeout(() => setBackupCodesCopyStatus("idle"), 2000);
      },
      () => {
        setBackupCodesCopyStatus("error");
        setTimeout(() => setBackupCodesCopyStatus("idle"), 3000);
      },
    );
  };

  /**
   * Downloads the current backup-code set as a plain-text file. The file body
   * is built by the pure {@link formatBackupCodesFile} helper (unit-tested
   * separately); this function only owns the Blob + anchor DOM side effect and
   * guards the browser-only APIs so it is a no-op during SSR.
   */
  const handleDownloadBackupCodes = () => {
    if (!backupCodes) {
      return;
    }
    if (typeof document === "undefined" || typeof URL === "undefined") {
      return;
    }

    const blob = new Blob([formatBackupCodesFile(backupCodes)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stellopay-backup-codes.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  /**
   * Dismisses the show-once panel. The codes leave React state entirely — the
   * user has confirmed they saved them, and they can regenerate a set later.
   */
  const handleDismissBackupCodes = () => {
    setBackupCodes(null);
    setBackupCodesCopyStatus("idle");
  };

  /**
   * Regenerates the backup-code set from behind the destructive-action dialog.
   * Any previously issued codes are invalidated (replaced), so this reuses the
   * same show-once panel with a fresh set.
   */
  const handleRegenerateBackupCodes = async () => {
    setBackupCodesGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setBackupCodes(generateBackupCodes());
      setBackupCodesCopyStatus("idle");
      setStatus({
        message:
          "New backup codes generated. Your previous codes no longer work.",
        type: "success",
      });
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    } finally {
      setBackupCodesGenerating(false);
    }
  };

  /**
   * Invoked by `form.handleSubmit` after zod passes all validations.
   *
   * `_data` is typed as `ChangePasswordFormValues` but intentionally unused —
   * no password value is read, stored, or logged anywhere in this function.
   */
  const handleSaveChanges = async (_data: ChangePasswordFormValues) => {
    setIsSaving(true);
    setStatus({ message: "", type: null });
    try {
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error("Failed to save"));
          } else {
            resolve();
          }
        }, 1500),
      );
      setStatus({
        message:
          "Password policy satisfied. Changes are ready for backend wiring.",
        type: "success",
      });
      form.reset();
    } catch {
      setStatus({
        message: "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus({ message: "", type: null }), 5000);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card
        data-search-label="Password and recovery"
        className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <KeyRound className="size-5" />
            </span>
            <div className="space-y-1">
              <CardTitle className="font-general text-xl text-zinc-950 dark:text-white flex flex-wrap items-center gap-2">
                Password and recovery
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-500 dark:ring-amber-400/20">
                  Demo Data
                </span>
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                Keep password work scoped to one card and show validation before
                save.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSaveChanges)}
              noValidate
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldPassword
                  control={form.control}
                  name="newPassword"
                  label="New password"
                  placeholder="Use a strong password"
                  autoComplete="new-password"
                  disabled={isSaving}
                />
                <div className="space-y-4">
                  <FormFieldPassword
                    control={form.control}
                    name="confirmPassword"
                    label="Confirm password"
                    placeholder="Repeat the new password"
                    autoComplete="new-password"
                    disabled={isSaving}
                  />
                  {watchedPassword.length > 0 && (
                    <PasswordStrengthIndicator
                      strengthResult={passwordStrengthResult}
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <RequirementItem
                  label="At least 8 characters"
                  met={passwordRequirements.minLength}
                />
                <RequirementItem
                  label="One uppercase letter"
                  met={passwordRequirements.uppercase}
                />
                <RequirementItem
                  label="One special character"
                  met={passwordRequirements.specialChar}
                />
                <RequirementItem label="Passwords match" met={passwordsMatch} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Recovery methods stay hidden until needed to keep the primary
                  path calm.
                </p>
                <Button type="submit" disabled={!canSubmit || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update password"
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
            </form>
          </Form>

          <details className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-900 dark:text-white">
              Show recovery methods
            </summary>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Primary email: {DEMO_SECURITY.primaryEmail}</p>
              <p>Recovery codes: {DEMO_SECURITY.recoveryCodesStatus}</p>
              <p>Backup contact: {DEMO_SECURITY.backupContact}</p>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                <ShieldCheck className="size-5" />
              </span>
              <div className="space-y-1">
                <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                  Verification controls
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Security-sensitive toggles stay grouped with supporting
                  guidance.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <ToggleCard
              title="Authenticator app verification"
              description="Require a second factor for password resets and critical profile changes."
              badge="Recommended"
              enabled={twoFactorEnabled}
              onToggle={handleTwoFactorToggleRequest}
            />

            {isTwoFactorSetupOpen && (
              <form
                onSubmit={handleVerifyTwoFactor}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4"
                aria-label="Authenticator verification setup"
              >
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    {qrCodeDataUrl && (
                      <div className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="TOTP QR code — scan with your authenticator app"
                          width={140}
                          height={140}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        Scan with your authenticator app
                      </p>
                      <p>
                        Use an authenticator app like Google Authenticator or
                        Authy to scan the QR code. If you cannot scan the code,
                        copy the key below.
                      </p>
                      {totpSecret && (
                        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                          <code className="select-all font-mono text-xs tracking-wider break-all">
                            {totpSecret}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboardWithFeedback(
                                totpSecret,
                                "Secret key copied",
                              )
                            }
                            className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            aria-label="Copy secret key"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 dark:border-zinc-700" />

                  <p className="flex gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
                    Enter the code displayed in your authenticator app to finish
                    enabling 2FA.
                  </p>

                  <div className="space-y-2">
                    <label
                      htmlFor="two-factor-verification-code"
                      className="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      {`${TWO_FACTOR_CODE_LENGTH}-digit verification code`}
                    </label>
                    <p
                      id="two-factor-code-instruction"
                      className="text-xs text-zinc-600 dark:text-zinc-400"
                    >
                      Type the code exactly as shown — no spaces or letters.
                    </p>
                    <Input
                      id="two-factor-verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={`${"0".repeat(TWO_FACTOR_CODE_LENGTH)}`}
                      value={twoFactorCode}
                      onChange={(event) => {
                        setTwoFactorCode(event.target.value);
                        if (twoFactorSetupInlineError) {
                          setTwoFactorSetupInlineError(null);
                        }
                      }}
                      maxLength={TWO_FACTOR_CODE_LENGTH + 4}
                      disabled={twoFactorSubmitting}
                      error={Boolean(
                        twoFactorCodeError ?? twoFactorSetupInlineError,
                      )}
                      aria-required
                      aria-describedby={
                        twoFactorCodeError || twoFactorSetupInlineError
                          ? "two-factor-code-error"
                          : "two-factor-code-instruction"
                      }
                      className="tracking-[0.35em] font-mono text-base text-center"
                    />
                    {(twoFactorCodeError ?? twoFactorSetupInlineError) && (
                      <p
                        id="two-factor-code-error"
                        role="alert"
                        aria-live="polite"
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {twoFactorCodeError ?? twoFactorSetupInlineError}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeTwoFactorSetup}
                      disabled={twoFactorSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!twoFactorCanVerify}
                      className="gap-2"
                    >
                      {twoFactorSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Verify and enable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {backupCodes && (
              <div
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                role="region"
                aria-label="Two-factor backup codes"
              >
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Backup codes
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Each code can be used once to sign in if you lose access to
                    your authenticator app.
                  </p>
                  <div
                    className="grid gap-1.5 sm:grid-cols-2"
                    role="list"
                    aria-label="Your backup codes"
                  >
                    {backupCodes.map((code) => (
                      <div
                        key={code}
                        role="listitem"
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm tracking-wider text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBackupCodes}
                      aria-label="Copy all backup codes to clipboard"
                    >
                      {backupCodesCopyStatus === "success" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Copied
                        </>
                      ) : backupCodesCopyStatus === "error" ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Failed
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy all
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadBackupCodes}
                      aria-label="Download backup codes as text file"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDismissBackupCodes}
                      disabled={backupCodesGenerating}
                    >
                      <EyeOff className="h-4 w-4" />
                      I&apos;ve saved these codes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <ToggleCard
              title="New device approval"
              description="Challenge sign-ins from browsers or devices you have not approved yet."
              enabled={loginApprovalEnabled}
              onToggle={setLoginApprovalEnabled}
              searchLabel="New device approval"
            />
            <ToggleCard
              title="Large transfer approval"
              description="Hold transfers over your threshold for a second confirmation."
              enabled={transferApprovalEnabled}
              onToggle={setTransferApprovalEnabled}
              searchLabel="Large transfer approval"
            />

            {twoFactorEnabled && !backupCodes && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      Backup codes
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Generate backup codes to recover access if you lose your
                      authenticator device.
                    </p>
                  </div>
                  {backupCodesGenerating ? (
                    <Button disabled variant="outline" size="sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </Button>
                  ) : (
                    <DestructiveActionDialog
                      triggerLabel="Regenerate"
                      title="Regenerate backup codes"
                      description="This will invalidate all previously generated backup codes."
                      impactItems={[
                        "Any previously saved backup codes will stop working immediately.",
                        "New codes are shown once after regeneration and must be saved.",
                        "This action cannot be undone.",
                      ]}
                      confirmationToken="REGENERATE"
                      confirmationLabel='Type "REGENERATE" to continue'
                      confirmLabel="Regenerate codes"
                      onConfirm={handleRegenerateBackupCodes}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                  API keys
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Create and manage keys for programmatic account access.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
              >
                {apiKeys.length} active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <form
              onSubmit={handleCreateApiKey}
              className="space-y-3"
              aria-label="Create API key"
            >
              <div className="space-y-2">
                <label
                  htmlFor="api-key-name"
                  className="text-sm font-medium text-zinc-900 dark:text-white"
                >
                  Key name
                </label>
                <p
                  id="api-key-name-instruction"
                  className="text-xs text-zinc-600 dark:text-zinc-400"
                >
                  Use a recognizable service or integration name.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="api-key-name"
                    value={apiKeyName}
                    onChange={(event) => {
                      setApiKeyName(event.target.value);
                      if (apiKeyNameError) {
                        setApiKeyNameError("");
                      }
                    }}
                    placeholder="Production checkout service"
                    disabled={Boolean(apiKeyActionId)}
                    error={Boolean(apiKeyNameError)}
                    aria-required
                    aria-describedby={[
                      "api-key-name-instruction",
                      apiKeyNameError ? "api-key-name-error" : undefined,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <Button
                    type="submit"
                    disabled={!canCreateApiKey}
                    className="sm:w-auto"
                  >
                    {apiKeyActionId === "create" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create key
                      </>
                    )}
                  </Button>
                </div>
                {apiKeyNameError && (
                  <p
                    id="api-key-name-error"
                    role="alert"
                    aria-live="polite"
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    {apiKeyNameError}
                  </p>
                )}
              </div>
            </form>

            {revealedApiSecret && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      API key {revealedApiSecret.action}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Copy this secret now. It will not be shown again after you
                      dismiss it or leave this view.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-md border border-emerald-500/20 bg-white p-3 dark:bg-[#09090B] sm:flex-row sm:items-center sm:justify-between">
                    <code className="min-w-0 break-all font-mono text-sm text-zinc-900 dark:text-white">
                      {revealedApiSecret.value}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyApiSecret}
                      aria-label={`Copy raw API key for ${revealedApiSecret.keyName}`}
                    >
                      {apiSecretCopyStatus === "success" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Copied
                        </>
                      ) : apiSecretCopyStatus === "error" ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Failed
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-fit"
                    onClick={() => {
                      setRevealedApiSecret(null);
                      setApiSecretCopyStatus("idle");
                    }}
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide secret
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-3" aria-label="Active API keys">
              {apiKeys.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                  No active API keys. Create one when an integration needs
                  programmatic access.
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {key.name}
                          </p>
                          {apiKeyActionId?.endsWith(key.id) && (
                            <Badge
                              variant="outline"
                              className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                            >
                              Updating
                            </Badge>
                          )}
                        </div>
                        <p className="break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {key.prefix}...
                        </p>
                        <dl className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-500">
                              Created
                            </dt>
                            <dd>{key.createdAt}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-500">
                              Last used
                            </dt>
                            <dd>{key.lastUsedAt}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <DestructiveActionDialog
                          triggerLabel="Rotate"
                          title={`Rotate ${key.name}`}
                          description="This immediately replaces the current secret for this API key."
                          impactItems={[
                            "The current secret will stop working as soon as rotation completes.",
                            "Services using the old secret must be updated with the newly revealed value.",
                            "The new raw secret is shown once and cannot be recovered later.",
                          ]}
                          confirmationToken="ROTATE"
                          confirmationLabel='Type "ROTATE" to continue'
                          confirmLabel="Rotate key"
                          onConfirm={() => handleRotateApiKey(key)}
                        />
                        <DestructiveActionDialog
                          triggerLabel="Revoke"
                          title={`Revoke ${key.name}`}
                          description="This permanently removes programmatic access for this key."
                          impactItems={[
                            "Requests signed with this key will fail immediately.",
                            "Connected jobs may stop until a replacement key is created.",
                            "A revoked key cannot be restored.",
                          ]}
                          confirmationToken="REVOKE"
                          confirmationLabel='Type "REVOKE" to continue'
                          confirmLabel="Revoke key"
                          onConfirm={() => handleRevokeApiKey(key)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          data-search-label="Active sessions"
          className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
                  Active sessions
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Review current access before forcing sign-out everywhere.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
              >
                {sessions.length} devices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {sessions.map((session) => {
              const SessionIcon = session.icon;

              return (
                <div
                  key={session.name}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <SessionIcon className="size-4" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {session.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {session.location}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {session.status}
                    </p>
                  </div>
                </div>
              );
            })}

            <div data-search-label="Sign out all sessions">
              <DestructiveActionDialog
                triggerLabel="Sign out all sessions"
                title="Sign out every other session"
                description="This will invalidate every session except the current browser."
                impactItems={[
                  "Every signed-in mobile or web session will need to log in again.",
                  "Pending high-risk actions will be interrupted until re-authentication.",
                  "This action should only be used if you suspect account access issues.",
                ]}
                confirmationToken="LOGOUT"
                confirmationLabel='Type "LOGOUT" to continue'
                confirmLabel="Force sign-out"
                onConfirm={() =>
                  setStatus({
                    message:
                      "Session reset requested. All other devices would be signed out.",
                    type: "success",
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
      <CheckCircle2
        className={`size-4 ${
          met ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
