"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";

/**
 * Keeps the verification code limited to numeric characters and six digits.
 * The entered code is never logged or exposed outside component state.
 */
const normalizeVerificationCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6);

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [status, setStatus] = useState<StatusType>("idle");
  const [message, setMessage] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resendStatus, setResendStatus] = useState<StatusType>("idle");

  const codeInputId = "verification-code";
  const codeHelpId = "verification-code-help";
  const codeErrorId = "verification-code-error";
  const codeDescriptionIds = codeError
    ? `${codeHelpId} ${codeErrorId}`
    : codeHelpId;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/\D/g, "");
    const normalizedValue = normalizeVerificationCode(rawValue);

    setCode(normalizedValue);

    if (rawValue !== numericValue) {
      setCodeError("Verification codes can only contain numbers.");
    } else if (numericValue.length > 6) {
      setCodeError("Verification codes are 6 digits. Extra digits were removed.");
    } else if (normalizedValue.length > 0 && normalizedValue.length < 6) {
      setCodeError("Enter the full 6-digit verification code.");
    } else {
      setCodeError("");
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
    if (code.length !== 6) {
      setCodeError("Enter the full 6-digit verification code.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setCodeError("");
    try {
      // Simulate API call
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          if (code === "123456") {
            resolve(null);
          } else {
            reject(new Error("Invalid code"));
          }
        }, 1500),
      );
      setStatus("success");
      setMessage("Email verified successfully!");
    } catch {
      setStatus("error");
      setMessage("Invalid verification code. Please try again.");
      setCodeError("Invalid verification code. Please try again.");
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
            ) : (
              "Resend"
            )}
          </button>
        </p>

        {/* Input */}
        <label htmlFor={codeInputId} className="sr-only">
          Verification code
        </label>
        <input
          id={codeInputId}
          name="verificationCode"
          type="text"
          inputMode="numeric"
          required
          value={code}
          onChange={handleInputChange}
          aria-label="Verification code"
          aria-describedby={codeDescriptionIds}
          aria-invalid={codeError ? "true" : "false"}
          className="w-full text-left py-3 px-4 rounded-[8px] border border-[#2D2D2D] bg-transparent text-white mb-2 outline-none mt-5"
          placeholder="- - - - - - - -"
        />
        <p id={codeHelpId} className="text-left text-xs text-[#ACB4B5] mb-2">
          Enter the 6-digit code sent to your email.
        </p>
        {codeError && (
          <p
            id={codeErrorId}
            role="alert"
            aria-live="polite"
            className="text-left text-xs text-red-300 mb-4"
          >
            {codeError}
          </p>
        )}

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
          ) : (
            "Continue"
          )}
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
