"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown } from "lucide-react";
import { apiGet, apiPost, processTransactionEvents } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

type AgreementMode = "payroll" | "escrow";
type EscrowPaymentType = "time" | "milestone";

function formatUnitsShort(raw: string | null, decimals: number) {
  if (!raw) return "0";
  try {
    const v = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = v / base;
    const frac = v % base;
    if (decimals === 0) return whole.toLocaleString();
    const fracStr = frac
      .toString()
      .padStart(decimals, "0")
      .slice(0, 2)
      .replace(/0+$/, "");
    return fracStr.length ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
  } catch {
    return raw;
  }
}

function TokenSelector({
  selectedTokenKey,
  onTokenChange,
  supportedTokens,
  balance,
  balanceError,
}: {
  selectedTokenKey: string;
  onTokenChange: (key: string) => void;
  supportedTokens: Array<{ key: string; label: string; icon: string; color: string; address: string; decimals: number }>;
  balance: string | null;
  balanceError: string | null;
}) {
  const selectedToken = supportedTokens.find((t) => t.key === selectedTokenKey) ?? supportedTokens[0];
  const isLoading = !balanceError && balance === null;
  return (
    <div className="space-y-2">
      <Label className="text-white">Token</Label>
      <div className="rounded-xl border border-[#242428] bg-black/30 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#A0A0A0]">Balance:</span>
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A0A0A0]" />
          ) : (
            <span className="text-white">
              {balanceError
                ? "—"
                : `${formatUnitsShort(balance, selectedToken?.decimals ?? 6)} ${
                    selectedToken?.key ?? ""
                  }`}
            </span>
          )}
          {balanceError ? (
            <span className="text-xs text-[#EB6945] ml-2">{balanceError}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#2C2C2C] bg-[#121212] px-3 py-2 hover:bg-[#1A1A1A] transition"
              >
                {selectedToken?.icon ? (
                  <Image
                    src={selectedToken.icon}
                    alt={selectedToken.key}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: selectedToken?.color ?? "#2D2D2D" }}
                  >
                    <span className="text-[10px] font-bold text-black">
                      {selectedToken?.key?.slice(0, 1) ?? "T"}
                    </span>
                  </span>
                )}
                <span className="text-white text-sm font-semibold">
                  {selectedToken?.key ?? "Token"}
                </span>
                <ChevronDown className="h-4 w-4 text-[#A0A0A0]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0D0D0D] border border-[#2D2D2D] text-white min-w-[240px]">
              {supportedTokens.map((t) => {
                const disabled = !t.address;
                return (
                  <DropdownMenuItem
                    key={t.key}
                    disabled={disabled}
                    onSelect={() => onTokenChange(t.key)}
                    className="cursor-pointer focus:bg-[#111] focus:text-white data-[disabled]:opacity-50"
                  >
                    {t.icon ? (
                      <Image
                        src={t.icon}
                        alt={t.key}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-semibold">{t.key}</span>
                      <span className="text-xs text-[#A0A0A0]">
                        {t.label}
                        {disabled ? " · Not configured" : ""}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

interface CreateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAgreementModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAgreementModalProps) {
  const { address, sessionToken, isExecuting, isVerified, executeCall } = useWallet();
  const { showToast } = useToast();
  
  const [agreementDefault, setAgreementDefault] = useState<string>("");
  const [agreementInitialized, setAgreementInitialized] = useState<boolean | null>(null);
  
  // Supported tokens
  const supportedTokens = useMemo(() => {
    const DEFAULT_USDC = "0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080";
    const DEFAULT_USDT = "0x02ab8758891e84b968ff11361789070c6b1af2df618d6d2f4a78b0757573c6eb";
    const DEFAULT_STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

    const usdc = (process.env.NEXT_PUBLIC_TOKEN_USDC ?? DEFAULT_USDC).trim();
    const usdt = (process.env.NEXT_PUBLIC_TOKEN_USDT ?? DEFAULT_USDT).trim();
    const strk = (process.env.NEXT_PUBLIC_TOKEN_STRK ?? DEFAULT_STRK).trim();
    return [
      {
        key: "USDC",
        label: "USD Coin",
        decimals: 6,
        address: usdc,
        color: "#2775CA",
        icon: "/usdc-logo.png",
      },
      {
        key: "USDT",
        label: "Tether USD",
        decimals: 6,
        address: usdt,
        color: "#26A17B",
        icon: "/usdt.svg",
      },
      {
        key: "STRK",
        label: "Starknet",
        decimals: 18,
        address: strk,
        color: "#8B5CF6",
        icon: "/starknet.png",
      },
    ];
  }, []);

  // Create Agreement state
  const [agreementMode, setAgreementMode] = useState<AgreementMode>("escrow");
  const [escrowPaymentType, setEscrowPaymentType] = useState<EscrowPaymentType>("time");
  const [agreementTokenKey, setAgreementTokenKey] = useState<string>("STRK");
  const [agreementTokenBalance, setAgreementTokenBalance] = useState<string | null>(null);
  const [agreementTokenBalanceError, setAgreementTokenBalanceError] = useState<string | null>(null);
  const [escrowContributor, setEscrowContributor] = useState("");
  const [amountPerPeriod, setAmountPerPeriod] = useState("");
  const [periodSeconds, setPeriodSeconds] = useState("2592000");
  const [numPeriods, setNumPeriods] = useState("1");
  const [payrollPeriodSeconds, setPayrollPeriodSeconds] = useState("2592000");
  const [payrollNumPeriods, setPayrollNumPeriods] = useState("1");
  const [createAgreementError, setCreateAgreementError] = useState<string | null>(null);
  const [createAgreementTx, setCreateAgreementTx] = useState<string | null>(null);
  
  // Form validation errors
  const [createFormErrors, setCreateFormErrors] = useState<{
    contributor?: string;
    amountPerPeriod?: string;
    periodSeconds?: string;
    numPeriods?: string;
    payrollPeriodSeconds?: string;
    payrollNumPeriods?: string;
  }>({});

  useEffect(() => {
    void apiGet<{ address: string }>("/agreement/defaults")
      .then((d) => setAgreementDefault(d.address))
      .catch(() => {});
  }, []);

  // Check if agreement is initialized
  useEffect(() => {
    if (!agreementDefault) {
      setAgreementInitialized(null);
      return;
    }
    setAgreementInitialized(null);
    
    void apiGet<{ initialized: boolean; escrow: string | null; error?: string }>(
      `/agreement/${agreementDefault}/is_initialized`,
    )
      .then((d) => {
        setAgreementInitialized(d.initialized);
      })
      .catch((err) => {
        setAgreementInitialized(false);
      });
  }, [agreementDefault]);

  // Fetch token balance for agreement creation
  useEffect(() => {
    if (!address || !isOpen) return;
    const token = supportedTokens.find((t) => t.key === agreementTokenKey);
    if (!token?.address) {
      setAgreementTokenBalance(null);
      setAgreementTokenBalanceError("Token not configured");
      return;
    }
    // Clear balance immediately when token changes to show loading state
    setAgreementTokenBalance(null);
    setAgreementTokenBalanceError(null);
    void apiGet<{ balance: string }>(`/token/${token.address}/balance/${address}`)
      .then((d) => setAgreementTokenBalance(d.balance))
      .catch(() => {
        setAgreementTokenBalance(null);
        setAgreementTokenBalanceError("Unable to fetch balance");
      });
  }, [address, agreementTokenKey, supportedTokens, isOpen]);

  const requireAuth = () => {
    if (!address || !sessionToken) {
      throw new Error("Please connect & verify your wallet first.");
    }
    return { address, sessionToken };
  };

  // Validation helpers
  const validateAddress = (address: string): string | undefined => {
    if (!address || address.trim() === "") {
      return "Address is required";
    }
    if (!address.startsWith("0x")) {
      return "Address must start with 0x";
    }
    if (address.length < 10) {
      return "Invalid address format";
    }
    return undefined;
  };

  const validateNumber = (value: string, fieldName: string, min?: number): string | undefined => {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return undefined;
  };

  const validatePositiveInteger = (value: string, fieldName: string): string | undefined => {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive integer`;
    }
    return undefined;
  };

  const executeAction = async (endpoint: string, body: any, setError: (e: string | null) => void, setTx: (t: string | null) => void): Promise<string | null> => {
    setError(null);
    setTx(null);
    try {
      if (!isVerified || !sessionToken) {
        throw new Error("Wallet is not verified. Please verify your wallet first by connecting it.");
      }
      
      const { address: wallet_address, sessionToken: session_token } = requireAuth();
      const prepared = await apiPost<{ call: any }>(endpoint, {
        wallet_address,
        session_token,
        ...body,
      });
      
      if (!prepared?.call) {
        throw new Error("Backend did not return a call object");
      }
      const tx = await executeCall(prepared.call);
      if (tx?.transaction_hash) {
        setTx(tx.transaction_hash);
        processTransactionEvents(tx.transaction_hash).catch(() => {});
        return tx.transaction_hash;
      }
      throw new Error("Transaction failed. Please try again.");
    } catch (e: any) {
      const { getWalletErrorMessage } = await import("@/utils/wallet-error-handler");
      let errorMsg = getWalletErrorMessage(e);
      setError(errorMsg);
      return null;
    }
  };

  const handleCreateAgreement = async () => {
    try {
      setCreateAgreementError(null);
      setCreateAgreementTx(null);
      setCreateFormErrors({});
      
      const { address: wallet_address, sessionToken: session_token } = requireAuth();
      if (!agreementDefault) throw new Error("Agreement address not loaded.");
      if (agreementInitialized === false) {
        throw new Error("Agreement contract must be initialized before creating agreements.");
      }
      const token = supportedTokens.find((t) => t.key === agreementTokenKey);
      if (!token?.address) throw new Error("Token not configured.");

      // Validate form fields
      const errors: typeof createFormErrors = {};
      let hasErrors = false;

      if (agreementMode === "payroll") {
        const periodError = validatePositiveInteger(payrollPeriodSeconds, "Period (seconds)");
        const numPeriodsError = validatePositiveInteger(payrollNumPeriods, "Number of periods");
        if (periodError) {
          errors.payrollPeriodSeconds = periodError;
          hasErrors = true;
        }
        if (numPeriodsError) {
          errors.payrollNumPeriods = numPeriodsError;
          hasErrors = true;
        }
      } else {
        const contributorError = validateAddress(escrowContributor);
        if (contributorError) {
          errors.contributor = contributorError;
          hasErrors = true;
        }
        
        if (escrowPaymentType === "time") {
          const amountError = validateNumber(amountPerPeriod, "Amount per period", 1);
          const periodError = validatePositiveInteger(periodSeconds, "Period (seconds)");
          const numPeriodsError = validatePositiveInteger(numPeriods, "Number of periods");
          if (amountError) {
            errors.amountPerPeriod = amountError;
            hasErrors = true;
          }
          if (periodError) {
            errors.periodSeconds = periodError;
            hasErrors = true;
          }
          if (numPeriodsError) {
            errors.numPeriods = numPeriodsError;
            hasErrors = true;
          }
        }
      }

      if (hasErrors) {
        setCreateFormErrors(errors);
        return;
      }

      let endpoint: string;
      let body: any;

      if (agreementMode === "payroll") {
        endpoint = `/prepare/agreement/${agreementDefault}/create_payroll_agreement`;
        body = {
          employer: wallet_address,
          token: token.address,
          period_seconds: payrollPeriodSeconds,
          num_periods: parseInt(payrollNumPeriods),
        };
      } else if (escrowPaymentType === "time") {
        endpoint = `/prepare/agreement/${agreementDefault}/create_time_based_agreement`;
        body = {
          employer: wallet_address,
          contributor: escrowContributor,
          token: token.address,
          amount_per_period: amountPerPeriod,
          period_seconds: periodSeconds,
          num_periods: parseInt(numPeriods),
        };
      } else {
        endpoint = `/prepare/agreement/${agreementDefault}/create_milestone_agreement`;
        body = {
          employer: wallet_address,
          contributor: escrowContributor,
          token: token.address,
        };
      }

      const txHash = await executeAction(endpoint, body, setCreateAgreementError, setCreateAgreementTx);
      
      if (txHash) {
        // Clear form
        setEscrowContributor("");
        setAmountPerPeriod("");
        setPeriodSeconds("2592000");
        setNumPeriods("1");
        setPayrollPeriodSeconds("2592000");
        setPayrollNumPeriods("1");
        
        showToast("Agreement created", "Transaction completed successfully.", "success");
        onSuccess();
        onClose();
      }
    } catch (e: any) {
      setCreateAgreementError(e?.message || "Failed to create agreement");
      showToast("Creation failed", e?.message || "Please try again.", "error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0c1d] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Create New Agreement</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
            Create a new payroll or escrow agreement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {agreementInitialized === false && (
            <div className="p-3 rounded-md bg-yellow-900/20 border border-yellow-700/50">
              <div className="text-sm text-yellow-400">
                <strong>⚠️ Agreement Not Initialized:</strong> The WorkAgreement contract needs to be initialized once before creating agreements.
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Agreement Mode</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAgreementMode("payroll")}
                className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                  agreementMode === "payroll"
                    ? "bg-white text-black border-white shadow"
                    : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                }`}
              >
                Payroll
              </button>
              <button
                type="button"
                onClick={() => setAgreementMode("escrow")}
                className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                  agreementMode === "escrow"
                    ? "bg-white text-black border-white shadow"
                    : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                }`}
              >
                Escrow
              </button>
            </div>
          </div>

          <TokenSelector
            selectedTokenKey={agreementTokenKey}
            onTokenChange={setAgreementTokenKey}
            supportedTokens={supportedTokens}
            balance={agreementTokenBalance}
            balanceError={agreementTokenBalanceError}
          />

          {agreementMode === "payroll" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">
                    Period (seconds) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={payrollPeriodSeconds}
                    onChange={(e) => {
                      setPayrollPeriodSeconds(e.target.value);
                      if (createFormErrors.payrollPeriodSeconds) {
                        setCreateFormErrors(prev => ({ ...prev, payrollPeriodSeconds: undefined }));
                      }
                    }}
                    placeholder="2592000"
                    className={`bg-transparent border-[#242428] text-white ${
                      createFormErrors.payrollPeriodSeconds ? "border-red-500" : ""
                    }`}
                  />
                  {createFormErrors.payrollPeriodSeconds && (
                    <p className="text-sm text-red-400">{createFormErrors.payrollPeriodSeconds}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white">
                    Number of periods <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={payrollNumPeriods}
                    onChange={(e) => {
                      setPayrollNumPeriods(e.target.value);
                      if (createFormErrors.payrollNumPeriods) {
                        setCreateFormErrors(prev => ({ ...prev, payrollNumPeriods: undefined }));
                      }
                    }}
                    placeholder="1"
                    className={`bg-transparent border-[#242428] text-white ${
                      createFormErrors.payrollNumPeriods ? "border-red-500" : ""
                    }`}
                  />
                  {createFormErrors.payrollNumPeriods && (
                    <p className="text-sm text-red-400">{createFormErrors.payrollNumPeriods}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-white">Payment Type</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEscrowPaymentType("time")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      escrowPaymentType === "time"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    Time-based
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscrowPaymentType("milestone")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      escrowPaymentType === "milestone"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    Milestone
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Contributor Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={escrowContributor}
                  onChange={(e) => {
                    setEscrowContributor(e.target.value);
                    if (createFormErrors.contributor) {
                      setCreateFormErrors(prev => ({ ...prev, contributor: undefined }));
                    }
                  }}
                  placeholder="0x..."
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    createFormErrors.contributor ? "border-red-500" : ""
                  }`}
                />
                {createFormErrors.contributor && (
                  <p className="text-sm text-red-400">{createFormErrors.contributor}</p>
                )}
              </div>

              {escrowPaymentType === "time" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">
                      Amount per period <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={amountPerPeriod}
                      onChange={(e) => {
                        setAmountPerPeriod(e.target.value);
                        if (createFormErrors.amountPerPeriod) {
                          setCreateFormErrors(prev => ({ ...prev, amountPerPeriod: undefined }));
                        }
                      }}
                      placeholder="1000000"
                      className={`bg-transparent border-[#242428] text-white font-mono ${
                        createFormErrors.amountPerPeriod ? "border-red-500" : ""
                      }`}
                    />
                    {createFormErrors.amountPerPeriod && (
                      <p className="text-sm text-red-400">{createFormErrors.amountPerPeriod}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">
                      Period (seconds) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={periodSeconds}
                      onChange={(e) => {
                        setPeriodSeconds(e.target.value);
                        if (createFormErrors.periodSeconds) {
                          setCreateFormErrors(prev => ({ ...prev, periodSeconds: undefined }));
                        }
                      }}
                      placeholder="2592000"
                      className={`bg-transparent border-[#242428] text-white font-mono ${
                        createFormErrors.periodSeconds ? "border-red-500" : ""
                      }`}
                    />
                    {createFormErrors.periodSeconds && (
                      <p className="text-sm text-red-400">{createFormErrors.periodSeconds}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">
                      Number of periods <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={numPeriods}
                      onChange={(e) => {
                        setNumPeriods(e.target.value);
                        if (createFormErrors.numPeriods) {
                          setCreateFormErrors(prev => ({ ...prev, numPeriods: undefined }));
                        }
                      }}
                      placeholder="1"
                      className={`bg-transparent border-[#242428] text-white font-mono ${
                        createFormErrors.numPeriods ? "border-red-500" : ""
                      }`}
                    />
                    {createFormErrors.numPeriods && (
                      <p className="text-sm text-red-400">{createFormErrors.numPeriods}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {createAgreementError && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-3">
              {createAgreementError}
            </div>
          )}

          {createAgreementTx && (
            <div className="text-sm text-[#A0A0A0]">
              <div>
                Submitted: <span className="text-white break-all">{createAgreementTx}</span>
              </div>
              <a
                href={`https://sepolia.voyager.online/tx/${createAgreementTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#598EFF] hover:underline text-xs"
              >
                View on explorer
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!address || !sessionToken || isExecuting || agreementInitialized === false}
            onClick={handleCreateAgreement}
            className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Agreement...
              </>
            ) : (
              "Create Agreement"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

