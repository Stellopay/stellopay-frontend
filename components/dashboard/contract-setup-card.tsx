"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  ChevronDown,
  Coins,
  Copy,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Users,
  FileText,
  Plus,
  X,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  XCircle,
  Gavel,
  Clock,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPost, processTransactionEvents } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";
import { useToast } from "@/components/ui/toast";

function shortHex(addr: string) {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

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

function TxRow({ txHash }: { txHash: string }) {
  const url = `https://sepolia.voyager.online/tx/${txHash}`;
  return (
    <div className="text-sm text-[#A0A0A0]">
      <div>
        Submitted: <span className="text-white break-all">{txHash}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-[#598EFF] hover:underline text-xs"
      >
        View on explorer
      </a>
    </div>
  );
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
      <Label>Token</Label>
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

function useAuthHint() {
  const { address, sessionToken, isVerified, isConnecting, isVerifying } = useWallet();
  return useMemo(() => {
    if (isConnecting) return "Connecting wallet…";
    if (isVerifying) return "Verifying wallet with backend…";
    if (!address) return "Connect a wallet to continue.";
    if (!isVerified || !sessionToken) return "Wallet connected, but not verified with backend.";
    return null;
  }, [address, isConnecting, isVerifying, isVerified, sessionToken]);
}

type AgreementMode = "payroll" | "escrow";
type EscrowPaymentType = "time" | "milestone";

interface AgreementDetails {
  agreement_id: string;
  employer?: string;
  contributor?: string;
  token?: string;
  escrow?: string;
  total_amount?: string;
  paid_amount?: string;
  status?: number;
  mode?: number;
  dispute_status?: number;
  employee_count?: number;
  is_grace_period_active?: boolean;
}

export default function ContractSetupCard() {
  const { address, sessionToken, isExecuting, isVerified, executeCall } = useWallet();
  const authHint = useAuthHint();
  const { showToast } = useToast();
  
  // Don't show toast for wallet errors here - let connect-wallet-button handle it
  // This component only shows toasts for its own specific errors
  const [escrowCopied, setEscrowCopied] = useState(false);
  const [agreementCopied, setAgreementCopied] = useState(false);

  const [escrowDefault, setEscrowDefault] = useState("");
  const [agreementDefault, setAgreementDefault] = useState("");
  const [escrowInitialized, setEscrowInitialized] = useState<boolean | null>(null);
  const [escrowToken, setEscrowToken] = useState<string | null>(null);
  const [agreementInitialized, setAgreementInitialized] = useState<boolean | null>(null);
  const [agreementEscrow, setAgreementEscrow] = useState<string | null>(null);
  
  // Initialize Agreement
  const [initAgreementOpen, setInitAgreementOpen] = useState(false);
  const [initAgreementEscrow, setInitAgreementEscrow] = useState("");
  const [initAgreementArbiter, setInitAgreementArbiter] = useState("");
  const [initAgreementError, setInitAgreementError] = useState<string | null>(null);
  const [initAgreementTx, setInitAgreementTx] = useState<string | null>(null);
  const [initAgreementFormErrors, setInitAgreementFormErrors] = useState<{
    escrow?: string;
    arbiter?: string;
  }>({});
  
  const [initEscrowFormErrors, setInitEscrowFormErrors] = useState<{
    token?: string;
  }>({});

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


  // Initialize escrow
  const [initEscrowOpen, setInitEscrowOpen] = useState(false);
  const [selectedTokenKey, setSelectedTokenKey] = useState<string>("STRK");
  const selectedToken = useMemo(
    () => supportedTokens.find((t) => t.key === selectedTokenKey) ?? supportedTokens[0],
    [supportedTokens, selectedTokenKey],
  );
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<string | null>(null);
  const [selectedTokenBalanceError, setSelectedTokenBalanceError] = useState<string | null>(null);
  const [initEscrowError, setInitEscrowError] = useState<string | null>(null);
  const [initEscrowTx, setInitEscrowTx] = useState<string | null>(null);

  // Create Agreement
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

  // Fund Agreement
  const [fundAgreementId, setFundAgreementId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundTx, setFundTx] = useState<string | null>(null);
  const [fundFormErrors, setFundFormErrors] = useState<{
    agreementId?: string;
    amount?: string;
  }>({});

  // Manage Agreement (pause, resume, cancel, etc.)
  const [manageAgreementId, setManageAgreementId] = useState("");
  const [manageAction, setManageAction] = useState<"pause" | "resume" | "cancel" | "finalize_grace_period">("pause");
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageTx, setManageTx] = useState<string | null>(null);
  const [manageFormErrors, setManageFormErrors] = useState<{
    agreementId?: string;
  }>({});

  // Add Employee
  const [addEmployeeAgreementId, setAddEmployeeAgreementId] = useState("");
  const [addEmployeeAddress, setAddEmployeeAddress] = useState("");
  const [addEmployeeSalary, setAddEmployeeSalary] = useState("");
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);
  const [addEmployeeTx, setAddEmployeeTx] = useState<string | null>(null);
  const [addEmployeeFormErrors, setAddEmployeeFormErrors] = useState<{
    agreementId?: string;
    address?: string;
    salary?: string;
  }>({});

  // Add Milestone
  const [addMilestoneAgreementId, setAddMilestoneAgreementId] = useState("");
  const [addMilestoneAmount, setAddMilestoneAmount] = useState("");
  const [addMilestoneError, setAddMilestoneError] = useState<string | null>(null);
  const [addMilestoneTx, setAddMilestoneTx] = useState<string | null>(null);
  const [addMilestoneFormErrors, setAddMilestoneFormErrors] = useState<{
    agreementId?: string;
    amount?: string;
  }>({});

  // Approve Milestone
  const [approveMilestoneAgreementId, setApproveMilestoneAgreementId] = useState("");
  const [approveMilestoneId, setApproveMilestoneId] = useState("");
  const [approveMilestoneError, setApproveMilestoneError] = useState<string | null>(null);
  const [approveMilestoneTx, setApproveMilestoneTx] = useState<string | null>(null);
  const [approveMilestoneFormErrors, setApproveMilestoneFormErrors] = useState<{
    agreementId?: string;
    milestoneId?: string;
  }>({});

  // Activate
  const [activateAgreementId, setActivateAgreementId] = useState("");
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateTx, setActivateTx] = useState<string | null>(null);
  const [activateFormErrors, setActivateFormErrors] = useState<{
    agreementId?: string;
  }>({});

  // Dispute
  const [disputeAgreementId, setDisputeAgreementId] = useState("");
  const [disputeAction, setDisputeAction] = useState<"raise" | "resolve">("raise");
  const [disputePayContributor, setDisputePayContributor] = useState("");
  const [disputeRefundEmployer, setDisputeRefundEmployer] = useState("");
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeTx, setDisputeTx] = useState<string | null>(null);
  const [disputeFormErrors, setDisputeFormErrors] = useState<{
    agreementId?: string;
    payContributor?: string;
    refundEmployer?: string;
  }>({});

  const [activeTab, setActiveTab] = useState("fund");

  useEffect(() => {
    void Promise.all([
      apiGet<{ address: string }>("/escrow/defaults").then((d) => setEscrowDefault(d.address)),
      apiGet<{ address: string }>("/agreement/defaults").then((d) =>
        setAgreementDefault(d.address),
      ),
    ]).catch(() => {});
  }, []);

  // Fetch token balance for escrow initialization
  useEffect(() => {
    if (!initEscrowOpen || !address) return;
    if (!selectedToken?.address) {
    setSelectedTokenBalance(null);
      setSelectedTokenBalanceError("Token not configured");
      return;
    }
    setSelectedTokenBalanceError(null);
    void apiGet<{ balance: string }>(`/token/${selectedToken.address}/balance/${address}`)
      .then((d) => setSelectedTokenBalance(d.balance))
      .catch(() => {
        setSelectedTokenBalance(null);
        setSelectedTokenBalanceError("Unable to fetch balance");
      });
  }, [initEscrowOpen, address, selectedToken?.address]);

  // Fetch token balance for agreement creation
  useEffect(() => {
    if (!address) return;
    const token = supportedTokens.find((t) => t.key === agreementTokenKey);
    if (!token?.address) {
      setAgreementTokenBalance(null);
      setAgreementTokenBalanceError("Token not configured");
      return;
    }
    setAgreementTokenBalanceError(null);
    void apiGet<{ balance: string }>(`/token/${token.address}/balance/${address}`)
      .then((d) => setAgreementTokenBalance(d.balance))
      .catch(() => {
        setAgreementTokenBalance(null);
        setAgreementTokenBalanceError("Unable to fetch balance");
      });
  }, [address, agreementTokenKey, supportedTokens]);

  // Check if escrow is initialized
  useEffect(() => {
    if (!escrowDefault) {
      setEscrowInitialized(null);
      setEscrowToken(null);
      return;
    }
    setEscrowInitialized(null);
    setEscrowToken(null);
    
    void apiGet<{ initialized: boolean; token: string | null; error?: string }>(
      `/escrow/${escrowDefault}/is_initialized`,
    )
      .then((d) => {
        setEscrowInitialized(d.initialized);
        setEscrowToken(d.token);
      })
      .catch((err) => {
        setEscrowInitialized(false);
        setEscrowToken(null);
      });
  }, [escrowDefault]);

  // Check if agreement is initialized
  useEffect(() => {
    if (!agreementDefault) {
      setAgreementInitialized(null);
      setAgreementEscrow(null);
      return;
    }
    setAgreementInitialized(null);
    setAgreementEscrow(null);
    
    void apiGet<{ initialized: boolean; escrow: string | null; error?: string }>(
      `/agreement/${agreementDefault}/is_initialized`,
    )
      .then((d) => {
        setAgreementInitialized(d.initialized);
        setAgreementEscrow(d.escrow);
      })
      .catch((err) => {
        setAgreementInitialized(false);
        setAgreementEscrow(null);
      });
  }, [agreementDefault]);

  useEffect(() => {
    if (!initAgreementOpen) return;
    setInitAgreementError(null);
    setInitAgreementTx(null);
    setInitAgreementEscrow(escrowDefault);
    // Arbiter can be the same as escrow or a separate address - defaulting to escrow for now
    setInitAgreementArbiter(escrowDefault);
  }, [initAgreementOpen, escrowDefault]);

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
      // Check if wallet is verified before making the request
      if (!isVerified || !sessionToken) {
        throw new Error("Wallet is not verified. Please verify your wallet first by connecting it.");
      }
      
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
      const prepared = await apiPost<{ call: any }>(endpoint, {
        wallet_address,
        session_token,
        ...body,
      });
      
      // Check for "Invalid session" error in response
      if (prepared && typeof prepared === 'object' && 'error' in prepared) {
        const errorResponse = prepared as { error?: string };
        if (errorResponse.error?.toLowerCase().includes('invalid session')) {
          throw new Error("Session expired. Please reconnect and verify your wallet.");
        }
      }
      
      if (!prepared?.call) {
        throw new Error("Backend did not return a call object");
      }
      const tx = await executeCall(prepared.call);
      if (tx?.transaction_hash) {
        setTx(tx.transaction_hash);
        // Process events in the background (don't wait for it)
        processTransactionEvents(tx.transaction_hash).catch(() => {
          // Silently fail - this is a background operation
        });
        return tx.transaction_hash;
      }
      // If no transaction hash, there was an error
      // Error toast is shown by connect-wallet-button component
      const errorMsg = "Transaction failed. Please try again.";
      setError(errorMsg);
      return null;
    } catch (e: any) {
      // Catch any other errors (like API errors)
      const { getWalletErrorMessage } = await import("@/utils/wallet-error-handler");
      let errorMsg = getWalletErrorMessage(e);
      
      setError(errorMsg);
      showToast("Action failed", errorMsg, "error");
      console.error("[executeAction] Error:", e);
      return null;
    }
  };

  const statusLabels: Record<number, string> = {
    0: "Created",
    1: "Active",
    2: "Paused",
    3: "Cancelled",
    4: "Completed",
    5: "Disputed",
  };

  const modeLabels: Record<number, string> = {
    0: "Escrow",
    1: "Payroll",
  };

  const disputeStatusLabels: Record<number, string> = {
    0: "None",
    1: "Raised",
    2: "Resolved",
  };

  return (
    <div className="max-w-full p-4 rounded-xl border border-[#2D2D2D] bg-[#0D0D0D80]">
      <div className="w-full flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
          <ShieldCheck className="w-5 h-5 text-[#E5E5E5]" />
        </div>
        <h1 className="font-[Inter] text-base leading-[145%] align-middle">
          Contract Setup & Management
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 mb-4 text-sm text-[#A0A0A0]">
        <div className="flex items-center gap-2">
          <span>Escrow:</span>
          <span className="text-white">{shortHex(escrowDefault)}</span>
          {escrowDefault ? (
            <>
              <button
                type="button"
                onClick={() =>
                  copyToClipboardWithTimeout(escrowDefault, setEscrowCopied, 1200)
                }
                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#2E2E2E] bg-[#121212] p-1 hover:bg-[#1A1A1A]"
              >
                <Copy className="w-4 h-4 text-[#E5E5E5]" />
              </button>
              {escrowCopied ? (
                <span className="text-xs text-[#E5E5E5]">Copied</span>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span>Agreement:</span>
          <span className="text-white">{shortHex(agreementDefault)}</span>
          {agreementDefault ? (
            <>
              <button
                type="button"
                onClick={() =>
                  copyToClipboardWithTimeout(agreementDefault, setAgreementCopied, 1200)
                }
                className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#2E2E2E] bg-[#121212] p-1 hover:bg-[#1A1A1A]"
              >
                <Copy className="w-4 h-4 text-[#E5E5E5]" />
              </button>
              {agreementCopied ? (
                <span className="text-xs text-[#E5E5E5]">Copied</span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {escrowInitialized === false && (
          <div className="p-3 rounded-md bg-yellow-900/20 border border-yellow-700/50">
            <div className="text-sm text-yellow-400">
              <strong>⚠️ Escrow Not Initialized:</strong> The escrow contract needs to be initialized once before creating agreements.
            </div>
          </div>
        )}
        
        {agreementInitialized === false && (
          <div className="p-3 rounded-md bg-yellow-900/20 border border-yellow-700/50">
            <div className="text-sm text-yellow-400">
              <strong>⚠️ Agreement Not Initialized:</strong> The WorkAgreement contract needs to be initialized once before creating agreements.
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-4 bg-[#0D0D0D] border border-[#2D2D2D] p-1 rounded-md h-auto">
          <TabsTrigger 
            value="fund"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Fund
          </TabsTrigger>
          <TabsTrigger 
            value="activate"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Activate
          </TabsTrigger>
          <TabsTrigger 
            value="manage"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Manage
          </TabsTrigger>
          <TabsTrigger 
            value="employees"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Employees
          </TabsTrigger>
          <TabsTrigger 
            value="milestones"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Milestones
          </TabsTrigger>
          <TabsTrigger 
            value="disputes"
            className="data-[state=active]:bg-[#1a0c1d] data-[state=active]:text-white data-[state=active]:border-white text-[#A0A0A0] border border-transparent px-3 py-2 text-sm font-medium transition-colors hover:text-white cursor-pointer"
          >
            Disputes
          </TabsTrigger>
        </TabsList>

        {/* Manage Tab - Continue in next part due to length */}
        <TabsContent value="manage" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Create New Agreement</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Create a new payroll or escrow agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

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

                  {escrowPaymentType === "time" ? (
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
            ) : null}
                </>
              )}

              {createAgreementError ? (
                <div className="text-sm text-red-400">{createAgreementError}</div>
              ) : null}
              {createAgreementTx ? <TxRow txHash={createAgreementTx} /> : null}
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || agreementInitialized === false}
                onClick={async () => {
                  try {
                    setCreateAgreementError(null);
                    setCreateAgreementTx(null);
                    setCreateFormErrors({});
                    
                    const { address: wallet_address, sessionToken: session_token } = requireAuth();
                    if (!agreementDefault) throw new Error("Agreement address not loaded.");
                    if (agreementInitialized === false) {
                      throw new Error("Agreement contract must be initialized before creating agreements. Please use the 'Initialize Agreement' button below.");
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
                    let agreementType: string;

                    if (agreementMode === "payroll") {
                      endpoint = `/prepare/agreement/${agreementDefault}/create_payroll_agreement`;
                      body = {
                        employer: wallet_address,
                        token: token.address,
                        period_seconds: payrollPeriodSeconds,
                        num_periods: parseInt(payrollNumPeriods),
                      };
                      agreementType = "Payroll";
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
                      agreementType = "Time-based Escrow";
                    } else {
                      endpoint = `/prepare/agreement/${agreementDefault}/create_milestone_agreement`;
                      body = {
                        employer: wallet_address,
                        contributor: escrowContributor,
                        token: token.address,
                      };
                      agreementType = "Milestone Escrow";
                    }

                    const txHash = await executeAction(endpoint, body, setCreateAgreementError, setCreateAgreementTx);
                    
                    // Success - get agreement ID from transaction and clear form
                    if (txHash && agreementDefault) {
                      try {
                        // Get agreement ID from transaction receipt
                        const agreementIdResponse = await apiPost<{ agreement_id: string }>(
                          `/agreement/${agreementDefault}/get_agreement_id_from_tx`,
                          { tx_hash: txHash }
                        );
                        
                        const agreementId = agreementIdResponse.agreement_id;
                        
                        setEscrowContributor("");
                        setAmountPerPeriod("");
                        setPeriodSeconds("2592000");
                        setNumPeriods("1");
                        setPayrollPeriodSeconds("2592000");
                        setPayrollNumPeriods("1");
                        
                        showToast(
                          "Agreement created",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      } catch (e) {
                        // If we can't get agreement ID, still show success
                        setEscrowContributor("");
                        setAmountPerPeriod("");
                        setPeriodSeconds("2592000");
                        setNumPeriods("1");
                        setPayrollPeriodSeconds("2592000");
                        setPayrollNumPeriods("1");
                        
                        showToast(
                          "Agreement created",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      }
                    }
                  } catch (e: any) {
                    setCreateAgreementError(e?.message || "Failed to create agreement");
                    showToast("Creation failed", e?.message || "Please try again.", "error");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
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
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Manage Tab - Continue in next part due to length */}
        <TabsContent value="manage" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Manage Agreement</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Pause, resume, cancel, or finalize grace period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">
                  Agreement ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={manageAgreementId}
                  onChange={(e) => {
                    setManageAgreementId(e.target.value);
                    if (manageFormErrors.agreementId) {
                      setManageFormErrors(prev => ({ ...prev, agreementId: undefined }));
                    }
                  }}
                  placeholder="e.g. 1"
                  className={`bg-transparent border-[#242428] text-white ${
                    manageFormErrors.agreementId ? "border-red-500" : ""
                  }`}
                />
                {manageFormErrors.agreementId && (
                  <p className="text-sm text-red-400">{manageFormErrors.agreementId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">Action</Label>
                <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                    onClick={() => setManageAction("pause")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      manageAction === "pause"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <Pause className="w-4 h-4 inline mr-2" />
                    Pause
              </button>
              <button
                type="button"
                    onClick={() => setManageAction("resume")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      manageAction === "resume"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    Resume
              </button>
                  <button
                    type="button"
                    onClick={() => setManageAction("cancel")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      manageAction === "cancel"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageAction("finalize_grace_period")}
                    className={`px-4 py-2 rounded-md border cursor-pointer transition ${
                      manageAction === "finalize_grace_period"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Finalize Grace
                  </button>
              </div>
            </div>

              {manageError ? <div className="text-sm text-red-400">{manageError}</div> : null}
              {manageTx ? <TxRow txHash={manageTx} /> : null}
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || !manageAgreementId}
                onClick={async () => {
                  try {
                    setManageError(null);
                    setManageFormErrors({});
                    
                    // Validate
                    const agreementIdError = validatePositiveInteger(manageAgreementId, "Agreement ID");
                    if (agreementIdError) {
                      setManageFormErrors({ agreementId: agreementIdError });
                      return;
                    }
                    
                    const actionName = manageAction.replace("_", " ");
                    const txHash = await executeAction(
                      `/prepare/agreement/${agreementDefault}/${manageAction}`,
                      { agreement_id: manageAgreementId },
                      setManageError,
                      setManageTx
                    );
                    if (txHash) {
                      setManageAgreementId("");
                      showToast(
                        "Action successful",
                        `Transaction completed successfully.`,
                        "success"
                      );
                    }
                  } catch (e: any) {
                    setManageError(e?.message || "Failed to execute action");
                    showToast("Action failed", e?.message || "Please try again.", "error");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {`${manageAction.replace("_", " ")}...`}
                  </>
                ) : (
                  `Execute ${manageAction.replace("_", " ")}`
                )}
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Fund Tab */}
        <TabsContent value="fund" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Fund Agreement</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Deposit tokens to an agreement. First-time funding requires token approval - see instructions below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">
                  Agreement ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={fundAgreementId}
                  onChange={(e) => {
                    setFundAgreementId(e.target.value);
                    if (fundFormErrors.agreementId) {
                      setFundFormErrors(prev => ({ ...prev, agreementId: undefined }));
                    }
                  }}
                  placeholder="e.g. 1"
                  className={`bg-transparent border-[#242428] text-white ${
                    fundFormErrors.agreementId ? "border-red-500" : ""
                  }`}
                />
                {fundFormErrors.agreementId && (
                  <p className="text-sm text-red-400">{fundFormErrors.agreementId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Amount (raw token units) <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={fundAmount}
                  onChange={(e) => {
                    setFundAmount(e.target.value);
                    if (fundFormErrors.amount) {
                      setFundFormErrors(prev => ({ ...prev, amount: undefined }));
                    }
                  }}
                  placeholder="e.g. 1000000"
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    fundFormErrors.amount ? "border-red-500" : ""
                  }`}
                />
                <p className="text-xs text-[#A0A0A0]">
                  Enter amount in raw token units (e.g., 1000000 for 1 USDC with 6 decimals)
                </p>
                {fundFormErrors.amount && (
                  <p className="text-sm text-red-400">{fundFormErrors.amount}</p>
                )}
            </div>

              {fundError ? <div className="text-sm text-red-400">{fundError}</div> : null}
              {fundTx ? <TxRow txHash={fundTx} /> : null}
              
              <div className="text-xs text-[#A0A0A0] bg-[#1a0c1d] p-3 rounded border border-[#2D2D2D]">
                <p className="font-semibold mb-1 text-yellow-400">⚠️ Wallet Approval Notice:</p>
                <p className="mb-2">If your wallet shows a "High risk" warning when approving tokens:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click the <strong className="text-white">"Review"</strong> button next to the warning banner</li>
                  <li>Review the approval details (amount and spender address)</li>
                  <li>The <strong className="text-white">"Confirm"</strong> button will then become enabled</li>
                </ol>
                <p className="mt-2 text-[#888]">This is a normal security check by your wallet to protect your funds.</p>
              </div>
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || !fundAgreementId || !fundAmount}
                onClick={async () => {
                  try {
                    setFundError(null);
                    setFundFormErrors({});
                    
                    // Validate
                    const errors: typeof fundFormErrors = {};
                    const agreementIdError = validatePositiveInteger(fundAgreementId, "Agreement ID");
                    const amountError = validateNumber(fundAmount, "Amount", 1);
                    
                    if (agreementIdError) {
                      errors.agreementId = agreementIdError;
                    }
                    if (amountError) {
                      errors.amount = amountError;
                    }
                    
                    if (Object.keys(errors).length > 0) {
                      setFundFormErrors(errors);
                      return;
                    }
                    
                    const agreementId = fundAgreementId;
                    
                    // Step 1: Get token and escrow addresses for the agreement
                    const [tokenData, escrowData] = await Promise.all([
                      apiGet<{ token: string }>(`/agreement/${agreementDefault}/get_token/${agreementId}`),
                      apiGet<{ escrow: string }>(`/agreement/${agreementDefault}/get_escrow`),
                    ]);
                    
                    const tokenAddress = tokenData.token;
                    const escrowAddress = escrowData.escrow;
                    
                    // Step 2: Check current allowance
                    let allowance: bigint;
                    try {
                      const allowanceData = await apiGet<{ allowance: string }>(
                        `/token/${tokenAddress}/allowance/${address}/${escrowAddress}`
                      );
                      allowance = BigInt(allowanceData.allowance);
                    } catch (e) {
                      allowance = BigInt(0);
                    }
                    
                    const amountBigInt = BigInt(fundAmount);
                    
                    // Step 3: Approve if needed
                    if (allowance < amountBigInt) {
                      showToast(
                        "Approval required", 
                        "Please confirm the transaction in your wallet.",
                        "info"
                      );
                      
                      // Approve exactly the amount needed (or a small buffer of 10% to avoid frequent approvals)
                      const approveAmount = (amountBigInt + (amountBigInt * BigInt(10) / BigInt(100))).toString();
                      const approvePrepared = await apiPost<{ call: any }>(
                        `/prepare/token/${tokenAddress}/approve`,
                        {
                          wallet_address: address,
                          session_token: sessionToken,
                          spender: escrowAddress,
                          amount: approveAmount,
                        }
                      );
                      
                      const approveTx = await executeCall(approvePrepared.call);
                      if (!approveTx?.transaction_hash) {
                        // Error toast is shown by connect-wallet-button component
                        const errorMsg = "Token approval failed. Please make sure to review the warning and click 'Review' if the Confirm button is disabled.";
                        throw new Error(errorMsg);
                      }
                      
                      showToast("Token approved", `Transaction completed successfully.`, "success");
                      
                      // Process events in the background
                      processTransactionEvents(approveTx.transaction_hash).catch(() => {});
                      
                      // Wait a moment for the approval to be processed
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                    
                    // Step 4: Fund the agreement
                    const txHash = await executeAction(
                      `/prepare/agreement/${agreementDefault}/fund_agreement`,
                      { agreement_id: agreementId, amount: fundAmount },
                      setFundError,
                      setFundTx
                    );
                    if (txHash) {
                      setFundAgreementId("");
                      setFundAmount("");
                      showToast(
                        "Agreement funded",
                        `Transaction completed successfully.`,
                        "success"
                      );
                      // Process events (also done in executeAction, but ensure it happens)
                      processTransactionEvents(txHash).catch(() => {});
                    }
                  } catch (e: any) {
                    setFundError(e?.message || "Failed to fund agreement");
                    showToast("Funding failed", e?.message || "Please try again.", "error");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Funding...
                  </>
                ) : (
                  "Fund Agreement"
                )}
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Add Employee to Payroll</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Add an employee to a payroll agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">
                  Agreement ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={addEmployeeAgreementId}
                  onChange={(e) => {
                    setAddEmployeeAgreementId(e.target.value);
                    if (addEmployeeFormErrors.agreementId) {
                      setAddEmployeeFormErrors(prev => ({ ...prev, agreementId: undefined }));
                    }
                  }}
                  placeholder="e.g. 1"
                  className={`bg-transparent border-[#242428] text-white ${
                    addEmployeeFormErrors.agreementId ? "border-red-500" : ""
                  }`}
                />
                {addEmployeeFormErrors.agreementId && (
                  <p className="text-sm text-red-400">{addEmployeeFormErrors.agreementId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Employee Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={addEmployeeAddress}
                  onChange={(e) => {
                    setAddEmployeeAddress(e.target.value);
                    if (addEmployeeFormErrors.address) {
                      setAddEmployeeFormErrors(prev => ({ ...prev, address: undefined }));
                    }
                  }}
                  placeholder="0x..."
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    addEmployeeFormErrors.address ? "border-red-500" : ""
                  }`}
                />
                {addEmployeeFormErrors.address && (
                  <p className="text-sm text-red-400">{addEmployeeFormErrors.address}</p>
                )}
            </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Salary per Period <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={addEmployeeSalary}
                  onChange={(e) => {
                    setAddEmployeeSalary(e.target.value);
                    if (addEmployeeFormErrors.salary) {
                      setAddEmployeeFormErrors(prev => ({ ...prev, salary: undefined }));
                    }
                  }}
                  placeholder="e.g. 1000000"
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    addEmployeeFormErrors.salary ? "border-red-500" : ""
                  }`}
                />
                {addEmployeeFormErrors.salary && (
                  <p className="text-sm text-red-400">{addEmployeeFormErrors.salary}</p>
                )}
                </div>

              {addEmployeeError ? <div className="text-sm text-red-400">{addEmployeeError}</div> : null}
              {addEmployeeTx ? <TxRow txHash={addEmployeeTx} /> : null}
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || !addEmployeeAgreementId || !addEmployeeAddress || !addEmployeeSalary}
                onClick={async () => {
                  try {
                    setAddEmployeeError(null);
                    setAddEmployeeFormErrors({});
                    
                    // Validate
                    const errors: typeof addEmployeeFormErrors = {};
                    const agreementIdError = validatePositiveInteger(addEmployeeAgreementId, "Agreement ID");
                    const addressError = validateAddress(addEmployeeAddress);
                    const salaryError = validateNumber(addEmployeeSalary, "Salary per Period", 1);
                    
                    if (agreementIdError) errors.agreementId = agreementIdError;
                    if (addressError) errors.address = addressError;
                    if (salaryError) errors.salary = salaryError;
                    
                    if (Object.keys(errors).length > 0) {
                      setAddEmployeeFormErrors(errors);
                      return;
                    }
                    
                    const agreementId = addEmployeeAgreementId;
                    const txHash = await executeAction(
                      `/prepare/agreement/${agreementDefault}/add_employee`,
                      {
                        agreement_id: agreementId,
                        employee: addEmployeeAddress,
                        salary_per_period: addEmployeeSalary,
                      },
                      setAddEmployeeError,
                      setAddEmployeeTx
                    );
                    if (txHash) {
                      setAddEmployeeAgreementId("");
                      setAddEmployeeAddress("");
                      setAddEmployeeSalary("");
                      showToast(
                        "Employee added",
                        `Transaction completed successfully.`,
                        "success"
                      );
                    }
                  } catch (e: any) {
                    setAddEmployeeError(e?.message || "Failed to add employee");
                    showToast("Addition failed", "error", e?.message || "Please try again.");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Employee"
                )}
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Milestone Management</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Add or approve milestones for milestone-based agreements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              {/* Add Milestone */}
              <div className="space-y-4 p-4 rounded-md bg-[#0D0D0D] border border-[#242428]">
                <h3 className="text-white font-semibold">Add Milestone</h3>
                <div className="space-y-2">
                  <Label className="text-white">
                    Agreement ID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={addMilestoneAgreementId}
                    onChange={(e) => {
                      setAddMilestoneAgreementId(e.target.value);
                      if (addMilestoneFormErrors.agreementId) {
                        setAddMilestoneFormErrors(prev => ({ ...prev, agreementId: undefined }));
                      }
                    }}
                    placeholder="e.g. 1"
                    className={`bg-transparent border-[#242428] text-white ${
                      addMilestoneFormErrors.agreementId ? "border-red-500" : ""
                    }`}
                  />
                  {addMilestoneFormErrors.agreementId && (
                    <p className="text-sm text-red-400">{addMilestoneFormErrors.agreementId}</p>
                  )}
              </div>
                <div className="space-y-2">
                  <Label className="text-white">
                    Milestone Amount <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={addMilestoneAmount}
                    onChange={(e) => {
                      setAddMilestoneAmount(e.target.value);
                      if (addMilestoneFormErrors.amount) {
                        setAddMilestoneFormErrors(prev => ({ ...prev, amount: undefined }));
                      }
                    }}
                  placeholder="e.g. 1000000"
                    className={`bg-transparent border-[#242428] text-white font-mono ${
                      addMilestoneFormErrors.amount ? "border-red-500" : ""
                    }`}
                />
                {addMilestoneFormErrors.amount && (
                  <p className="text-sm text-red-400">{addMilestoneFormErrors.amount}</p>
                )}
                </div>
                {addMilestoneError ? <div className="text-sm text-red-400">{addMilestoneError}</div> : null}
                {addMilestoneTx ? <TxRow txHash={addMilestoneTx} /> : null}
              <button
                type="button"
                  disabled={!address || !sessionToken || isExecuting || !addMilestoneAgreementId || !addMilestoneAmount}
                  onClick={async () => {
                    try {
                      setAddMilestoneError(null);
                      setAddMilestoneFormErrors({});
                      
                      // Validate
                      const errors: typeof addMilestoneFormErrors = {};
                      const agreementIdError = validatePositiveInteger(addMilestoneAgreementId, "Agreement ID");
                      const amountError = validateNumber(addMilestoneAmount, "Milestone Amount", 1);
                      
                      if (agreementIdError) errors.agreementId = agreementIdError;
                      if (amountError) errors.amount = amountError;
                      
                      if (Object.keys(errors).length > 0) {
                        setAddMilestoneFormErrors(errors);
                        return;
                      }
                      
                      const agreementId = addMilestoneAgreementId;
                      const txHash = await executeAction(
                        `/prepare/agreement/${agreementDefault}/add_milestone`,
                        { agreement_id: agreementId, amount: addMilestoneAmount },
                        setAddMilestoneError,
                        setAddMilestoneTx
                      );
                      if (txHash) {
                        setAddMilestoneAgreementId("");
                        setAddMilestoneAmount("");
                        showToast(
                          "Milestone added",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      }
                    } catch (e: any) {
                      setAddMilestoneError(e?.message || "Failed to add milestone");
                      showToast("Addition failed", e?.message || "Please try again.", "error");
                    }
                  }}
                  className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Milestone"
                  )}
              </button>
              </div>

              {/* Approve Milestone */}
              <div className="space-y-4 p-4 rounded-md bg-[#0D0D0D] border border-[#242428]">
                <h3 className="text-white font-semibold">Approve Milestone</h3>
                <div className="space-y-2">
                  <Label className="text-white">
                    Agreement ID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={approveMilestoneAgreementId}
                    onChange={(e) => {
                      setApproveMilestoneAgreementId(e.target.value);
                      if (approveMilestoneFormErrors.agreementId) {
                        setApproveMilestoneFormErrors(prev => ({ ...prev, agreementId: undefined }));
                      }
                    }}
                    placeholder="e.g. 1"
                    className={`bg-transparent border-[#242428] text-white ${
                      approveMilestoneFormErrors.agreementId ? "border-red-500" : ""
                    }`}
                  />
                  {approveMilestoneFormErrors.agreementId && (
                    <p className="text-sm text-red-400">{approveMilestoneFormErrors.agreementId}</p>
                  )}
            </div>
                <div className="space-y-2">
                  <Label className="text-white">
                    Milestone ID <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={approveMilestoneId}
                    onChange={(e) => {
                      setApproveMilestoneId(e.target.value);
                      if (approveMilestoneFormErrors.milestoneId) {
                        setApproveMilestoneFormErrors(prev => ({ ...prev, milestoneId: undefined }));
                      }
                    }}
                    placeholder="e.g. 0"
                    className={`bg-transparent border-[#242428] text-white ${
                      approveMilestoneFormErrors.milestoneId ? "border-red-500" : ""
                    }`}
                  />
                  {approveMilestoneFormErrors.milestoneId && (
                    <p className="text-sm text-red-400">{approveMilestoneFormErrors.milestoneId}</p>
                  )}
                </div>
                {approveMilestoneError ? <div className="text-sm text-red-400">{approveMilestoneError}</div> : null}
                {approveMilestoneTx ? <TxRow txHash={approveMilestoneTx} /> : null}
                <button
                  type="button"
                  disabled={!address || !sessionToken || isExecuting || !approveMilestoneAgreementId || !approveMilestoneId}
                  onClick={async () => {
                    try {
                      setApproveMilestoneError(null);
                      setApproveMilestoneFormErrors({});
                      
                      // Validate
                      const errors: typeof approveMilestoneFormErrors = {};
                      const agreementIdError = validatePositiveInteger(approveMilestoneAgreementId, "Agreement ID");
                      const milestoneIdError = validatePositiveInteger(approveMilestoneId, "Milestone ID");
                      
                      if (agreementIdError) errors.agreementId = agreementIdError;
                      if (milestoneIdError) errors.milestoneId = milestoneIdError;
                      
                      if (Object.keys(errors).length > 0) {
                        setApproveMilestoneFormErrors(errors);
                        return;
                      }
                      
                      const agreementId = approveMilestoneAgreementId;
                      const milestoneId = approveMilestoneId;
                      const txHash = await executeAction(
                        `/prepare/agreement/${agreementDefault}/approve_milestone`,
                        {
                          agreement_id: agreementId,
                          milestone_id: parseInt(milestoneId),
                        },
                        setApproveMilestoneError,
                        setApproveMilestoneTx
                      );
                      if (txHash) {
                        setApproveMilestoneAgreementId("");
                        setApproveMilestoneId("");
                        showToast(
                          "Milestone approved",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      }
                    } catch (e: any) {
                      setApproveMilestoneError(e?.message || "Failed to approve milestone");
                      showToast("Approval failed", e?.message || "Please try again.", "error");
                    }
                  }}
                  className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve Milestone"
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activate Tab */}
        <TabsContent value="activate" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Activate Agreement</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Activate an agreement so contributors/employees can claim payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">
                  Agreement ID <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={activateAgreementId}
                  onChange={(e) => {
                    setActivateAgreementId(e.target.value);
                    if (activateFormErrors.agreementId) {
                      setActivateFormErrors(prev => ({ ...prev, agreementId: undefined }));
                    }
                  }}
                  placeholder="e.g. 1"
                  className={`bg-transparent border-[#242428] text-white ${
                    activateFormErrors.agreementId ? "border-red-500" : ""
                  }`}
                />
                {activateFormErrors.agreementId && (
                  <p className="text-sm text-red-400">{activateFormErrors.agreementId}</p>
                )}
            </div>

              {activateError ? <div className="text-sm text-red-400">{activateError}</div> : null}
              {activateTx ? <TxRow txHash={activateTx} /> : null}
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || !activateAgreementId}
                onClick={async () => {
                  try {
                    setActivateError(null);
                    setActivateFormErrors({});
                    
                    // Validate
                    const agreementIdError = validatePositiveInteger(activateAgreementId, "Agreement ID");
                    if (agreementIdError) {
                      setActivateFormErrors({ agreementId: agreementIdError });
                      return;
                    }
                    
                    const agreementId = activateAgreementId;
                    const txHash = await executeAction(
                      `/prepare/agreement/${agreementDefault}/activate`,
                      { agreement_id: agreementId },
                      setActivateError,
                      setActivateTx
                    );
                    if (txHash) {
                      setActivateAgreementId("");
                      showToast(
                        "Agreement activated",
                        `Transaction completed successfully.`,
                        "success"
                      );
                    }
                  } catch (e: any) {
                    setActivateError(e?.message || "Failed to activate agreement");
                    showToast("Activation failed", e?.message || "Please try again.", "error");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "Activate Agreement"
                )}
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Dispute Management</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Raise or resolve disputes for cancelled agreements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">Agreement ID</Label>
                <Input
                  value={disputeAgreementId}
                  onChange={(e) => setDisputeAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-transparent border-[#242428] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Action</Label>
                <div className="flex gap-3">
              <button
                type="button"
                    onClick={() => setDisputeAction("raise")}
                    className={`px-4 py-2 rounded-md border transition cursor-pointer ${
                      disputeAction === "raise"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Raise Dispute
              </button>
              <button
                type="button"
                    onClick={() => setDisputeAction("resolve")}
                    className={`px-4 py-2 rounded-md border transition cursor-pointer ${
                      disputeAction === "resolve"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5] hover:bg-[#1A1A1A]"
                    }`}
                  >
                    <Gavel className="w-4 h-4 inline mr-2" />
                    Resolve Dispute
              </button>
                </div>
              </div>

              {disputeAction === "resolve" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">
                      Pay Contributor Amount <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={disputePayContributor}
                      onChange={(e) => {
                        setDisputePayContributor(e.target.value);
                        if (disputeFormErrors.payContributor) {
                          setDisputeFormErrors(prev => ({ ...prev, payContributor: undefined }));
                        }
                      }}
                      placeholder="e.g. 1000000"
                      className={`bg-transparent border-[#242428] text-white font-mono ${
                        disputeFormErrors.payContributor ? "border-red-500" : ""
                      }`}
                    />
                    {disputeFormErrors.payContributor && (
                      <p className="text-sm text-red-400">{disputeFormErrors.payContributor}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">
                      Refund Employer Amount <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={disputeRefundEmployer}
                      onChange={(e) => {
                        setDisputeRefundEmployer(e.target.value);
                        if (disputeFormErrors.refundEmployer) {
                          setDisputeFormErrors(prev => ({ ...prev, refundEmployer: undefined }));
                        }
                      }}
                      placeholder="e.g. 500000"
                      className={`bg-transparent border-[#242428] text-white font-mono ${
                        disputeFormErrors.refundEmployer ? "border-red-500" : ""
                      }`}
                    />
                    {disputeFormErrors.refundEmployer && (
                      <p className="text-sm text-red-400">{disputeFormErrors.refundEmployer}</p>
                    )}
                  </div>
                </>
              )}

              {disputeError ? <div className="text-sm text-red-400">{disputeError}</div> : null}
              {disputeTx ? <TxRow txHash={disputeTx} /> : null}
            </CardContent>
            <CardFooter>
              <button
                type="button"
                disabled={
                  !address ||
                  !sessionToken ||
                  isExecuting ||
                  !disputeAgreementId ||
                  (disputeAction === "resolve" && (!disputePayContributor || !disputeRefundEmployer))
                }
                onClick={async () => {
                  try {
                    setDisputeError(null);
                    setDisputeFormErrors({});
                    
                    // Validate
                    const errors: typeof disputeFormErrors = {};
                    const agreementIdError = validatePositiveInteger(disputeAgreementId, "Agreement ID");
                    if (agreementIdError) {
                      errors.agreementId = agreementIdError;
                    }
                    
                    if (disputeAction === "resolve") {
                      const payContributorError = validateNumber(disputePayContributor, "Pay Contributor Amount", 0);
                      const refundEmployerError = validateNumber(disputeRefundEmployer, "Refund Employer Amount", 0);
                      if (payContributorError) errors.payContributor = payContributorError;
                      if (refundEmployerError) errors.refundEmployer = refundEmployerError;
                    }
                    
                    if (Object.keys(errors).length > 0) {
                      setDisputeFormErrors(errors);
                      return;
                    }
                    
                    const agreementId = disputeAgreementId;
                    let txHash: string | null = null;
                    if (disputeAction === "raise") {
                      txHash = await executeAction(
                        `/prepare/agreement/${agreementDefault}/raise_dispute`,
                        { agreement_id: agreementId },
                        setDisputeError,
                        setDisputeTx
                      );
                      if (txHash) {
                        setDisputeAgreementId("");
                        showToast(
                          "Dispute raised",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      }
                    } else {
                      txHash = await executeAction(
                        `/prepare/agreement/${agreementDefault}/resolve_dispute`,
                        {
                          agreement_id: agreementId,
                          pay_contributor: disputePayContributor,
                          refund_employer: disputeRefundEmployer,
                        },
                        setDisputeError,
                        setDisputeTx
                      );
                      if (txHash) {
                        setDisputeAgreementId("");
                        setDisputePayContributor("");
                        setDisputeRefundEmployer("");
                        showToast(
                          "Dispute resolved",
                          `Transaction completed successfully.`,
                          "success"
                        );
                      }
                    }
                  } catch (e: any) {
                    setDisputeError(e?.message || "Failed to process dispute");
                    showToast("Processing failed", e?.message || "Please try again.", "error");
                  }
                }}
                className="w-full px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {disputeAction === "raise" ? "Raising..." : "Resolving..."}
                  </>
                ) : (
                  disputeAction === "raise" ? "Raise Dispute" : "Resolve Dispute"
                )}
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Initialize Contracts */}
      <div className="mt-4 flex gap-3">
        <Dialog open={initEscrowOpen} onOpenChange={setInitEscrowOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Initialize Escrow
            </button>
          </DialogTrigger>
        <DialogContent className="bg-[#1a0c1d] border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Initialize Escrow</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
              Initialize the Payroll Escrow contract with token and manager (WorkAgreement contract).
              <br />
              <span className="text-yellow-400 font-semibold">
                ⚠️ This is a one-time operation.
              </span>
              </DialogDescription>
            </DialogHeader>

            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

          {escrowInitialized === true ? (
            <div className="p-4 rounded-md bg-yellow-900/20 border border-yellow-700/50">
              <div className="text-sm text-yellow-400 font-semibold mb-2">
                Escrow Already Initialized
              </div>
              <div className="text-sm text-[#A0A0A0]">
                This escrow contract has already been initialized. You cannot initialize it again.
              </div>
            </div>
          ) : null}

            <div className="space-y-4">
              <div className="text-sm text-[#A0A0A0]">
              Escrow: <span className="text-white font-mono">{shortHex(escrowDefault)}</span>
                </div>
            <div className="text-sm text-[#A0A0A0]">
              Manager: <span className="text-white font-mono">{shortHex(agreementDefault)}</span>
              </div>

            <TokenSelector
              selectedTokenKey={selectedTokenKey}
              onTokenChange={setSelectedTokenKey}
              supportedTokens={supportedTokens}
              balance={selectedTokenBalance}
              balanceError={selectedTokenBalanceError}
            />
            </div>

          {initEscrowError ? <div className="text-sm text-red-400">{initEscrowError}</div> : null}
          {initEscrowTx ? <TxRow txHash={initEscrowTx} /> : null}

            <DialogFooter>
              <button
                type="button"
              onClick={() => setInitEscrowOpen(false)}
              className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
              disabled={!address || !sessionToken || isExecuting || escrowInitialized === true}
              onClick={async () => {
                try {
                  setInitEscrowError(null);
                  setInitEscrowTx(null);
                  const { address: wallet_address, sessionToken: session_token } = requireAuth();
                  if (!escrowDefault || !agreementDefault) {
                    throw new Error("Escrow or Agreement address not loaded.");
                  }
                  if (!selectedToken?.address) {
                    throw new Error("Selected token is not configured.");
                  }
                  const txHash = await executeAction(
                    `/prepare/escrow/${escrowDefault}/initialize`,
                    { token: selectedToken.address, manager: agreementDefault },
                    setInitEscrowError,
                    setInitEscrowTx
                  );
                  if (txHash) {
                    setInitEscrowOpen(false);
                    showToast(
                      "Escrow initialized",
                      `Transaction completed successfully.`,
                      "success"
                    );
                  }
                } catch (e: any) {
                  setInitEscrowError(e?.message || "Failed to initialize escrow");
                  showToast("Initialization failed", e?.message || "Please try again.", "error");
                }
              }}
              className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize"
              )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={initAgreementOpen} onOpenChange={setInitAgreementOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] transition flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Initialize Agreement
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a0c1d] border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Initialize WorkAgreement</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Initialize the WorkAgreement contract with escrow and arbiter addresses.
                <br />
                <span className="text-yellow-400 font-semibold">
                  ⚠️ This is a one-time operation.
                </span>
              </DialogDescription>
            </DialogHeader>

            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

            {agreementInitialized === true ? (
              <div className="p-4 rounded-md bg-yellow-900/20 border border-yellow-700/50">
                <div className="text-sm text-yellow-400 font-semibold mb-2">
                  Agreement Already Initialized
                </div>
                <div className="text-sm text-[#A0A0A0]">
                  This agreement contract has already been initialized. You cannot initialize it again.
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="text-sm text-[#A0A0A0]">
                Agreement: <span className="text-white font-mono">{shortHex(agreementDefault)}</span>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">
                  Escrow Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={initAgreementEscrow}
                  onChange={(e) => {
                    setInitAgreementEscrow(e.target.value);
                    if (initAgreementFormErrors.escrow) {
                      setInitAgreementFormErrors(prev => ({ ...prev, escrow: undefined }));
                    }
                  }}
                  placeholder="0x..."
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    initAgreementFormErrors.escrow ? "border-red-500" : ""
                  }`}
                />
                {initAgreementFormErrors.escrow && (
                  <p className="text-sm text-red-400">{initAgreementFormErrors.escrow}</p>
                )}
            </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Arbiter Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={initAgreementArbiter}
                  onChange={(e) => {
                    setInitAgreementArbiter(e.target.value);
                    if (initAgreementFormErrors.arbiter) {
                      setInitAgreementFormErrors(prev => ({ ...prev, arbiter: undefined }));
                    }
                  }}
                  placeholder="0x..."
                  className={`bg-transparent border-[#242428] text-white font-mono ${
                    initAgreementFormErrors.arbiter ? "border-red-500" : ""
                  }`}
                />
                <p className="text-xs text-[#A0A0A0]">
                  The arbiter address that will resolve disputes. Can be the same as escrow or a separate address.
                </p>
                {initAgreementFormErrors.arbiter && (
                  <p className="text-sm text-red-400">{initAgreementFormErrors.arbiter}</p>
                )}
              </div>
            </div>

            {initAgreementError ? <div className="text-sm text-red-400">{initAgreementError}</div> : null}
            {initAgreementTx ? <TxRow txHash={initAgreementTx} /> : null}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setInitAgreementOpen(false)}
                className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || agreementInitialized === true || !initAgreementEscrow || !initAgreementArbiter || !isVerified}
                onClick={async () => {
                  try {
                    setInitAgreementError(null);
                    setInitAgreementTx(null);
                    setInitAgreementFormErrors({});
                    
                    const { address: wallet_address, sessionToken: session_token } = requireAuth();
                    if (!agreementDefault) {
                      throw new Error("Agreement address not loaded.");
                    }
                    if (!isVerified) {
                      throw new Error("Wallet is not verified. Please verify your wallet first.");
                    }
                    
                    // Validate
                    const errors: typeof initAgreementFormErrors = {};
                    const escrowError = validateAddress(initAgreementEscrow);
                    const arbiterError = validateAddress(initAgreementArbiter);
                    
                    if (escrowError) errors.escrow = escrowError;
                    if (arbiterError) errors.arbiter = arbiterError;
                    
                    if (Object.keys(errors).length > 0) {
                      setInitAgreementFormErrors(errors);
                      return;
                    }
                    
                    const txHash = await executeAction(
                      `/prepare/agreement/${agreementDefault}/initialize`,
                      { escrow: initAgreementEscrow, arbiter: initAgreementArbiter },
                      setInitAgreementError,
                      setInitAgreementTx
                    );
                    if (txHash) {
                      setInitAgreementOpen(false);
                      showToast(
                        "Agreement initialized",
                        `Transaction completed successfully.`,
                        "success"
                      );
                    }
                  } catch (e: any) {
                    const errorMsg = e?.message || "Failed to initialize agreement";
                    setInitAgreementError(errorMsg);
                    console.error("[Initialize Agreement] Error:", e);
                    showToast("Initialization failed", errorMsg || "Please try again.", "error");
                  }
                }}
                className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

