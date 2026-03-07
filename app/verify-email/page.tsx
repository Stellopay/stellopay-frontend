"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type StatusType = "idle" | "loading" | "success" | "error";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const [status, setStatus] = useState<StatusType>("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<StatusType>("idle");
  const [fieldError, setFieldError] = useState("");
  const [truncated, setTruncated] = useState(false);

  const codeDescId = "verify-code-desc";
  const codeErrorId = "verify-code-error";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^0-9a-zA-Z]/g, "");
    if (sanitized.length > 6) {
      setCode(sanitized.slice(0, 6));
      setTruncated(true);
      setTimeout(() => setTruncated(false), 3000);
    } else {
      setCode(sanitized);
      setTruncated(false);
    }
    if (sanitized.length > 0 && sanitized.length < 6) {
      setFieldError("Code must be 6 characters.");
    } else {
      setFieldError("");
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

        {/* Code input */}
        <div className="text-left mt-5 mb-4">
          <label htmlFor="verify-code" className="sr-only">
            Verification code
          </label>
          <p id={codeDescId} className="text-xs text-[#ACB4B5] mb-2">
            Enter the 6-character code sent to your email.
          </p>
          <Input
            id="verify-code"
            name="verify-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={handleInputChange}
            aria-label="Verification code"
            placeholder="- - - - - - - -"
            className="w-full text-left py-3 px-4 rounded-[8px] border border-[#2D2D2D] bg-transparent text-white outline-none"
            error={!!fieldError}
            descriptionId={codeDescId}
            errorId={codeErrorId}
          />
          {fieldError && (
            <p id={codeErrorId} role="alert" className="text-xs text-red-300 mt-1">
              {fieldError}
            </p>
          )}
          {truncated && (
            <p role="status" aria-live="polite" className="text-xs text-yellow-300 mt-1">
              Code truncated to 6 characters.
            </p>
          )}
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
