"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

type StatusType = "idle" | "loading" | "success" | "error";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const router = useRouter();
  const [status, setStatus] = useState<StatusType>("idle");
  const [message, setMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<StatusType>("idle");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const codeValue = code.join("");

  useEffect(() => {
    if (cooldown === 0) return;

    const timerId = window.setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [cooldown]);

  const updateCodeAt = (index: number, value: string) => {
    const nextValue = value.replace(/[^0-9a-zA-Z]/g, "").slice(-1);
    setCode((current) => {
      const next = [...current];
      next[index] = nextValue;
      return next;
    });

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateCodeAt(index, e.target.value);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedCode = e.clipboardData
      .getData("text")
      .replace(/[^0-9a-zA-Z]/g, "")
      .slice(0, OTP_LENGTH)
      .split("");

    if (pastedCode.length === 0) return;

    setCode([
      ...pastedCode,
      ...Array(OTP_LENGTH - pastedCode.length).fill(""),
    ]);
    inputRefs.current[Math.min(pastedCode.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendStatus === "loading") return;

    setResendStatus("loading");
    setMessage("");
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResendStatus("success");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Verification code resent to your email.");
    } catch {
      setResendStatus("error");
      setMessage("Failed to resend code. Please try again.");
    } finally {
      setTimeout(() => setResendStatus("idle"), 3000);
    }
  };

  const handleContinue = async () => {
    if (codeValue.length !== OTP_LENGTH) {
      setStatus("error");
      setMessage("Enter the 6-character verification code.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      // Simulate API call
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          if (codeValue === "123456") {
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
            disabled={resendStatus === "loading" || cooldown > 0}
            className="text-white font-semibold underline cursor-pointer disabled:opacity-50"
            aria-describedby="resend-status"
          >
            {resendStatus === "loading" ? (
              <>
                <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : "Resend"}
          </button>
        </p>
        <p id="resend-status" aria-live="polite" className="sr-only">
          {cooldown > 0
            ? `You can request a new code in ${cooldown} seconds.`
            : "You can request a new verification code."}
        </p>

        {/* OTP input */}
        <fieldset className="mt-5 mb-4">
          <legend className="sr-only">Verification code</legend>
          <div className="grid grid-cols-6 gap-2">
            {code.map((value, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                type="text"
                inputMode="text"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={value}
                onChange={(event) => handleInputChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                aria-label={`Verification code character ${index + 1}`}
                className="h-12 rounded-[8px] border border-[#2D2D2D] bg-transparent text-center text-lg font-semibold text-white outline-none focus:border-[#F8D2FE] focus:ring-1 focus:ring-[#F8D2FE]"
              />
            ))}
          </div>
        </fieldset>

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
          disabled={codeValue.length !== OTP_LENGTH || status === "loading"}
          className={`w-full py-3 px-4 rounded-[8px] bg-[#FFFFFF] text-black font-medium transition mt-2 flex items-center justify-center gap-2 ${
            codeValue.length === OTP_LENGTH && status !== "loading"
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
