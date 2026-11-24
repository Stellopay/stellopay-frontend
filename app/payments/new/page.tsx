"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Send,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";

import { useDirtyForm, useWallet } from "@/context/wallet-context";
import { usePendingAction } from "@/hooks/usePendingAction";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import {
  createPayment,
  DEFAULT_ACCOUNT_BALANCES,
  DEFAULT_RECENT_RECIPIENTS,
  type AccountAssetBalance,
  type CreatePaymentResult,
  type RecentRecipient,
} from "@/lib/api/payments";
import {
  addAmounts,
  checkSpendableBalance,
  DEFAULT_BASE_FEE_XLM,
  getMaxSpendableAmount,
  parseAmountToStroops,
} from "@/utils/amountUtils";
import {
  isValidStellarAddress,
  truncateStellarAddress,
} from "@/utils/stellarAddress";
import { cn } from "@/utils/commonUtils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type WizardStep = "recipient" | "amount" | "review" | "result";

const WIZARD_STEPS: ReadonlyArray<{
  id: WizardStep;
  label: string;
  stepNumber: number;
}> = [
  { id: "recipient", label: "Recipient", stepNumber: 1 },
  { id: "amount", label: "Amount", stepNumber: 2 },
  { id: "review", label: "Review", stepNumber: 3 },
  { id: "result", label: "Result", stepNumber: 4 },
];

export interface PaymentFormValues {
  recipient: string;
  memo: string;
  assetCode: string;
  amount: string;
}

export interface NewPaymentPageProps {
  /** Optional override of account asset balances (useful for tests). */
  balances?: readonly AccountAssetBalance[];
  /** Optional override of recent recipients (useful for tests). */
  recentRecipients?: readonly RecentRecipient[];
  /**
   * Whether the `/transactions/[id]` detail route exists in the app.
   * Defaults to `false` so confirmation links point to `/transactions` unless
   * a detail route is enabled.
   */
  hasTransactionDetailRoute?: boolean;
  /**
   * Optional custom submit handler (defaults to `createPayment` from `lib/api/payments`).
   */
  onSubmitPayment?: typeof createPayment;
}

/**
 * Builds the Zod validation schema parameterized by the active wallet address
 * and the available asset balances so self-addressed and over-balance /
 * reserve-breaching payments are rejected inline.
 */
export function createPaymentFormSchema(
  senderAddress: string | null,
  balances: readonly AccountAssetBalance[],
) {
  const normalizedSender = senderAddress?.trim().toUpperCase() ?? "";

  return z
    .object({
      recipient: z
        .string()
        .trim()
        .min(1, "Recipient address is required.")
        .refine(isValidStellarAddress, {
          message:
            "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.",
        })
        .refine(
          (val) => {
            if (!normalizedSender) return true;
            return val.trim().toUpperCase() !== normalizedSender;
          },
          {
            message:
              "You cannot send a payment to your own connected wallet address.",
          },
        ),
      memo: z
        .string()
        .max(28, "Memo can be at most 28 characters (Stellar text memo limit)."),
      assetCode: z.string().trim().min(1, "Select an asset to send."),
      amount: z
        .string()
        .trim()
        .min(1, "Amount is required.")
        .superRefine((val, ctx) => {
          const parsed = parseAmountToStroops(val, { allowZero: false });
          if (!parsed.ok) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: parsed.message,
            });
          }
        }),
    })
    .superRefine((values, ctx) => {
      const parsedAmount = parseAmountToStroops(values.amount, {
        allowZero: false,
      });
      if (!parsedAmount.ok) return;

      const selectedAsset = balances.find(
        (b) => b.code.toUpperCase() === values.assetCode.trim().toUpperCase(),
      );
      if (!selectedAsset) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assetCode"],
          message: "Selected asset is not available in your account.",
        });
        return;
      }

      const spendCheck = checkSpendableBalance({
        amount: parsedAmount.normalized,
        balance: selectedAsset.balance,
        assetCode: selectedAsset.code,
        feeXlm: DEFAULT_BASE_FEE_XLM,
        minReserveXlm: selectedAsset.minReserve,
      });

      if (!spendCheck.allowed && spendCheck.message) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: spendCheck.message,
        });
      }
    });
}

