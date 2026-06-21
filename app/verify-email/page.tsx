"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [status, setStatus] = useState<StatusType>("idle");
  const [message, setMessage] = useState("");
  const [inputFeedback, setInputFeedback] = useState("");
  const [resendStatus, setResendStatus] = useState<StatusType>("idle");

  const codeInputId = "verification-code";
  const helpTextId = "verification-code-help";
  const feedbackId = "verification-code-feedback";
  const isCodeInvalid = code.length > 0 && code.length < 6;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    const nextCode = numericValue.slice(0, 6);
    setCode(nextCode);

    if (numericValue.length > 6) {
      setInputFeedback("Verification codes are 6 digits, so extra characters were removed.");
    } else if (e.target.value !== numericValue) {
      setInputFeedback("Use digits only for the verification code.");
    } else if (nextCode.length > 0 && nextCode.length < 6) {
      setInputFeedback("Enter the 6-digit code from your email.");
    } else {
      setInputFeedback("");
    }
  };

  const handleResend = async () => {
    setResendStatus("loading");
    setMessage("");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResendStatus("success");
      setMessage("Verification code resent to your email.");
    } catch {
      setResendStatus("error");
      setMessage("Failed to resend code. Please try again.");
    } finally {
      setTimeout(() => setResendStatus("idle"), 3000);
    }
  };

  const handleContinue = async () => {
    setStatus("loading");
    setMessage("");
    try {
      // Simulate API call
      await new Promise((resolve, reject) => setTimeout(() => {
        if (code === "123456") {
          resolve(null);
        } else {
          reject(new Error("Invalid code"));
        }
      }, 1500));
      setStatus("success");
      setMessage("Email verified successfully!");
    } catch {
      setStatus("error");
      setMessage("Invalid verification code. Please try again.");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* Close icon */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 right-6 text-white cursor-pointer"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Modal Card */}
      <div className="border-[#2D2D2D] border rounded-[24px] px-7 sm:px-11 py-9 w-full max-w-[480px] space-y-4 text-center shadow-lg">
        <h1 className="text-[#F8D2FE] text-2xl sm:text-[32px] font-medium mb-2">
          Check your email
        </h1>
        <p className="text-sm text-[#ACB4B5] mb-6">
          Didn&apos;t get code?{" "}
          <button
            onClick={handleResend}
            disabled={resendStatus === "loading"}
            className="text-white font-semibold underline cursor-pointer disabled:opacity-50"
          >
            {resendStatus === "loading" ? (
              <>
                <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : "Resend"}
          </button>
        </p>

        {/* Input */}
        <div className="mt-5 mb-4 text-left">
          <label
            htmlFor={codeInputId}
            className="mb-2 block text-sm font-medium text-white"
          >
            Verification code
          </label>
          <input
            id={codeInputId}
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            aria-label="Verification code"
            aria-describedby={`${helpTextId} ${feedbackId}`}
            aria-invalid={isCodeInvalid || status === "error"}
            value={code}
            onChange={handleInputChange}
            className="w-full rounded-[8px] border border-[#2D2D2D] bg-transparent px-4 py-3 text-left text-white outline-none focus:border-white"
            placeholder="- - - - - -"
          />
          <p id={helpTextId} className="mt-2 text-xs text-[#ACB4B5]">
            Enter the 6-digit code sent to your email.
          </p>
          <p
            id={feedbackId}
            aria-live="polite"
            className={`mt-1 min-h-4 text-xs ${
              isCodeInvalid || inputFeedback ? "text-amber-300" : "text-[#ACB4B5]"
            }`}
          >
            {inputFeedback || (code.length === 6 ? "Code is ready to verify." : "")}
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`text-sm px-4 py-2 rounded-lg mb-2 ${
              status === "success" || resendStatus === "success"
                ? "bg-emerald-500/10 text-emerald-300"
                : status === "error" || resendStatus === "error"
                ? "bg-red-500/10 text-red-300"
                : ""
            }`}
          >
            {message}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={code.length !== 6 || status === "loading"}
          className={`w-full py-3 px-4 rounded-[8px] bg-[#FFFFFF] text-black font-medium transition mt-2 flex items-center justify-center gap-2 ${
            code.length === 6 && status !== "loading"
              ? "cursor-pointer"
              : "opacity-80 cursor-not-allowed"
          }`}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : "Continue"}
        </button>

        {/* Go Back */}
        <button
          onClick={() => router.back()}
          className="text-[13px] text-[#FFFFFF] underline font-semibold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
