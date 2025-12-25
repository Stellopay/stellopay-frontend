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
import { apiGet, apiPost } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";

function shortHex(addr: string) {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function ActionTile({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer h-12 w-full rounded-md border border-[#2C2C2C] bg-black text-white px-4 py-2 hover:bg-[#111] transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#598EFF]/40 focus-visible:border-[#598EFF]"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2E2E2E] bg-[#121212]">
        {icon}
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">
        {title}
      </span>
    </button>
  );
}

function ReadOnlyAddress({
  label,
  address,
  onCopied,
}: {
  label: string;
  address: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!address) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-[#A0A0A0]">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-mono">{shortHex(address)}</span>
        <button
          type="button"
          onClick={() => {
            copyToClipboardWithTimeout(address, setCopied, 1200);
            onCopied?.();
          }}
          className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[#2E2E2E] bg-[#121212] p-1 hover:bg-[#1A1A1A]"
          aria-label={`Copy ${label}`}
        >
          <Copy className="w-4 h-4 text-[#E5E5E5]" />
        </button>
        {copied ? <span className="text-xs text-[#E5E5E5]">Copied</span> : null}
      </div>
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
  );
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

interface Employee {
  address: string;
  salary: string;
}

interface Milestone {
  amount: string;
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

  // Initialize escrow
  const [initEscrowOpen, setInitEscrowOpen] = useState(false);
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
  const [selectedTokenKey, setSelectedTokenKey] = useState<string>("STRK");
  const selectedToken = useMemo(
    () => supportedTokens.find((t) => t.key === selectedTokenKey) ?? supportedTokens[0],
    [supportedTokens, selectedTokenKey],
  );
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<string | null>(null);
  const [selectedTokenBalanceError, setSelectedTokenBalanceError] = useState<string | null>(null);
  const [initEscrowError, setInitEscrowError] = useState<string | null>(null);
  const [initEscrowTx, setInitEscrowTx] = useState<string | null>(null);

  // Create Agreement - Mode selection
  const [createAgreementOpen, setCreateAgreementOpen] = useState(false);
  const [agreementMode, setAgreementMode] = useState<AgreementMode>("escrow");
  const [escrowPaymentType, setEscrowPaymentType] = useState<EscrowPaymentType>("time");
  
  // Common agreement fields
  const [agreementTokenKey, setAgreementTokenKey] = useState<string>("STRK");
  const [agreementTokenBalance, setAgreementTokenBalance] = useState<string | null>(null);
  const [agreementTokenBalanceError, setAgreementTokenBalanceError] = useState<string | null>(null);
  
  // Escrow time-based fields
  const [escrowContributor, setEscrowContributor] = useState("");
  const [amountPerPeriod, setAmountPerPeriod] = useState("");
  const [periodSeconds, setPeriodSeconds] = useState("2592000"); // 30 days
  const [numPeriods, setNumPeriods] = useState("1");
  
  // Escrow milestone fields
  const [milestones, setMilestones] = useState<Milestone[]>([{ amount: "" }]);
  
  // Payroll fields
  const [payrollPeriodSeconds, setPayrollPeriodSeconds] = useState("2592000");
  const [payrollNumPeriods, setPayrollNumPeriods] = useState("1");
  const [employees, setEmployees] = useState<Employee[]>([{ address: "", salary: "" }]);
  
  const [createAgreementError, setCreateAgreementError] = useState<string | null>(null);
  const [createAgreementTx, setCreateAgreementTx] = useState<string | null>(null);
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(null);

  // Fund Agreement
  const [fundAgreementOpen, setFundAgreementOpen] = useState(false);
  const [fundAgreementId, setFundAgreementId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundTx, setFundTx] = useState<string | null>(null);

  // Add Employee (for payroll)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addEmployeeAgreementId, setAddEmployeeAgreementId] = useState("");
  const [addEmployeeAddress, setAddEmployeeAddress] = useState("");
  const [addEmployeeSalary, setAddEmployeeSalary] = useState("");
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);
  const [addEmployeeTx, setAddEmployeeTx] = useState<string | null>(null);

  // Add Milestone (for escrow milestone)
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [addMilestoneAgreementId, setAddMilestoneAgreementId] = useState("");
  const [addMilestoneAmount, setAddMilestoneAmount] = useState("");
  const [addMilestoneError, setAddMilestoneError] = useState<string | null>(null);
  const [addMilestoneTx, setAddMilestoneTx] = useState<string | null>(null);

  // Activate agreement
  const [activateOpen, setActivateOpen] = useState(false);
  const [activateAgreementId, setActivateAgreementId] = useState("");
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateTx, setActivateTx] = useState<string | null>(null);

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
    // Reset state while checking
    setEscrowInitialized(null);
    setEscrowToken(null);
    
    void apiGet<{ initialized: boolean; token: string | null; error?: string }>(
      `/escrow/${escrowDefault}/is_initialized`,
    )
      .then((d) => {
        console.log("Escrow initialization check:", d);
        setEscrowInitialized(d.initialized);
        setEscrowToken(d.token);
      })
      .catch((err) => {
        console.error("Error checking escrow initialization:", err);
        // On error, assume not initialized to be safe
        setEscrowInitialized(false);
        setEscrowToken(null);
      });
  }, [escrowDefault]);

  // Fetch token balance for Create Agreement
  useEffect(() => {
    if (!createAgreementOpen) return;
    if (!address) return;
    const token = supportedTokens.find((t) => t.key === agreementTokenKey);
    if (!token?.address || token.address.length === 0) {
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
  }, [createAgreementOpen, address, agreementTokenKey, supportedTokens]);

  // Prefill defaults when dialogs open
  useEffect(() => {
    if (!initEscrowOpen) return;
    setInitEscrowError(null);
    setInitEscrowTx(null);
    setSelectedTokenBalance(null);
    setSelectedTokenBalanceError(null);
  }, [initEscrowOpen]);

  const handleEscrowTokenChange = (key: string) => {
    setSelectedTokenKey(key);
    setSelectedTokenBalance(null);
    setSelectedTokenBalanceError(null);
  };

  useEffect(() => {
    if (!initEscrowOpen) return;
    if (!address) return;
    if (!selectedToken?.address || selectedToken.address.length === 0) {
      setSelectedTokenBalance(null);
      setSelectedTokenBalanceError(
        `Token not configured. Set NEXT_PUBLIC_TOKEN_${selectedToken?.key ?? "STRK"} in .env.local and restart the dev server.`,
      );
      return;
    }
    setSelectedTokenBalanceError(null);
    void apiGet<{ balance: string }>(`/token/${selectedToken.address}/balance/${address}`)
      .then((d) => setSelectedTokenBalance(d.balance))
      .catch(() => {
        setSelectedTokenBalance(null);
        setSelectedTokenBalanceError("Unable to fetch balance");
      });
  }, [initEscrowOpen, address, selectedToken?.address, selectedToken?.key]);

  useEffect(() => {
    if (!createAgreementOpen) return;
    setCreateAgreementError(null);
    setCreateAgreementTx(null);
    setCreatedAgreementId(null);
    setAgreementTokenBalance(null);
    setAgreementTokenBalanceError(null);
  }, [createAgreementOpen]);

  const handleAgreementTokenChange = (key: string) => {
    setAgreementTokenKey(key);
    setAgreementTokenBalance(null);
    setAgreementTokenBalanceError(null);
  };

  useEffect(() => {
    if (!fundAgreementOpen) return;
    setFundError(null);
    setFundTx(null);
  }, [fundAgreementOpen]);

  useEffect(() => {
    if (!addEmployeeOpen) return;
    setAddEmployeeError(null);
    setAddEmployeeTx(null);
  }, [addEmployeeOpen]);

  useEffect(() => {
    if (!addMilestoneOpen) return;
    setAddMilestoneError(null);
    setAddMilestoneTx(null);
  }, [addMilestoneOpen]);

  useEffect(() => {
    if (!activateOpen) return;
    setActivateError(null);
    setActivateTx(null);
  }, [activateOpen]);

  const requireAuth = () => {
    if (!address || !sessionToken) {
      throw new Error("Please connect & verify your wallet first.");
    }
    return { address, sessionToken };
  };

  const submitInitEscrow = async () => {
    setInitEscrowError(null);
    setInitEscrowTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!escrowDefault || !agreementDefault) {
      throw new Error("Escrow or Agreement address not loaded.");
    }
    if (!selectedToken?.address) {
      throw new Error(
        "Selected token is not configured. Set NEXT_PUBLIC_TOKEN_USDC / NEXT_PUBLIC_TOKEN_USDT / NEXT_PUBLIC_TOKEN_STRK.",
      );
    }
    const prepared = await apiPost<{ call: any }>(
      `/prepare/escrow/${escrowDefault}/initialize`,
      {
        wallet_address,
        session_token,
        token: selectedToken.address,
        manager: agreementDefault,
      },
    );
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setInitEscrowTx(tx.transaction_hash);
  };

  const submitCreateAgreement = async () => {
    setCreateAgreementError(null);
    setCreateAgreementTx(null);
    setCreatedAgreementId(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!agreementDefault) {
      throw new Error("Agreement address not loaded.");
    }
    const token = supportedTokens.find((t) => t.key === agreementTokenKey);
    if (!token?.address || token.address.length === 0) {
      throw new Error("Selected token is not configured.");
    }

    let prepared;
    if (agreementMode === "payroll") {
      // Create payroll agreement
      if (!payrollPeriodSeconds || !payrollNumPeriods) {
        throw new Error("Please fill in all payroll fields.");
      }
      prepared = await apiPost<{ call: any }>(
        `/prepare/agreement/${agreementDefault}/create_payroll_agreement`,
        {
          wallet_address,
          session_token,
          employer: wallet_address,
          token: token.address,
          period_seconds: payrollPeriodSeconds,
          num_periods: parseInt(payrollNumPeriods),
        },
      );
    } else {
      // Escrow mode
      if (escrowPaymentType === "time") {
        // Time-based escrow
        if (!escrowContributor || !escrowContributor.startsWith("0x")) {
          throw new Error("Please enter a valid contributor address (0x…).");
        }
        if (!amountPerPeriod || !periodSeconds || !numPeriods) {
          throw new Error("Please fill in all time-based fields.");
        }
        prepared = await apiPost<{ call: any }>(
          `/prepare/agreement/${agreementDefault}/create_time_based_agreement`,
          {
            wallet_address,
            session_token,
            employer: wallet_address,
            contributor: escrowContributor,
            token: token.address,
            amount_per_period: amountPerPeriod,
            period_seconds: periodSeconds,
            num_periods: parseInt(numPeriods),
          },
        );
      } else {
        // Milestone-based escrow
        if (!escrowContributor || !escrowContributor.startsWith("0x")) {
          throw new Error("Please enter a valid contributor address (0x…).");
        }
        prepared = await apiPost<{ call: any }>(
          `/prepare/agreement/${agreementDefault}/create_milestone_agreement`,
          {
            wallet_address,
            session_token,
            employer: wallet_address,
            contributor: escrowContributor,
            token: token.address,
          },
        );
      }
    }
    
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) {
      setCreateAgreementTx(tx.transaction_hash);
      // Note: In a real implementation, you'd parse the agreement_id from the transaction receipt
      // For now, we'll let the user enter it manually
    }
  };

  const submitFundAgreement = async () => {
    setFundError(null);
    setFundTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!agreementDefault) {
      throw new Error("Agreement address not loaded.");
    }
    if (!fundAgreementId) {
      throw new Error("Please enter an agreement ID.");
    }
    if (!fundAmount) {
      throw new Error("Please enter an amount.");
    }
    const prepared = await apiPost<{ call: any }>(
      `/prepare/agreement/${agreementDefault}/fund_agreement`,
      {
        wallet_address,
        session_token,
        agreement_id: fundAgreementId,
        amount: fundAmount,
      },
    );
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setFundTx(tx.transaction_hash);
  };

  const submitAddEmployee = async () => {
    setAddEmployeeError(null);
    setAddEmployeeTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!agreementDefault) {
      throw new Error("Agreement address not loaded.");
    }
    if (!addEmployeeAgreementId) {
      throw new Error("Please enter an agreement ID.");
    }
    if (!addEmployeeAddress || !addEmployeeAddress.startsWith("0x")) {
      throw new Error("Please enter a valid employee address (0x…).");
    }
    if (!addEmployeeSalary) {
      throw new Error("Please enter a salary per period.");
    }
    const prepared = await apiPost<{ call: any }>(
      `/prepare/agreement/${agreementDefault}/add_employee`,
      {
        wallet_address,
        session_token,
        agreement_id: addEmployeeAgreementId,
        employee: addEmployeeAddress,
        salary_per_period: addEmployeeSalary,
      },
    );
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setAddEmployeeTx(tx.transaction_hash);
  };

  const submitAddMilestone = async () => {
    setAddMilestoneError(null);
    setAddMilestoneTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!agreementDefault) {
      throw new Error("Agreement address not loaded.");
    }
    if (!addMilestoneAgreementId) {
      throw new Error("Please enter an agreement ID.");
    }
    if (!addMilestoneAmount) {
      throw new Error("Please enter a milestone amount.");
    }
    const prepared = await apiPost<{ call: any }>(
      `/prepare/agreement/${agreementDefault}/add_milestone`,
      {
        wallet_address,
        session_token,
        agreement_id: addMilestoneAgreementId,
        amount: addMilestoneAmount,
      },
    );
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setAddMilestoneTx(tx.transaction_hash);
  };

  const submitActivate = async () => {
    setActivateError(null);
    setActivateTx(null);
    const { address: wallet_address, sessionToken: session_token } = requireAuth();
    if (!agreementDefault) {
      throw new Error("Agreement address not loaded.");
    }
    if (!activateAgreementId) {
      throw new Error("Please enter an agreement ID.");
    }
    const prepared = await apiPost<{ call: any }>(
      `/prepare/agreement/${agreementDefault}/activate`,
      {
        wallet_address,
        session_token,
        agreement_id: activateAgreementId,
      },
    );
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) setActivateTx(tx.transaction_hash);
  };

  const addEmployeeRow = () => {
    setEmployees([...employees, { address: "", salary: "" }]);
  };

  const removeEmployeeRow = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const updateEmployee = (index: number, field: keyof Employee, value: string) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const addMilestoneRow = () => {
    setMilestones([...milestones, { amount: "" }]);
  };

  const removeMilestoneRow = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, value: string) => {
    const updated = [...milestones];
    updated[index] = { amount: value };
    setMilestones(updated);
  };

  return (
    <div className="max-w-full p-4 rounded-xl border border-[#2D2D2D] bg-[#0D0D0D80]">
      <div className="w-full flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
          <ShieldCheck className="w-5 h-5 text-[#E5E5E5]" />
        </div>
        <h1 className="font-[Inter] text-base leading-[145%] align-middle">
          Contract Setup
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
                aria-label="Copy escrow address"
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
                aria-label="Copy agreement address"
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

      <div className="mb-4 flex items-center justify-between gap-4">
        {escrowInitialized === false ? (
          <div className="flex-1 p-3 rounded-md bg-yellow-900/20 border border-yellow-700/50">
            <div className="text-sm text-yellow-400">
              <strong>⚠️ Escrow Not Initialized:</strong> The escrow contract needs to be initialized once before creating agreements. 
              This is typically done by an administrator. Once initialized, all users can create agreements using this escrow.
            </div>
          </div>
        ) : escrowInitialized === true ? (
          <div className="flex-1 p-3 rounded-md bg-green-900/20 border border-green-700/50">
            <div className="text-sm text-green-400">
              <strong>✓ Escrow Initialized:</strong> The escrow is ready to use. You can create agreements without initializing it again.
              {escrowToken ? (
                <span className="text-[#A0A0A0] ml-2">
                  Token: <span className="text-white font-mono">{shortHex(escrowToken)}</span>
                </span>
              ) : null}
            </div>
          </div>
        ) : escrowInitialized === null ? (
          <div className="flex-1 p-3 rounded-md bg-gray-900/20 border border-gray-700/50">
            <div className="text-sm text-[#A0A0A0]">
              Checking escrow initialization status...
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (!escrowDefault) return;
            setEscrowInitialized(null);
            setEscrowToken(null);
            void apiGet<{ initialized: boolean; token: string | null; error?: string }>(
              `/escrow/${escrowDefault}/is_initialized`,
            )
              .then((d) => {
                console.log("Escrow initialization check (manual):", d);
                setEscrowInitialized(d.initialized);
                setEscrowToken(d.token);
              })
              .catch((err) => {
                console.error("Error checking escrow initialization:", err);
                setEscrowInitialized(false);
                setEscrowToken(null);
              });
          }}
          className="px-3 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Dialog open={initEscrowOpen} onOpenChange={setInitEscrowOpen}>
          <DialogTrigger asChild>
            <ActionTile
              icon={<ShieldCheck className="h-5 w-5 text-[#E5E5E5]" />}
              title="Initialize Escrow"
            />
          </DialogTrigger>
          <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Initialize Escrow</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Initialize the Payroll Escrow contract with token and manager (WorkAgreement contract).
                <br />
                <span className="text-yellow-400 font-semibold">
                  ⚠️ This is a one-time operation. The escrow can only be initialized once per deployment.
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
                  {escrowToken ? (
                    <div className="mt-2">
                      Current token: <span className="text-white font-mono">{shortHex(escrowToken)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="text-sm text-[#A0A0A0] mt-2">
                  <strong>Note:</strong> The escrow is multi-tenant and supports multiple agreements. 
                  You can create new agreements using this escrow without re-initializing it. 
                  All agreements will use the same token that was set during initialization.
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <ReadOnlyAddress label="Escrow contract" address={escrowDefault} />
              <ReadOnlyAddress label="Manager (Agreement)" address={agreementDefault} />

              <TokenSelector
                selectedTokenKey={selectedTokenKey}
                onTokenChange={handleEscrowTokenChange}
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
                className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting || escrowInitialized === true}
                onClick={() =>
                  void submitInitEscrow().catch((e) => setInitEscrowError(String(e?.message ?? e)))
                }
                className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExecuting ? "Submitting…" : escrowInitialized === true ? "Already Initialized" : "Submit"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createAgreementOpen} onOpenChange={setCreateAgreementOpen}>
          <DialogTrigger asChild>
            <ActionTile
              icon={<FileText className="h-5 w-5 text-[#E5E5E5]" />}
              title="Create Agreement"
            />
          </DialogTrigger>
          <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Create Agreement</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Create a new work agreement (Payroll or Escrow mode).
              </DialogDescription>
            </DialogHeader>

            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

            <div className="space-y-4">
              <ReadOnlyAddress label="Agreement contract" address={agreementDefault} />
              <ReadOnlyAddress label="Employer" address={address ?? ""} />

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm text-[#E5E5E5]">Agreement Mode</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAgreementMode("payroll")}
                    className={`px-3 py-2 rounded-md border ${
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
                    className={`px-3 py-2 rounded-md border ${
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
                onTokenChange={handleAgreementTokenChange}
                supportedTokens={supportedTokens}
                balance={agreementTokenBalance}
                balanceError={agreementTokenBalanceError}
              />

              {agreementMode === "payroll" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm text-[#E5E5E5]">Period (seconds)</label>
                      <input
                        value={payrollPeriodSeconds}
                        onChange={(e) => setPayrollPeriodSeconds(e.target.value)}
                        placeholder="2592000"
                        className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-[#E5E5E5]">Number of periods</label>
                      <input
                        value={payrollNumPeriods}
                        onChange={(e) => setPayrollNumPeriods(e.target.value)}
                        placeholder="1"
                        className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-[#A0A0A0]">
                    Note: You'll add employees after creating the agreement.
                  </div>
                </>
              ) : (
                <>
                  {/* Escrow Payment Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm text-[#E5E5E5]">Payment Type</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEscrowPaymentType("time")}
                        className={`px-3 py-2 rounded-md border ${
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
                        className={`px-3 py-2 rounded-md border ${
                          escrowPaymentType === "milestone"
                            ? "border-[#598EFF] bg-[#598EFF]/10 text-white"
                            : "border-[#242428] bg-transparent text-[#E5E5E5]"
                        }`}
                      >
                        Milestone
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-[#E5E5E5]">Contributor wallet address</label>
                    <input
                      value={escrowContributor}
                      onChange={(e) => setEscrowContributor(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                    />
                  </div>

                  {escrowPaymentType === "time" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-[#E5E5E5]">Amount per period</label>
                        <input
                          value={amountPerPeriod}
                          onChange={(e) => setAmountPerPeriod(e.target.value)}
                          placeholder="e.g. 1000000"
                          className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-[#E5E5E5]">Period (seconds)</label>
                        <input
                          value={periodSeconds}
                          onChange={(e) => setPeriodSeconds(e.target.value)}
                          placeholder="2592000"
                          className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-[#E5E5E5]">Number of periods</label>
                        <input
                          value={numPeriods}
                          onChange={(e) => setNumPeriods(e.target.value)}
                          placeholder="1"
                          className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#A0A0A0]">
                      Note: You'll add milestones after creating the agreement.
                    </div>
                  )}
                </>
              )}
            </div>

            {createAgreementError ? (
              <div className="text-sm text-red-400">{createAgreementError}</div>
            ) : null}
            {createAgreementTx ? <TxRow txHash={createAgreementTx} /> : null}
            {createdAgreementId ? (
              <div className="text-sm text-[#A0A0A0]">
                Agreement ID: <span className="text-white">{createdAgreementId}</span>
              </div>
            ) : null}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setCreateAgreementOpen(false)}
                className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting}
                onClick={() =>
                  void submitCreateAgreement().catch((e) =>
                    setCreateAgreementError(String(e?.message ?? e)),
                  )
                }
                className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExecuting ? "Submitting…" : "Submit"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={fundAgreementOpen} onOpenChange={setFundAgreementOpen}>
          <DialogTrigger asChild>
            <ActionTile icon={<Coins className="h-5 w-5 text-[#E5E5E5]" />} title="Fund Agreement" />
          </DialogTrigger>
          <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Fund Agreement</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Fund an agreement by depositing tokens to the escrow (requires prior ERC20 approve).
              </DialogDescription>
            </DialogHeader>

            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

            <div className="space-y-4">
              <ReadOnlyAddress label="Agreement contract" address={agreementDefault} />
              <div className="space-y-1">
                <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                <input
                  value={fundAgreementId}
                  onChange={(e) => setFundAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-[#E5E5E5]">Amount (on-chain units)</label>
                <input
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="e.g. 1000000"
                  className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                />
                <div className="text-xs text-[#A0A0A0]">
                  Enter the amount in raw token units (e.g., 1000000 for 1 USDC with 6 decimals)
                </div>
              </div>
            </div>

            {fundError ? <div className="text-sm text-red-400">{fundError}</div> : null}
            {fundTx ? <TxRow txHash={fundTx} /> : null}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setFundAgreementOpen(false)}
                className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting}
                onClick={() =>
                  void submitFundAgreement().catch((e) => setFundError(String(e?.message ?? e)))
                }
                className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExecuting ? "Submitting…" : "Submit"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {agreementMode === "payroll" ? (
          <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
            <DialogTrigger asChild>
              <ActionTile
                icon={<Users className="h-5 w-5 text-[#E5E5E5]" />}
                title="Add Employee"
              />
            </DialogTrigger>
            <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Add Employee to Payroll</DialogTitle>
                <DialogDescription className="text-[#A0A0A0]">
                  Add an employee to a payroll agreement.
                </DialogDescription>
              </DialogHeader>

              {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-4">
                <ReadOnlyAddress label="Agreement contract" address={agreementDefault} />
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                  <input
                    value={addEmployeeAgreementId}
                    onChange={(e) => setAddEmployeeAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Employee address</label>
                  <input
                    value={addEmployeeAddress}
                    onChange={(e) => setAddEmployeeAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Salary per period</label>
                  <input
                    value={addEmployeeSalary}
                    onChange={(e) => setAddEmployeeSalary(e.target.value)}
                    placeholder="e.g. 1000000"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                  />
                </div>
              </div>

              {addEmployeeError ? (
                <div className="text-sm text-red-400">{addEmployeeError}</div>
              ) : null}
              {addEmployeeTx ? <TxRow txHash={addEmployeeTx} /> : null}

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setAddEmployeeOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!address || !sessionToken || isExecuting}
                  onClick={() =>
                    void submitAddEmployee().catch((e) =>
                      setAddEmployeeError(String(e?.message ?? e)),
                    )
                  }
                  className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExecuting ? "Submitting…" : "Submit"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
            <DialogTrigger asChild>
              <ActionTile
                icon={<FileText className="h-5 w-5 text-[#E5E5E5]" />}
                title="Add Milestone"
              />
            </DialogTrigger>
            <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader>
                <DialogTitle>Add Milestone to Agreement</DialogTitle>
                <DialogDescription className="text-[#A0A0A0]">
                  Add a milestone to a milestone-based escrow agreement.
                </DialogDescription>
              </DialogHeader>

              {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

              <div className="space-y-4">
                <ReadOnlyAddress label="Agreement contract" address={agreementDefault} />
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                  <input
                    value={addMilestoneAgreementId}
                    onChange={(e) => setAddMilestoneAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Milestone amount</label>
                  <input
                    value={addMilestoneAmount}
                    onChange={(e) => setAddMilestoneAmount(e.target.value)}
                    placeholder="e.g. 1000000"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                  />
                </div>
              </div>

              {addMilestoneError ? (
                <div className="text-sm text-red-400">{addMilestoneError}</div>
              ) : null}
              {addMilestoneTx ? <TxRow txHash={addMilestoneTx} /> : null}

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setAddMilestoneOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!address || !sessionToken || isExecuting}
                  onClick={() =>
                    void submitAddMilestone().catch((e) =>
                      setAddMilestoneError(String(e?.message ?? e)),
                    )
                  }
                  className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExecuting ? "Submitting…" : "Submit"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
          <DialogTrigger asChild>
            <ActionTile
              icon={<PlayCircle className="h-5 w-5 text-[#E5E5E5]" />}
              title="Activate"
            />
          </DialogTrigger>
          <DialogContent className="bg-[#1a0c1d] border border-[#2D2D2D] text-white max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>Activate Agreement</DialogTitle>
              <DialogDescription className="text-[#A0A0A0]">
                Activates the Work Agreement so contributors/employees can claim.
              </DialogDescription>
            </DialogHeader>

            {authHint ? <div className="text-sm text-[#EB6945]">{authHint}</div> : null}

            <div className="space-y-4">
              <ReadOnlyAddress label="Agreement contract" address={agreementDefault} />
              <div className="space-y-1">
                <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                <input
                  value={activateAgreementId}
                  onChange={(e) => setActivateAgreementId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none font-mono text-sm"
                />
              </div>
              <div className="text-sm text-[#A0A0A0]">
                This will activate the agreement contract. Make sure the escrow is funded before
                activating.
              </div>
            </div>

            {activateError ? <div className="text-sm text-red-400">{activateError}</div> : null}
            {activateTx ? <TxRow txHash={activateTx} /> : null}

            <DialogFooter>
              <button
                type="button"
                onClick={() => setActivateOpen(false)}
                className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!address || !sessionToken || isExecuting}
                onClick={() =>
                  void submitActivate().catch((e) => setActivateError(String(e?.message ?? e)))
                }
                className="px-4 py-2 rounded-md bg-white text-black border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExecuting ? "Submitting…" : "Submit"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