export default function NewPaymentPage({
  balances = DEFAULT_ACCOUNT_BALANCES,
  recentRecipients = DEFAULT_RECENT_RECIPIENTS,
  hasTransactionDetailRoute = false,
  onSubmitPayment = createPayment,
}: NewPaymentPageProps = {}) {
  const { address, network, getActionState } = useWallet();
  const signActionState = getActionState("signTransaction");

  const [currentStep, setCurrentStep] = useState<WizardStep>("recipient");
  const [paymentResult, setPaymentResult] =
    useState<CreatePaymentResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const schema = useMemo(
    () => createPaymentFormSchema(address, balances),
    [address, balances],
  );

  const defaultAssetCode = balances[0]?.code ?? "USDC";

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      recipient: "",
      memo: "",
      assetCode: defaultAssetCode,
      amount: "",
    },
  });

  const {
    register,
    watch,
    setValue,
    trigger,
    reset: resetForm,
    formState: { errors },
  } = form;

  const watchedRecipient = watch("recipient");
  const watchedMemo = watch("memo");
  const watchedAssetCode = watch("assetCode");
  const watchedAmount = watch("amount");

  // Re-validate recipient and amount when connected wallet address changes
  useEffect(() => {
    if (watchedRecipient.trim().length > 0) {
      void trigger("recipient");
    }
  }, [address, watchedRecipient, trigger]);

  // Track unsaved changes while the user has entered data and hasn't completed the payment
  const hasUnsavedInput =
    currentStep !== "result" &&
    (watchedRecipient.trim().length > 0 ||
      watchedAmount.trim().length > 0 ||
      watchedMemo.trim().length > 0);

  const { clearDirty } = useUnsavedChangesGuard(hasUnsavedInput, {
    message: "You have unsaved changes. Leave this page and discard them?",
  });
  useDirtyForm(hasUnsavedInput);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const selectedAsset = useMemo(
    () =>
      balances.find(
        (b) => b.code.toUpperCase() === watchedAssetCode.trim().toUpperCase(),
      ) ?? balances[0],
    [balances, watchedAssetCode],
  );

  const maxSpendable = useMemo(() => {
    if (!selectedAsset) return "0";
    return getMaxSpendableAmount({
      balance: selectedAsset.balance,
      assetCode: selectedAsset.code,
      feeXlm: DEFAULT_BASE_FEE_XLM,
      minReserveXlm: selectedAsset.minReserve,
    });
  }, [selectedAsset]);

  const spendCheck = useMemo(() => {
    if (!selectedAsset || !watchedAmount.trim()) return null;
    return checkSpendableBalance({
      amount: watchedAmount,
      balance: selectedAsset.balance,
      assetCode: selectedAsset.code,
      feeXlm: DEFAULT_BASE_FEE_XLM,
      minReserveXlm: selectedAsset.minReserve,
    });
  }, [selectedAsset, watchedAmount]);

  const normalizedAmountDisplay = useMemo(() => {
    const parsed = parseAmountToStroops(watchedAmount, { allowZero: false });
    return parsed.ok ? parsed.normalized : watchedAmount.trim() || "0";
  }, [watchedAmount]);

  const totalDebitDisplay = useMemo(() => {
    if (!selectedAsset) return `${normalizedAmountDisplay}`;
    const parsed = parseAmountToStroops(watchedAmount, { allowZero: false });
    if (!parsed.ok) return `${normalizedAmountDisplay} ${selectedAsset.code}`;
    if (selectedAsset.code.toUpperCase() === "XLM") {
      return `${addAmounts(parsed.normalized, DEFAULT_BASE_FEE_XLM)} XLM`;
    }
    return `${parsed.normalized} ${selectedAsset.code} + ${DEFAULT_BASE_FEE_XLM} XLM`;
  }, [selectedAsset, watchedAmount, normalizedAmountDisplay]);

  const {
    isPending: isSubmitting,
    error: submitError,
    run: runSubmitPayment,
    reset: resetSubmitError,
  } = usePendingAction({
    genericErrorMessage:
      "Payment could not be completed. Please review your details and try again.",
  });

  const handleGoToAmount = async () => {
    const valid = await trigger(["recipient", "memo"]);
    if (valid) {
      setCurrentStep("amount");
    }
  };

  const handleGoToReview = async () => {
    const valid = await trigger(["assetCode", "amount"]);
    if (valid) {
      resetSubmitError();
      setCurrentStep("review");
    }
  };

  const handleSelectRecipient = (recipientAddress: string) => {
    setValue("recipient", recipientAddress, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleUseMaxAmount = () => {
    setValue("amount", maxSpendable, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleAssetChange = (newAssetCode: string) => {
    setValue("assetCode", newAssetCode, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    if (watchedAmount.trim().length > 0) {
      void trigger("amount");
    }
  };

  const executePaymentSubmission = async () => {
    const currentSignState = getActionState("signTransaction");
    if (!currentSignState.enabled || !address) {
      return;
    }

    await runSubmitPayment(async () => {
      const isAllValid = await trigger();
      if (!isAllValid) {
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const values = form.getValues();
      const result = await onSubmitPayment(
        {
          senderAddress: address,
          recipient: values.recipient,
          assetCode: values.assetCode,
          amount: values.amount,
          ...(values.memo.trim() ? { memo: values.memo.trim() } : {}),
          networkId: network.id,
        },
        {
          signal: controller.signal,
          balances,
        },
      );

      clearDirty();
      setPaymentResult(result);
      setCurrentStep("result");
    });
  };

  const handleSendAnother = () => {
    resetSubmitError();
    setPaymentResult(null);
    resetForm({
      recipient: "",
      memo: "",
      assetCode: defaultAssetCode,
      amount: "",
    });
    setCurrentStep("recipient");
  };

  const formId = useId();
  const recipientInputId = `${formId}-recipient`;
  const recipientErrorId = `${formId}-recipient-error`;
  const recipientHintId = `${formId}-recipient-hint`;
  const memoInputId = `${formId}-memo`;
  const memoErrorId = `${formId}-memo-error`;
  const memoHintId = `${formId}-memo-hint`;
  const assetSelectId = `${formId}-asset`;
  const amountInputId = `${formId}-amount`;
  const amountErrorId = `${formId}-amount-error`;
  const amountHintId = `${formId}-amount-hint`;
  const signGateReasonId = `${formId}-sign-gate-reason`;

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const transactionHref =
    paymentResult && hasTransactionDetailRoute
      ? `/transactions/${encodeURIComponent(paymentResult.id)}`
      : "/transactions";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
              Send Stellar Payment
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Transfer assets across the Stellar network with instant finality
              and sub-cent fees.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-[#111111] dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>

        {/* Step Indicator */}
        <nav aria-label="Payment wizard steps" className="mt-6">
          <ol className="grid grid-cols-4 gap-2 sm:gap-4">
            {WIZARD_STEPS.map((step, index) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <li
                  key={step.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm",
                    isCurrent
                      ? "border-blue-600 bg-blue-50/80 text-blue-900 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                      : isCompleted
                        ? "border-emerald-600/40 bg-emerald-50/50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-300"
                        : "border-zinc-200 bg-zinc-50/60 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isCurrent
                        ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-zinc-950"
                        : isCompleted
                          ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950"
                          : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {step.stepNumber}
                  </span>
                  <span className="truncate font-semibold">{step.label}</span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Step 1: Recipient */}
      {currentStep === "recipient" && (
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-zinc-900 dark:text-white">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Step 1: Recipient Details
            </CardTitle>
            <CardDescription>
              Enter a destination Stellar public key (`G...`) or muxed address
              (`M...`), or pick from your recent recipients.
            </CardDescription>
          </CardHeader>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void handleGoToAmount();
            }}
          >
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={recipientInputId} required>
                  Recipient Stellar Address
                </Label>
                <Input
                  id={recipientInputId}
                  type="text"
                  autoComplete="off"
                  placeholder="G... or M..."
                  error={Boolean(errors.recipient)}
                  descriptionId={recipientHintId}
                  errorId={recipientErrorId}
                  {...register("recipient")}
                />
                <p
                  id={recipientHintId}
                  className="text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Supports 56-character Ed25519 (`G...`) and 69-character muxed
                  (`M...`) Stellar addresses.
                </p>
                {errors.recipient && (
                  <p
                    id={recipientErrorId}
                    role="alert"
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.recipient.message}
                  </p>
                )}
              </div>

              {recentRecipients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Recent Recipients
                  </p>
                  <div
                    role="group"
                    aria-label="Recent recipients"
                    className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  >
                    {recentRecipients.map((item) => {
                      const isSelected =
                        watchedRecipient.trim().toUpperCase() ===
                        item.address.toUpperCase();
                      return (
                        <button
                          key={item.address}
                          type="button"
                          onClick={() => handleSelectRecipient(item.address)}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex flex-col items-start rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                            isSelected
                              ? "border-blue-600 bg-blue-50/70 text-blue-950 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-100"
                              : "border-zinc-200 bg-zinc-50/50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:hover:bg-zinc-800",
                          )}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {truncateStellarAddress(item.address, 6, 6)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={memoInputId}>Memo (Optional)</Label>
                <Input
                  id={memoInputId}
                  type="text"
                  autoComplete="off"
                  placeholder="Invoice #1042 or reference note"
                  error={Boolean(errors.memo)}
                  descriptionId={memoHintId}
                  errorId={memoErrorId}
                  {...register("memo")}
                />
                <p
                  id={memoHintId}
                  className="text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Public Stellar text memo (up to 28 characters).
                </p>
                {errors.memo && (
                  <p
                    id={memoErrorId}
                    role="alert"
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.memo.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="mt-6 flex justify-end border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <Button type="submit" size="lg">
                Continue to Amount
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 2: Amount & Asset */}
      {currentStep === "amount" && (
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-zinc-900 dark:text-white">
              <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Step 2: Asset & Amount
            </CardTitle>
            <CardDescription>
              Choose an asset from your account balances and specify the amount
              to send (up to 7 decimal places).
            </CardDescription>
          </CardHeader>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void handleGoToReview();
            }}
          >
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={assetSelectId} required>
                  Asset
                </Label>
                <select
                  id={assetSelectId}
                  value={watchedAssetCode}
                  onChange={(e) => handleAssetChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  {balances.map((asset) => (
                    <option key={asset.code} value={asset.code}>
                      {asset.code} — {asset.name} (Balance: {asset.balance}{" "}
                      {asset.code})
                    </option>
                  ))}
                </select>
                {errors.assetCode && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.assetCode.message}
                  </p>
                )}
              </div>

              {selectedAsset && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Available Balance:{" "}
                    </span>
                    <span
                      data-testid="selected-asset-balance"
                      className="font-mono font-semibold text-zinc-900 dark:text-white"
                    >
                      {selectedAsset.balance} {selectedAsset.code}
                    </span>
                    {selectedAsset.code.toUpperCase() === "XLM" && (
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                        (Min reserve: {selectedAsset.minReserve} XLM)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Max spendable:{" "}
                      <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                        {maxSpendable} {selectedAsset.code}
                      </strong>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseMaxAmount}
                    >
                      Use Max
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={amountInputId} required>
                  Amount ({selectedAsset?.code ?? "Asset"})
                </Label>
                <Input
                  id={amountInputId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.0000000"
                  error={Boolean(errors.amount)}
                  descriptionId={amountHintId}
                  errorId={amountErrorId}
                  {...register("amount")}
                />
                <p
                  id={amountHintId}
                  className="text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Stellar supports up to 7 decimal places (1 stroop = 0.0000001).
                </p>
                {errors.amount && (
                  <p
                    id={amountErrorId}
                    role="alert"
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Fee Preview Box */}
              <div
                aria-label="Fee preview"
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Estimated Network Fee
                  </span>
                  <span
                    data-testid="fee-preview-value"
                    className="font-mono font-medium text-zinc-900 dark:text-white"
                  >
                    {DEFAULT_BASE_FEE_XLM} XLM (100 stroops)
                  </span>
                </div>
                {spendCheck && spendCheck.allowed && selectedAsset && (
                  <div className="flex items-center justify-between border-t border-zinc-200/70 pt-2 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Remaining {selectedAsset.code} Balance
                    </span>
                    <span
                      data-testid="remaining-balance-preview"
                      className="font-mono font-medium text-zinc-900 dark:text-white"
                    >
                      {spendCheck.remainingBalance} {selectedAsset.code}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("recipient")}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
              <Button type="submit" size="lg">
                Review Payment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 3: Review & Sign */}
      {currentStep === "review" && (
        <Card className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-zinc-900 dark:text-white">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              Step 3: Review & Sign Transaction
            </CardTitle>
            <CardDescription>
              Verify the recipient address, amount, and network fee before
              signing with your connected Stellar wallet.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">From Wallet</dt>
                <dd className="font-mono font-medium text-zinc-900 dark:text-white break-all">
                  {address ?? "Not connected"}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  To Recipient
                </dt>
                <dd
                  data-testid="review-recipient"
                  className="font-mono font-medium text-zinc-900 dark:text-white break-all"
                >
                  {watchedRecipient.trim().toUpperCase()}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Network</dt>
                <dd className="font-medium text-zinc-900 dark:text-white">
                  {network.name}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Amount</dt>
                <dd
                  data-testid="review-amount"
                  className="font-mono text-base font-bold text-zinc-900 dark:text-white"
                >
                  {normalizedAmountDisplay} {selectedAsset?.code}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Network Fee</dt>
                <dd
                  data-testid="review-fee"
                  className="font-mono font-medium text-zinc-900 dark:text-white"
                >
                  {DEFAULT_BASE_FEE_XLM} XLM
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Total Debit
                </dt>
                <dd
                  data-testid="review-total"
                  className="font-mono font-bold text-zinc-900 dark:text-white"
                >
                  {totalDebitDisplay}
                </dd>
              </div>
              {watchedMemo.trim() && (
                <div className="flex items-center justify-between py-3 last:pb-0">
                  <dt className="text-zinc-500 dark:text-zinc-400">Memo</dt>
                  <dd
                    data-testid="review-memo"
                    className="font-medium text-zinc-900 dark:text-white"
                  >
                    {watchedMemo.trim()}
                  </dd>
                </div>
              )}
            </dl>

            {/* Wallet Signing Capability Gating Notice */}
            {!signActionState.enabled && (
              <div
                id={signGateReasonId}
                role="status"
                aria-live="polite"
                data-testid="signing-unavailable-notice"
                className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200"
              >
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="font-semibold">{signActionState.reason}</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {signActionState.alternative}
                  </p>
                </div>
              </div>
            )}

            {/* Submission Error State */}
            {submitError && (
              <ErrorState
                title="Payment Failed"
                description={submitError}
                onRetry={() => void executePaymentSubmission()}
                retrying={isSubmitting}
              />
            )}
          </CardContent>

          <CardFooter className="mt-2 flex items-center justify-between gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => setCurrentStep("amount")}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>

            <Button
              type="button"
              size="lg"
              disabled={!signActionState.enabled || isSubmitting}
              aria-describedby={
                !signActionState.enabled ? signGateReasonId : undefined
              }
              onClick={() => void executePaymentSubmission()}
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Signing & Sending…" : "Sign & Send Payment"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Confirmation Result */}
      {currentStep === "result" && paymentResult && (
        <Card
          data-testid="payment-success-card"
          className="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111111]"
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-zinc-900 dark:text-white">
              Payment Sent Successfully
            </CardTitle>
            <CardDescription>
              Your transaction has been signed and broadcast to the{" "}
              {network.name} network.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-zinc-500 dark:text-zinc-400">Amount Sent</dt>
                <dd className="font-mono font-bold text-zinc-900 dark:text-white">
                  {paymentResult.amount} {paymentResult.assetCode}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Recipient</dt>
                <dd className="font-mono text-zinc-900 dark:text-white break-all">
                  {paymentResult.recipient}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-zinc-500 dark:text-zinc-400">Network Fee</dt>
                <dd className="font-mono text-zinc-900 dark:text-white">
                  {paymentResult.feeXlm} XLM
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Transaction Reference
                </dt>
                <dd
                  data-testid="payment-result-tx-hash"
                  className="font-mono text-zinc-900 dark:text-white"
                >
                  {paymentResult.txHash}
                </dd>
              </div>
            </dl>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:justify-between dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleSendAnother}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send Another Payment
            </Button>

            <Link
              href={transactionHref}
              data-testid="view-transaction-link"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-6 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View Transaction Details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
