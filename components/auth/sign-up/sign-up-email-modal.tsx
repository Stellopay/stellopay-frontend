"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignUpEmailModalProps } from "@/types/auth";

export function SignUpEmailModal({
  isOpen,
  onClose,
  onContinue,
  onGoBack,
  email,
}: SignUpEmailModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string>("");

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus("");
    setTimeout(() => {
      setIsResending(false);
      setResendStatus("Verification email resent successfully.");
    }, 2000);
  };

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
            {email && <strong className="text-white">{email}</strong>}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-4">
          {/* aria-live region announces resend outcome to screen readers */}
          <p
            className="text-gray-400 text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {resendStatus || (
              <>
                Didn&apos;t get code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-[#92569D] underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#92569D] rounded"
                >
                  {isResending ? "Sending…" : "Resend"}
                </button>
              </>
            )}
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
