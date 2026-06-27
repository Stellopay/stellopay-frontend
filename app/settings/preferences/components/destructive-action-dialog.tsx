"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
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

interface DestructiveActionDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  impactItems: string[];
  confirmationToken: string;
  confirmationLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
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
 * deactivation, wallet removal).
 *
 * Accessibility & safety behaviour:
 * - The confirmation input is auto-focused when the dialog opens
 *   (`onOpenAutoFocus`), and focus returns to the trigger button on close —
 *   focus trapping and restoration are provided by Radix's `Dialog`.
 * - The input is wired with `aria-required`, `aria-invalid`, and
 *   `aria-describedby` (instruction text + error) via the shared `Input`
 *   component.
 * - The confirm action requires an **exact** token match — the value is *not*
 *   trimmed or lower-cased — so accidental whitespace or wrong casing can never
 *   bypass the user's intent. Any mismatch is surfaced inline (including a
 *   whitespace-specific hint) instead of failing silently.
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

  const inputId = `confirmation-${confirmationToken.toLowerCase()}`;
  const labelId = `${inputId}-label`;
  const instructionId = `${inputId}-instruction`;
  const errorId = `${inputId}-error`;

  // Strict, exact comparison: whitespace and casing must match the token.
  const isConfirmed = confirmationText === confirmationToken;

  const validationError = useMemo(
    () => getConfirmationError(confirmationText, confirmationToken),
    [confirmationText, confirmationToken],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setConfirmationText("");
    }
  };

  const handleConfirm = () => {
    if (!isConfirmed) {
      return;
    }

    onConfirm();
    handleOpenChange(false);
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
          document.getElementById(inputId)?.focus();
        }}
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
              onChange={(event) => setConfirmationText(event.target.value)}
              placeholder={confirmationToken}
              className="border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5"
              required
              aria-required
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
