import { ArrowDownToLine, Send, Plus } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiGet, apiPost } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import { useToast } from "@/components/ui/toast";
import { getWalletErrorMessage } from "@/utils/wallet-error-handler";

export default function DashboardHeader({ 
  pageTitle, 
  onCreateAgreementClick 
}: { 
  pageTitle: string;
  onCreateAgreementClick?: () => void;
}) {
  const { address, sessionToken, isVerified, isConnecting, isExecuting, executeCall } =
    useWallet();
  const { showToast } = useToast();
  
  // Don't show toast for wallet errors here - let connect-wallet-button handle it
  // This component only shows toasts for its own specific errors

  // --- Send Payment (Escrow release) ---
  const [sendOpen, setSendOpen] = useState(false);
  const [escrowDefault, setEscrowDefault] = useState<string>("");
  const [releaseAgreementId, setReleaseAgreementId] = useState("");
  const [releaseTo, setReleaseTo] = useState("");
  const [releaseAmount, setReleaseAmount] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendTx, setSendTx] = useState<string | null>(null);

  // --- Request Payment (Agreement claim) ---
  const [requestOpen, setRequestOpen] = useState(false);
  const [agreementDefault, setAgreementDefault] = useState<string>("");
  const [claimAgreementId, setClaimAgreementId] = useState("");
  const [claimMode, setClaimMode] = useState<"time" | "milestone" | "payroll">("time");
  const [milestoneId, setMilestoneId] = useState("0");
  const [employeeIndex, setEmployeeIndex] = useState("0");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestTx, setRequestTx] = useState<string | null>(null);

  useEffect(() => {
    if (!sendOpen) return;
    setSendError(null);
    setSendTx(null);
    void apiGet<{ address: string }>("/escrow/defaults")
      .then((d) => setEscrowDefault(d.address))
      .catch((e) => setSendError(e instanceof Error ? e.message : "Failed to load escrow defaults"));
  }, [sendOpen]);

  useEffect(() => {
    if (!requestOpen) return;
    setRequestError(null);
    setRequestTx(null);
    void apiGet<{ address: string }>("/agreement/defaults")
      .then((d) => setAgreementDefault(d.address))
      .catch((e) =>
        setRequestError(e instanceof Error ? e.message : "Failed to load agreement defaults"),
      );
  }, [requestOpen]);

  const authHint = useMemo(() => {
    if (isConnecting) return "Connecting wallet…";
    if (!address) return "Connect a wallet to continue.";
    if (!isVerified || !sessionToken) return "Wallet connected, but not verified with backend.";
    return null;
  }, [address, isConnecting, isVerified, sessionToken]);

  const onSendPayment = async () => {
    setSendError(null);
    setSendTx(null);
    if (!address || !sessionToken) {
      setSendError("Please connect & verify your wallet first.");
      return;
    }
    if (!escrowDefault) {
      setSendError("Escrow address not loaded.");
      return;
    }
    if (!releaseAgreementId) {
      setSendError("Please enter an agreement ID.");
      return;
    }
    if (!releaseTo || !releaseTo.startsWith("0x")) {
      setSendError("Please enter a valid recipient address (0x…).");
      return;
    }
    if (!releaseAmount) {
      setSendError("Please enter an amount.");
      return;
    }

    const prepared = await apiPost<{ call: any }>(
      `/prepare/escrow/${escrowDefault}/release`,
      {
        wallet_address: address,
        session_token: sessionToken,
        agreement_id: releaseAgreementId,
        to: releaseTo,
        amount: releaseAmount,
      },
    );

    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) {
      setSendTx(tx.transaction_hash);
      showToast("Payment sent", "Transaction submitted successfully.", "success");
    } else {
      // Error toast is shown by connect-wallet-button component
      setSendError("Transaction failed. Please try again.");
    }
  };

  const onRequestPayment = async () => {
    setRequestError(null);
    setRequestTx(null);
    if (!address || !sessionToken) {
      setRequestError("Please connect & verify your wallet first.");
      return;
    }
    if (!agreementDefault) {
      setRequestError("Agreement address not loaded.");
      return;
    }
    if (!claimAgreementId) {
      setRequestError("Please enter an agreement ID.");
      return;
    }

    let path: string;
    let body: any;

    if (claimMode === "time") {
      path = `/prepare/agreement/${agreementDefault}/claim_time_based`;
      body = {
        wallet_address: address,
        session_token: sessionToken,
        agreement_id: claimAgreementId,
      };
    } else if (claimMode === "milestone") {
      path = `/prepare/agreement/${agreementDefault}/claim_milestone`;
      body = {
        wallet_address: address,
        session_token: sessionToken,
        agreement_id: claimAgreementId,
        milestone_id: parseInt(milestoneId),
      };
    } else {
      // Payroll mode
      path = `/prepare/agreement/${agreementDefault}/claim_payroll`;
      body = {
        wallet_address: address,
        session_token: sessionToken,
        agreement_id: claimAgreementId,
        employee_index: parseInt(employeeIndex),
      };
    }

    const prepared = await apiPost<{ call: any }>(path, body);
    const tx = await executeCall(prepared.call);
    if (tx?.transaction_hash) {
      setRequestTx(tx.transaction_hash);
      showToast("Payment requested", "Transaction submitted successfully.", "success");
    } else {
      // Error toast is shown by connect-wallet-button component
      setRequestError("Transaction failed. Please try again.");
    }
  };

  return (
    <div className="w-full px-4 md:px-10 pt-6 pb-4 border-b border-[#1A1A1A]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-white text-2xl font-semibold">{pageTitle}</h1>

        {pageTitle === "My Agreements" && onCreateAgreementClick && (
          <button
            onClick={onCreateAgreementClick}
            disabled={!address}
            className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Agreement
          </button>
        )}
        {pageTitle !== "My Agreements" && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Dialog open={sendOpen} onOpenChange={setSendOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-md border border-[#2C2C2C] hover:bg-[#111] cursor-pointer transition w-full sm:w-auto">
                <Send className="h-4 w-4" />
                Send Payment
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0D0D0D] border border-[#2D2D2D] text-white">
              <DialogHeader>
                <DialogTitle>Send Payment</DialogTitle>
                <DialogDescription className="text-[#A0A0A0]">
                  Releases funds from the Payroll Escrow (on-chain). You will sign a transaction in
                  your wallet.
                </DialogDescription>
              </DialogHeader>

              {authHint ? (
                <div className="text-sm text-[#EB6945]">{authHint}</div>
              ) : null}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Escrow address</label>
                  <input
                    value={escrowDefault}
                    onChange={(e) => setEscrowDefault(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                  <input
                    value={releaseAgreementId}
                    onChange={(e) => setReleaseAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Recipient address</label>
                  <input
                    value={releaseTo}
                    onChange={(e) => setReleaseTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Amount (uint256 as decimal)</label>
                  <input
                    value={releaseAmount}
                    onChange={(e) => setReleaseAmount(e.target.value)}
                    placeholder="e.g. 1000000"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>
              </div>

              {sendError ? <div className="text-sm text-red-400">{sendError}</div> : null}
              {sendTx ? (
                <div className="text-sm text-[#A0A0A0]">
                  Submitted: <span className="text-white">{sendTx}</span>
                </div>
              ) : null}

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setSendOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!address || !sessionToken || isExecuting}
                  onClick={() => void onSendPayment().catch((e) => setSendError(String(e?.message ?? e)))}
                  className="px-4 py-2 rounded-md bg-[#598EFF] text-white hover:bg-[#4A7CE8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isExecuting ? "Submitting…" : "Submit"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md border border-[#E5E5E5]/10 hover:bg-[#f3f3f3] cursor-pointer transition w-full sm:w-auto">
                <ArrowDownToLine className="h-4 w-4" />
                Request Payment
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0D0D0D] border border-[#2D2D2D] text-white">
              <DialogHeader>
                <DialogTitle>Request Payment</DialogTitle>
                <DialogDescription className="text-[#A0A0A0]">
                  Claims from a Work Agreement (on-chain). You will sign a transaction in your
                  wallet.
                </DialogDescription>
              </DialogHeader>

              {authHint ? (
                <div className="text-sm text-[#EB6945]">{authHint}</div>
              ) : null}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Agreement address</label>
                  <input
                    value={agreementDefault}
                    onChange={(e) => setAgreementDefault(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-[#E5E5E5]">Agreement ID</label>
                  <input
                    value={claimAgreementId}
                    onChange={(e) => setClaimAgreementId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimMode("time")}
                    className={`px-3 py-2 rounded-md border cursor-pointer ${
                      claimMode === "time"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    Time-based
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimMode("milestone")}
                    className={`px-3 py-2 rounded-md border cursor-pointer ${
                      claimMode === "milestone"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimMode("payroll")}
                    className={`px-3 py-2 rounded-md border cursor-pointer ${
                      claimMode === "payroll"
                        ? "bg-white text-black border-white shadow"
                        : "border-[#242428] bg-transparent text-[#E5E5E5]"
                    }`}
                  >
                    Payroll
                  </button>
                </div>

                {claimMode === "milestone" ? (
                  <div className="space-y-1">
                    <label className="text-sm text-[#E5E5E5]">Milestone ID</label>
                    <input
                      value={milestoneId}
                      onChange={(e) => setMilestoneId(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                    />
                  </div>
                ) : claimMode === "payroll" ? (
                  <div className="space-y-1">
                    <label className="text-sm text-[#E5E5E5]">Employee Index</label>
                    <input
                      value={employeeIndex}
                      onChange={(e) => setEmployeeIndex(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border border-[#242428] text-white px-4 py-2 rounded-md outline-none"
                    />
                    <div className="text-xs text-[#A0A0A0]">
                      The index of the employee in the payroll (0-based)
                    </div>
                  </div>
                ) : null}
              </div>

              {requestError ? <div className="text-sm text-red-400">{requestError}</div> : null}
              {requestTx ? (
                <div className="text-sm text-[#A0A0A0]">
                  Submitted: <span className="text-white">{requestTx}</span>
                </div>
              ) : null}

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setRequestOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#2C2C2C] bg-transparent text-white hover:bg-[#111]"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!address || !sessionToken || isExecuting}
                  onClick={() =>
                    () => void onRequestPayment()
                  }
                  className="px-4 py-2 rounded-md bg-[#598EFF] text-white hover:bg-[#4A7CE8] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isExecuting ? "Submitting…" : "Submit"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        )}
      </div>
    </div>
  );
}
