"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

  const handleResend = async () => {
    setIsResending(true);
    // Add your resend logic here
    console.log("Resending verification email to:", email);
    setTimeout(() => setIsResending(false), 2000); // Reset after 2 seconds
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2A1B2E] border-[#2D2D2D] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Check your email
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <p className="text-gray-300 text-sm">
            We've sent a verification code to
          </p>
          {email && <p className="text-white text-sm font-medium">{email}</p>}
          <p className="text-gray-400 text-sm">
            Didn't get code?{" "}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[#92569D] underline hover:no-underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>

          <div className="space-y-3 pt-4">
            <Button
              onClick={onContinue}
              className="w-full bg-white text-black hover:bg-gray-100 font-medium cursor-pointer"
            >
              Continue
            </Button>
            <button
              onClick={onGoBack}
              className="w-full text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
