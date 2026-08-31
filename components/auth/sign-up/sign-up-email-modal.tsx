"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignUpEmailModalProps } from "@/types/auth";
import { useCountdown } from "@/hooks/useCountdown";

/** Cooldown window (seconds) enforced client-side between resend clicks. */
const RESEND_COOLDOWN_SECONDS = 30;

export function SignUpEmailModal({
  isOpen,
  onClose,
  onContinue,
  onGoBack,
  email,
}: SignUpEmailModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string>("");
  const [correctedEmail, setCorrectedEmail] = useState<string | null>(null);
  // secondsLeft/isActive persist across a close/reopen within the same
  // mount because the interval lives inside useCountdown, not in local
  // state that would reset when the modal unmounts and remounts.
  const { secondsLeft, isActive: isCoolingDown, start } = useCountdown();

  const currentEmail = correctedEmail || email || "";

  // Common typo detection
  const COMMON_TYPOS: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmil.com": "gmail.com",
    "gamil.com": "gmail.com",
    "yahooo.com": "yahoo.com",
    "yaho.com": "yahoo.com",
    "outlok.com": "outlook.com",
    "outilook.com": "outlook.com",
    "hotmil.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
  };

  const getSuggestion = (emailStr: string) => {
    if (!emailStr) return null;
    const parts = emailStr.split("@");
    if (parts.length !== 2) return null;
    const domain = parts[1].toLowerCase();
    if (COMMON_TYPOS[domain]) {
      return `${parts[0]}@${COMMON_TYPOS[domain]}`;
    }
    return null;
  };

  const suggestion = !correctedEmail ? getSuggestion(currentEmail) : null;

  const handleCorrection = () => {
    if (suggestion) {
      setCorrectedEmail(suggestion);
      // Optional: if the parent form needs to know, we could call an onEmailCorrection prop.
      // For now, we update the local display.
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus("");
    // TODO: trigger the resend-verification-email request for `email`.
    setTimeout(() => {
      setIsResending(false);
      setResendStatus("Verification email resent successfully.");
      start(RESEND_COOLDOWN_SECONDS);
    }, 2000);
  };

  const isResendDisabled = isResending || isCoolingDown;

  // ── Focus-return-to-trigger ────────────────────────────────────
  // Capture the previously focused element before the dialog opens
  // and restore focus to it on every close path so keyboard and
  // screen-reader users don't lose their place (WCAG 2.1 AA 2.4.3).
  const prevFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      prevFocusedRef.current = document.activeElement as HTMLElement;
    } else if (prevFocusedRef.current) {
      // Use requestAnimationFrame to ensure the Radix dialog has
      // fully unmounted before we programmatically move focus.
      requestAnimationFrame(() => {
        prevFocusedRef.current?.focus();
        prevFocusedRef.current = null;
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2A1B2E] border-[#2D2D2D] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Check your email
          </DialogTitle>
          {/* DialogDescription satisfies the Radix accessible description
              requirement and is announced by screen readers on open. */}
          <DialogDescription className="text-center text-gray-300 text-sm">
            We&apos;ve sent a verification code to{" "}
            {currentEmail && <strong className="text-white">{currentEmail}</strong>}
          </DialogDescription>
        </DialogHeader>

        {suggestion && (
          <div
            className="bg-[#3D2942] border border-[#92569D] text-[#E0C8E4] p-3 rounded-md text-sm flex items-center justify-between"
            role="status"
            aria-live="polite"
          >
            <span>
              Did you mean <strong className="text-white">{suggestion}</strong>?
            </span>
            <button
              type="button"
              onClick={handleCorrection}
              className="ml-3 text-[#92569D] hover:text-white underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#92569D] rounded"
              aria-label={`Change email to ${suggestion}`}
            >
              Yes, fix it
            </button>
          </div>
        )}

        <div className="text-center space-y-4">
          {/* aria-live region announces resend outcome to screen readers.
              The resend control itself stays visible after a successful
              resend so the cooldown countdown is actually seen, instead of
              being permanently replaced by the success text. */}
          <p className="text-gray-400 text-sm">
            Didn&apos;t get code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled}
              className="text-[#92569D] underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#92569D] rounded"
            >
              {isResending
                ? "Sending…"
                : isCoolingDown
                  ? `Resend in ${secondsLeft}s`
                  : "Resend"}
            </button>
          </p>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {resendStatus}
          </p>

          <div className="space-y-3 pt-4">
            <Button
              type="button"
              onClick={onContinue}
              className="w-full bg-white text-black hover:bg-gray-100 font-medium"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={onGoBack}
              className="w-full text-gray-400 hover:text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
