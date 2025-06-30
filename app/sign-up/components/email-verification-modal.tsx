"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onGoBack: () => void;
  onResend: () => void;
  email?: string;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onContinue,
  onGoBack,
  onResend,
  email,
}: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    await onResend();
    setTimeout(() => setIsResending(false), 2000); // Reset after 2 seconds
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#2A1B2E] rounded-2xl p-8 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="text-center pt-4">
          <h2 className="text-white text-xl font-semibold mb-3">
            Check your email
          </h2>

          <p className="text-gray-300 text-sm mb-2">
            We've sent a verification code to
          </p>

          {email && (
            <p className="text-white text-sm font-medium mb-6">{email}</p>
          )}

          <p className="text-gray-400 text-sm mb-8">
            Didn't get code?{" "}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[#92569D] underline hover:no-underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className="w-full bg-white text-black hover:bg-gray-100 font-medium py-3"
            >
              Continue
            </Button>

            <button
              onClick={onGoBack}
              className="w-full text-gray-400 hover:text-white text-sm transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
