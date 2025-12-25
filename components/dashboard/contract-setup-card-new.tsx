"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";

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
  const { address, sessionToken, isVerified, isConnecting } = useWallet();
  return useMemo(() => {
    if (isConnecting) return "Connecting wallet…";
    if (!address) return "Connect a wallet to continue.";
    if (!isVerified || !sessionToken) return "Wallet connected, but not verified with backend.";
    return null;
  }, [address, isConnecting, isVerified, sessionToken]);
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
  const { address, sessionToken, isExecuting, executeCall } = useWallet();
  const authHint = useAuthHint();
  const [escrowCopied, setEscrowCopied] = useState(false);
  const [agreementCopied, setAgreementCopied] = useState(false);

  const [escrowDefault, setEscrowDefault] = useState("");
  const [agreementDefault, setAgreementDefault] = useState("");
  const [escrowInitialized, setEscrowInitialized] = useState<boolean | null>(null);
  const [escrowToken, setEscrowToken] = useState<string | null>(null);

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

  // Agreement details view
  const [viewAgreementId, setViewAgreementId] = useState("");
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  // Fund Agreement
  const [fundAgreementId, setFundAgreementId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundTx, setFundTx] = useState<string | null>(null);

  // Manage Agreement (pause, resume, cancel, etc.)
  const [manageAgreementId, setManageAgreementId] = useState("");
  const [manageAction, setManageAction] = useState<"pause" | "resume" | "cancel" | "finalize_grace_period">("pause");
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageTx, setManageTx] = useState<string | null>(null);

  // Add Employee
  const [addEmployeeAgreementId, setAddEmployeeAgreementId] = useState("");
  const [addEmployeeAddress, setAddEmployeeAddress] = useState("");
  const [addEmployeeSalary, setAddEmployeeSalary] = useState("");
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);
  const [addEmployeeTx, setAddEmployeeTx] = useState<string | null>(null);

  // Add Milestone
  const [addMilestoneAgreementId, setAddMilestoneAgreementId] = useState("");
  const [addMilestoneAmount, setAddMilestoneAmount] = useState("");
  const [addMilestoneError, setAddMilestoneError] = useState<string | null>(null);
  const [addMilestoneTx, setAddMilestoneTx] = useState<string | null>(null);

  // Approve Milestone
  const [approveMilestoneAgreementId, setApproveMilestoneAgreementId] = useState("");
  const [approveMilestoneId, setApproveMilestoneId] = useState("");
  const [approveMilestoneError, setApproveMilestoneError] = useState<string | null>(null);
  const [approveMilestoneTx, setApproveMilestoneTx] = useState<string | null>(null);

  // Activate
  const [activateAgreementId, setActivateAgreementId] = useState("");
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateTx, setActivateTx] = useState<string | null>(null);

  // Dispute
  const [disputeAgreementId, setDisputeAgreementId] = useState("");
  const [disputeAction, setDisputeAction] = useState<"raise" | "resolve">("raise");
  const [disputePayContributor, setDisputePayContributor] = useState("");
  const [disputeRefundEmployer, setDisputeRefundEmployer] = useState("");
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [disputeTx, setDisputeTx] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiGet<{ address: string }>("/escrow/defaults").then((d) => setEscrowDefault(d.address)),
      apiGet<{ address: string }>("/agreement/defaults").then((d) =>
        setAgreementDefault(d.address),
      ),
    ]).catch(() => {});
  }, []);

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

  const requireAuth = () => {
    if (!address || !sessionToken) {
      throw new Error("Please connect & verify your wallet first.");
    }
    return { address, sessionToken };
  };

  const loadAgreementDetails = async () => {
    if (!agreementDefault || !viewAgreementId) return;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const id = BigInt(viewAgreementId);
      const [employer, contributor, token, escrow, total, paid, status, mode, dispute_status] = await Promise.all([
        apiGet<{ employer: string }>(`/agreement/${agreementDefault}/get_employer/${id}`).catch(() => ({ employer: "" })),
        apiGet<{ contributor: string }>(`/agreement/${agreementDefault}/get_contributor/${id}`).catch(() => ({ contributor: "" })),
        apiGet<{ token: string }>(`/agreement/${agreementDefault}/get_token/${id}`).catch(() => ({ token: "" })),
        apiGet<{ escrow: string }>(`/agreement/${agreementDefault}/get_escrow`).catch(() => ({ escrow: "" })),
        apiGet<{ total_amount: string }>(`/agreement/${agreementDefault}/get_total_amount/${id}`).catch(() => ({ total_amount: "0" })),
        apiGet<{ paid_amount: string }>(`/agreement/${agreementDefault}/get_paid_amount/${id}`).catch(() => ({ paid_amount: "0" })),
        apiGet<{ status: number }>(`/agreement/${agreementDefault}/get_status/${id}`).catch(() => ({ status: 0 })),
        apiGet<{ mode: number }>(`/agreement/${agreementDefault}/get_agreement_mode/${id}`).catch(() => ({ mode: 0 })),
        apiGet<{ dispute_status: number }>(`/agreement/${agreementDefault}/get_dispute_status/${id}`).catch(() => ({ dispute_status: 0 })),
      ]);

      const details: AgreementDetails = {
        agreement_id: viewAgreementId,
        employer: employer.employer,
        contributor: contributor.contributor,
        token: token.token,
        escrow: escrow.escrow,
        total_amount: total.total_amount,
        paid_amount: paid.paid_amount,
        status: status.status,
        mode: mode.mode,
        dispute_status: dispute_status.dispute_status,
      };

      // Load additional details for payroll
      if (mode.mode === 1) {
        try {
          const employeeCount = await apiGet<{ employee_count: number }>(
            `/agreement/${agreementDefault}/get_employee_count/${id}`
          );
          details.employee_count = employeeCount.employee_count;
        } catch {}
      }

      // Load grace period status
      try {
        const gracePeriod = await apiGet<{ is_grace_period_active: boolean }>(
          `/agreement/${agreementDefault}/is_grace_period_active/${id}`
        );
        details.is_grace_period_active = gracePeriod.is_grace_period_active;
      } catch {}

      setAgreementDetails(details);
    } catch (err: any) {
      setDetailsError(err?.message || "Failed to load agreement details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const executeAction = async (endpoint: string, body: any, setError: (e: string | null) => void, setTx: (t: string | null) => void) => {
    setError(null);
    setTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    const prepared = await apiPost<{ call: any }>(endpoint, {
      wallet_address,
      session_token,
      ...body,
    });
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setTx(tx.transaction_hash);
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

      {escrowInitialized === false ? (
        <div className="mb-4 p-3 rounded-md bg-yellow-900/20 border border-yellow-700/50">
          <div className="text-sm text-yellow-400">
            <strong>⚠️ Escrow Not Initialized:</strong> The escrow contract needs to be initialized once before creating agreements.
          </div>
        </div>
      ) : escrowInitialized === true ? (
        <div className="mb-4 p-3 rounded-md bg-green-900/20 border border-green-700/50">
          <div className="text-sm text-green-400">
            <strong>✓ Escrow Initialized:</strong> The escrow is ready to use.
            {escrowToken ? (
              <span className="text-[#A0A0A0] ml-2">
                Token: <span className="text-white font-mono">{shortHex(escrowToken)}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-8 mb-4">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="view">View</TabsTrigger>
          <TabsTrigger value="fund">Fund</TabsTrigger>
          <TabsTrigger value="activate">Activate</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        {/* Create Agreement Tab */}
        <TabsContent value="create" className="space-y-4">
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
                    className={`px-4 py-2 rounded-md border ${
                      agreementMode === "payroll"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    Payroll
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgreementMode("escrow")}
                    className={`px-4 py-2 rounded-md border ${
                      agreementMode === "escrow"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
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
                      <Label className="text-white">Period (seconds)</Label>
                      <Input
                        value={payrollPeriodSeconds}
                        onChange={(e) => setPayrollPeriodSeconds(e.target.value)}
                        placeholder="2592000"
                        className="bg-transparent border-[#242428] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Number of periods</Label>
                      <Input
                        value={payrollNumPeriods}
                        onChange={(e) => setPayrollNumPeriods(e.target.value)}
                        placeholder="1"
                        className="bg-transparent border-[#242428] text-white"
                      />
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
                        className={`px-4 py-2 rounded-md border ${
                          escrowPaymentType === "time"
                            ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                            : "border-[#242428] bg-transparent text-[#E5E5E5]"
                        }`}
                      >
                        Time-based
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscrowPaymentType("milestone")}
                        className={`px-4 py-2 rounded-md border ${
                          escrowPaymentType === "milestone"
                            ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                            : "border-[#242428] bg-transparent text-[#E5E5E5]"
                        }`}
                      >
                        Milestone
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Contributor Address</Label>
                    <Input
                      value={escrowContributor}
                      onChange={(e) => setEscrowContributor(e.target.value)}
                      placeholder="0x..."
                      className="bg-transparent border-[#242428] text-white font-mono"
                    />
                  </div>

                  {escrowPaymentType === "time" ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Amount per period</Label>
                        <Input
                          value={amountPerPeriod}
                          onChange={(e) => setAmountPerPeriod(e.target.value)}
                          placeholder="1000000"
                          className="bg-transparent border-[#242428] text-white font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Period (seconds)</Label>
                        <Input
                          value={periodSeconds}
                          onChange={(e) => setPeriodSeconds(e.target.value)}
                          placeholder="2592000"
                          className="bg-transparent border-[#242428] text-white font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Number of periods</Label>
                        <Input
                          value={numPeriods}
                          onChange={(e) => setNumPeriods(e.target.value)}
                          placeholder="1"
                          className="bg-transparent border-[#242428] text-white font-mono"
                        />
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
              <Button
                disabled={!address || !sessionToken || isExecuting}
                onClick={async () => {
                  try {
                    setCreateAgreementError(null);
                    setCreateAgreementTx(null);
                    const { address: wallet_address, sessionToken: session_token } = requireAuth();
                    if (!agreementDefault) throw new Error("Agreement address not loaded.");
                    const token = supportedTokens.find((t) => t.key === agreementTokenKey);
                    if (!token?.address) throw new Error("Token not configured.");

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
                      if (!escrowContributor.startsWith("0x")) throw new Error("Invalid contributor address.");
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
                      if (!escrowContributor.startsWith("0x")) throw new Error("Invalid contributor address.");
                      endpoint = `/prepare/agreement/${agreementDefault}/create_milestone_agreement`;
                      body = {
                        employer: wallet_address,
                        contributor: escrowContributor,
                        token: token.address,
                      };
                    }

                    await executeAction(endpoint, body, setCreateAgreementError, setCreateAgreementTx);
                  } catch (e: any) {
                    setCreateAgreementError(e?.message || "Failed to create agreement");
                  }
                }}
                className="w-full"
              >
                {isExecuting ? "Creating..." : "Create Agreement"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* View Details Tab */}
        <TabsContent value="view" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">View Agreement Details</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Enter an agreement ID to view its details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Agreement ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={viewAgreementId}
                    onChange={(e) => setViewAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="bg-transparent border-[#242428] text-white"
                  />
                  <Button
                    onClick={loadAgreementDetails}
                    disabled={!viewAgreementId || loadingDetails}
                  >
                    {loadingDetails ? <Loader2 className="animate-spin" /> : <Eye />}
                  </Button>
                </div>
              </div>

              {detailsError ? (
                <div className="text-sm text-red-400">{detailsError}</div>
              ) : null}

              {agreementDetails && (
                <div className="space-y-3 p-4 rounded-md bg-[#0D0D0D] border border-[#242428]">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#A0A0A0]">Status:</span>
                      <span className="text-white ml-2">{statusLabels[agreementDetails.status || 0]}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Mode:</span>
                      <span className="text-white ml-2">{modeLabels[agreementDetails.mode || 0]}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Employer:</span>
                      <span className="text-white ml-2 font-mono">{shortHex(agreementDetails.employer || "")}</span>
                    </div>
                    {agreementDetails.contributor && (
                      <div>
                        <span className="text-[#A0A0A0]">Contributor:</span>
                        <span className="text-white ml-2 font-mono">{shortHex(agreementDetails.contributor)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#A0A0A0]">Total Amount:</span>
                      <span className="text-white ml-2">{agreementDetails.total_amount || "0"}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Paid Amount:</span>
                      <span className="text-white ml-2">{agreementDetails.paid_amount || "0"}</span>
                    </div>
                    <div>
                      <span className="text-[#A0A0A0]">Dispute Status:</span>
                      <span className="text-white ml-2">{disputeStatusLabels[agreementDetails.dispute_status || 0]}</span>
                    </div>
                    {agreementDetails.employee_count !== undefined && (
                      <div>
                        <span className="text-[#A0A0A0]">Employees:</span>
                        <span className="text-white ml-2">{agreementDetails.employee_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
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
                <Label className="text-white">Agreement ID</Label>
                <Input
                  value={manageAgreementId}
                  onChange={(e) => setManageAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-transparent border-[#242428] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Action</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManageAction("pause")}
                    className={`px-4 py-2 rounded-md border ${
                      manageAction === "pause"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    <Pause className="w-4 h-4 inline mr-2" />
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageAction("resume")}
                    className={`px-4 py-2 rounded-md border ${
                      manageAction === "resume"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageAction("cancel")}
                    className={`px-4 py-2 rounded-md border ${
                      manageAction === "cancel"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setManageAction("finalize_grace_period")}
                    className={`px-4 py-2 rounded-md border ${
                      manageAction === "finalize_grace_period"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
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
              <Button
                disabled={!address || !sessionToken || isExecuting || !manageAgreementId}
                onClick={async () => {
                  try {
                    await executeAction(
                      `/prepare/agreement/${agreementDefault}/${manageAction}`,
                      { agreement_id: manageAgreementId },
                      setManageError,
                      setManageTx
                    );
                  } catch (e: any) {
                    setManageError(e?.message || "Failed to execute action");
                  }
                }}
                className="w-full"
              >
                {isExecuting ? "Executing..." : `Execute ${manageAction.replace("_", " ")}`}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Fund Tab */}
        <TabsContent value="fund" className="space-y-4">
          <Card className="bg-[#1a0c1d] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Fund Agreement</CardTitle>
              <CardDescription className="text-[#A0A0A0]">
                Deposit tokens to an agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-2">
                <Label className="text-white">Agreement ID</Label>
                <Input
                  value={fundAgreementId}
                  onChange={(e) => setFundAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-transparent border-[#242428] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Amount (raw token units)</Label>
                <Input
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="bg-transparent border-[#242428] text-white font-mono"
                />
                <p className="text-xs text-[#A0A0A0]">
                  Enter amount in raw token units (e.g., 1000000 for 1 USDC with 6 decimals)
                </p>
              </div>

              {fundError ? <div className="text-sm text-red-400">{fundError}</div> : null}
              {fundTx ? <TxRow txHash={fundTx} /> : null}
            </CardContent>
            <CardFooter>
              <Button
                disabled={!address || !sessionToken || isExecuting || !fundAgreementId || !fundAmount}
                onClick={async () => {
                  try {
                    await executeAction(
                      `/prepare/agreement/${agreementDefault}/fund_agreement`,
                      { agreement_id: fundAgreementId, amount: fundAmount },
                      setFundError,
                      setFundTx
                    );
                  } catch (e: any) {
                    setFundError(e?.message || "Failed to fund agreement");
                  }
                }}
                className="w-full"
              >
                {isExecuting ? "Funding..." : "Fund Agreement"}
              </Button>
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
                <Label className="text-white">Agreement ID</Label>
                <Input
                  value={addEmployeeAgreementId}
                  onChange={(e) => setAddEmployeeAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-transparent border-[#242428] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Employee Address</Label>
                <Input
                  value={addEmployeeAddress}
                  onChange={(e) => setAddEmployeeAddress(e.target.value)}
                  placeholder="0x..."
                  className="bg-transparent border-[#242428] text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Salary per Period</Label>
                <Input
                  value={addEmployeeSalary}
                  onChange={(e) => setAddEmployeeSalary(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="bg-transparent border-[#242428] text-white font-mono"
                />
              </div>

              {addEmployeeError ? <div className="text-sm text-red-400">{addEmployeeError}</div> : null}
              {addEmployeeTx ? <TxRow txHash={addEmployeeTx} /> : null}
            </CardContent>
            <CardFooter>
              <Button
                disabled={!address || !sessionToken || isExecuting || !addEmployeeAgreementId || !addEmployeeAddress || !addEmployeeSalary}
                onClick={async () => {
                  try {
                    await executeAction(
                      `/prepare/agreement/${agreementDefault}/add_employee`,
                      {
                        agreement_id: addEmployeeAgreementId,
                        employee: addEmployeeAddress,
                        salary_per_period: addEmployeeSalary,
                      },
                      setAddEmployeeError,
                      setAddEmployeeTx
                    );
                  } catch (e: any) {
                    setAddEmployeeError(e?.message || "Failed to add employee");
                  }
                }}
                className="w-full"
              >
                {isExecuting ? "Adding..." : "Add Employee"}
              </Button>
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
                  <Label className="text-white">Agreement ID</Label>
                  <Input
                    value={addMilestoneAgreementId}
                    onChange={(e) => setAddMilestoneAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="bg-transparent border-[#242428] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Milestone Amount</Label>
                  <Input
                    value={addMilestoneAmount}
                    onChange={(e) => setAddMilestoneAmount(e.target.value)}
                    placeholder="e.g. 1000000"
                    className="bg-transparent border-[#242428] text-white font-mono"
                  />
                </div>
                {addMilestoneError ? <div className="text-sm text-red-400">{addMilestoneError}</div> : null}
                {addMilestoneTx ? <TxRow txHash={addMilestoneTx} /> : null}
                <Button
                  disabled={!address || !sessionToken || isExecuting || !addMilestoneAgreementId || !addMilestoneAmount}
                  onClick={async () => {
                    try {
                      await executeAction(
                        `/prepare/agreement/${agreementDefault}/add_milestone`,
                        { agreement_id: addMilestoneAgreementId, amount: addMilestoneAmount },
                        setAddMilestoneError,
                        setAddMilestoneTx
                      );
                    } catch (e: any) {
                      setAddMilestoneError(e?.message || "Failed to add milestone");
                    }
                  }}
                  className="w-full"
                >
                  {isExecuting ? "Adding..." : "Add Milestone"}
                </Button>
              </div>

              {/* Approve Milestone */}
              <div className="space-y-4 p-4 rounded-md bg-[#0D0D0D] border border-[#242428]">
                <h3 className="text-white font-semibold">Approve Milestone</h3>
                <div className="space-y-2">
                  <Label className="text-white">Agreement ID</Label>
                  <Input
                    value={approveMilestoneAgreementId}
                    onChange={(e) => setApproveMilestoneAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="bg-transparent border-[#242428] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Milestone ID</Label>
                  <Input
                    value={approveMilestoneId}
                    onChange={(e) => setApproveMilestoneId(e.target.value)}
                    placeholder="e.g. 0"
                    className="bg-transparent border-[#242428] text-white"
                  />
                </div>
                {approveMilestoneError ? <div className="text-sm text-red-400">{approveMilestoneError}</div> : null}
                {approveMilestoneTx ? <TxRow txHash={approveMilestoneTx} /> : null}
                <Button
                  disabled={!address || !sessionToken || isExecuting || !approveMilestoneAgreementId || !approveMilestoneId}
                  onClick={async () => {
                    try {
                      await executeAction(
                        `/prepare/agreement/${agreementDefault}/approve_milestone`,
                        {
                          agreement_id: approveMilestoneAgreementId,
                          milestone_id: parseInt(approveMilestoneId),
                        },
                        setApproveMilestoneError,
                        setApproveMilestoneTx
                      );
                    } catch (e: any) {
                      setApproveMilestoneError(e?.message || "Failed to approve milestone");
                    }
                  }}
                  className="w-full"
                >
                  {isExecuting ? "Approving..." : "Approve Milestone"}
                </Button>
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
                <Label className="text-white">Agreement ID</Label>
                <Input
                  value={activateAgreementId}
                  onChange={(e) => setActivateAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="bg-transparent border-[#242428] text-white"
                />
              </div>

              {activateError ? <div className="text-sm text-red-400">{activateError}</div> : null}
              {activateTx ? <TxRow txHash={activateTx} /> : null}
            </CardContent>
            <CardFooter>
              <Button
                disabled={!address || !sessionToken || isExecuting || !activateAgreementId}
                onClick={async () => {
                  try {
                    await executeAction(
                      `/prepare/agreement/${agreementDefault}/activate`,
                      { agreement_id: activateAgreementId },
                      setActivateError,
                      setActivateTx
                    );
                  } catch (e: any) {
                    setActivateError(e?.message || "Failed to activate agreement");
                  }
                }}
                className="w-full"
              >
                {isExecuting ? "Activating..." : "Activate Agreement"}
              </Button>
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
                    className={`px-4 py-2 rounded-md border ${
                      disputeAction === "raise"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    Raise Dispute
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisputeAction("resolve")}
                    className={`px-4 py-2 rounded-md border ${
                      disputeAction === "resolve"
                        ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
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
                    <Label className="text-white">Pay Contributor Amount</Label>
                    <Input
                      value={disputePayContributor}
                      onChange={(e) => setDisputePayContributor(e.target.value)}
                      placeholder="e.g. 1000000"
                      className="bg-transparent border-[#242428] text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Refund Employer Amount</Label>
                    <Input
                      value={disputeRefundEmployer}
                      onChange={(e) => setDisputeRefundEmployer(e.target.value)}
                      placeholder="e.g. 500000"
                      className="bg-transparent border-[#242428] text-white font-mono"
                    />
                  </div>
                </>
              )}

              {disputeError ? <div className="text-sm text-red-400">{disputeError}</div> : null}
              {disputeTx ? <TxRow txHash={disputeTx} /> : null}
            </CardContent>
            <CardFooter>
              <Button
                disabled={
                  !address ||
                  !sessionToken ||
                  isExecuting ||
                  !disputeAgreementId ||
                  (disputeAction === "resolve" && (!disputePayContributor || !disputeRefundEmployer))
                }
                onClick={async () => {
                  try {
                    if (disputeAction === "raise") {
                      await executeAction(
                        `/prepare/agreement/${agreementDefault}/raise_dispute`,
                        { agreement_id: disputeAgreementId },
                        setDisputeError,
                        setDisputeTx
                      );
                    } else {
                      await executeAction(
                        `/prepare/agreement/${agreementDefault}/resolve_dispute`,
                        {
                          agreement_id: disputeAgreementId,
                          pay_contributor: disputePayContributor,
                          refund_employer: disputeRefundEmployer,
                        },
                        setDisputeError,
                        setDisputeTx
                      );
                    }
                  } catch (e: any) {
                    setDisputeError(e?.message || "Failed to process dispute");
                  }
                }}
                className="w-full"
              >
                {isExecuting
                  ? disputeAction === "raise"
                    ? "Raising..."
                    : "Resolving..."
                  : disputeAction === "raise"
                    ? "Raise Dispute"
                    : "Resolve Dispute"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Initialize Escrow Dialog */}
      <Dialog open={initEscrowOpen} onOpenChange={setInitEscrowOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-4">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Initialize Escrow
          </Button>
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
            <Button
              variant="outline"
              onClick={() => setInitEscrowOpen(false)}
            >
              Close
            </Button>
            <Button
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
                  await executeAction(
                    `/prepare/escrow/${escrowDefault}/initialize`,
                    { token: selectedToken.address, manager: agreementDefault },
                    setInitEscrowError,
                    setInitEscrowTx
                  );
                } catch (e: any) {
                  setInitEscrowError(e?.message || "Failed to initialize escrow");
                }
              }}
            >
              {isExecuting ? "Initializing..." : "Initialize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

