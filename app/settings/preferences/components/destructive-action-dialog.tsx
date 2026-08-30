"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePendingAction } from "@/hooks/usePendingAction";

interface DestructiveActionDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  impactItems: string[];
  confirmationToken: string;
  confirmationLabel: string;
  confirmLabel: string;
  /**
   * Runs once per confirmation. May return a promise; the dialog stays open
   * (in a pending state) until it resolves, and only closes on success. When
   * it rejects, the dialog stays open with an inline error so the user can
   * retry.
   */
  onConfirm: () => void | Promise<void>;
}

/**
 * Inspects the typed confirmation against the required token and returns a
 * human-readable hint describing *why* it does not match.
 *
 * The comparison the dialog acts on is intentionally **exact** (see
 * {@link DestructiveActionDialog}); this helper only exists to explain a
 * mismatch to the user so a silent failure — most importantly an invisible
 * trailing space — becomes obvious.
 *
 * @param value - The raw text the user typed (never trimmed before matching).
 * @param token - The exact token the user must reproduce to confirm.
 * @returns A guidance string when the value does not exactly match the token,
 *   or `null` when the field is empty or the value matches exactly.
 */
function getConfirmationError(value: string, token: string): string | null {
  if (value.length === 0) {
    return null;
  }

  if (value === token) {
    return null;
  }

  const trimmed = value.trim();

  // Same characters, but surrounded by whitespace the user cannot see.
  if (trimmed === token) {
    return `Remove the extra spaces — type exactly "${token}".`;
  }

  // Right letters, wrong capitalization. The match is case-sensitive on purpose.
  if (trimmed.toLowerCase() === token.toLowerCase()) {
    return `Check the capitalization — type exactly "${token}".`;
  }

  return `The text doesn't match. Type exactly "${token}" to confirm.`;
}

/**
 * A confirmation dialog for irreversible, high-impact actions (e.g. account
 * deactivation, wallet removal, key revocation).
 *
 * Safety & idempotency behaviour:
 * - Exactly one request is issued per confirmation. While `onConfirm` is
 *   pending the dialog disables its controls (confirm, cancel, close, typed
 *   input) and guards against re-entry, so a rapid double click or a held /
 *   repeated Enter key can never fire the action twice.
 * - The dialog only closes after `onConfirm` resolves successfully. It never
 *   looks "done" while the request is still in flight.
 * - If `onConfirm` rejects, the dialog stays open, surfaces the failure
 *   inline, and leaves the confirm button enabled so the user can retry.
 * - The confirm action requires an **exact** token match — the value is *not*
 *   trimmed or lower-cased — so accidental whitespace or wrong casing can never
 *   bypass the user's intent. Any mismatch is surfaced inline (including a
 *   whitespace-specific hint) instead of failing silently.
 *
 * Accessibility:
 * - The confirmation input is auto-focused when the dialog opens
 *   (`onOpenAutoFocus`), and focus returns to the trigger button on close —
 *   focus trapping and restoration are provided by Radix's `Dialog`.
 * - The input is wired with `aria-required`, `aria-invalid`, and
 *   `aria-describedby` (instruction text + error) via the shared `Input`
 *   component, and the dialog signals `aria-busy` while the action runs.
 */
export default function DestructiveActionDialog({
  triggerLabel,
  title,
  description,
  impactItems,
  confirmationToken,
  confirmationLabel,
  confirmLabel,
  onConfirm,
}: DestructiveActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const {
    isPending,
    error: actionError,
    run,
    reset: resetAction,
  } = usePendingAction();

  const inputId = `confirmation-${confirmationToken.toLowerCase()}`;
  const labelId = `${inputId}-label`;
  const instructionId = `${inputId}-instruction`;
  const errorId = `${inputId}-error`;
  const actionErrorId = `${inputId}-action-error`;

  // Strict, exact comparison: whitespace and casing must match the token.
  const isConfirmed = confirmationText === confirmationToken;

  const validationError = useMemo(
    () => getConfirmationError(confirmationText, confirmationToken),
    [confirmationText, confirmationToken],
  );

  const closeDialog = () => {
    setOpen(false);
    setConfirmationText("");
    resetAction();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Never let the dialog dismiss (Escape, overlay, close button, cancel)
    // while a request is in flight — closing early would imply success.
    if (isPending) {
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmationText("");
      resetAction();
    }
  };

  const handleConfirm = async () => {
    if (!isConfirmed || isPending) {
      return;
    }

    const succeeded = await run(onConfirm);
    if (succeeded) {
      // Close directly: `handleOpenChange` would still see the stale pending
      // state in this closure and refuse to dismiss.
      closeDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent
        className="border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white"
        onOpenAutoFocus={(event) => {
          // Override Radix's default (focus the content/close button) so the
          // user lands directly on the field they must fill in.
          event.preventDefault();
          if (!isPending) {
            document.getElementById(inputId)?.focus();
          }
        }}
        aria-busy={isPending}
      >
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="text-zinc-600 dark:text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Before you continue
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {impactItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <label
              id={labelId}
              htmlFor={inputId}
              className="text-sm font-medium text-zinc-900 dark:text-white"
            >
              {confirmationLabel}
            </label>
            <p
              id={instructionId}
              className="text-xs text-zinc-600 dark:text-zinc-400"
            >
              {`Type "${confirmationToken}" exactly to confirm.`}
            </p>
            <Input
              id={inputId}
              value={confirmationText}
              onChange={(event) => {
                setConfirmationText(event.target.value);
                if (actionError) {
                  resetAction();
                }
              }}
              placeholder={confirmationToken}
              className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
              required
              aria-required
              disabled={isPending}
              error={Boolean(validationError)}
              labelId={labelId}
              descriptionId={instructionId}
              errorId={errorId}
            />
            {validationError && (
              <p
                id={errorId}
                role="alert"
                aria-live="polite"
                className="text-xs font-medium text-red-500"
              >
                {validationError}
              </p>
            )}
            {actionError && (
              <p
                id={actionErrorId}
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-500"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {actionError}. You can retry.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
