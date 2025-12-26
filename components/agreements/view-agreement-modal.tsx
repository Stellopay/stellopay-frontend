"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";

function shortHex(addr: string) {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

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
  1: "Pending",
  2: "Resolved",
};

interface ViewAgreementModalProps {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewAgreementModal({
  agreementId,
  isOpen,
  onClose,
}: ViewAgreementModalProps) {
  const { address } = useWallet();
  const [agreementDefault, setAgreementDefault] = useState<string>("");
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    void apiGet<{ address: string }>("/agreement/defaults")
      .then((d) => setAgreementDefault(d.address))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && agreementId && agreementDefault) {
      void loadAgreementDetails();
    } else {
      setAgreementDetails(null);
      setDetailsError(null);
    }
  }, [isOpen, agreementId, agreementDefault]);

  const loadAgreementDetails = async () => {
    if (!agreementDefault || !agreementId) return;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const id = BigInt(agreementId);
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
        agreement_id: agreementId,
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
      setAgreementDetails(details);
    } catch (err: any) {
      setDetailsError(err?.message || "Failed to load agreement details");
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0c1d] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">View Agreement Details</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
            Agreement ID: {agreementId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#598EFF]" />
              <span className="ml-2 text-[#A0A0A0]">Loading agreement details...</span>
            </div>
          ) : detailsError ? (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-3">
              {detailsError}
            </div>
          ) : agreementDetails ? (
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
                {agreementDetails.contributor && agreementDetails.contributor !== "0x0" && (
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
                {agreementDetails.token && (
                  <div>
                    <span className="text-[#A0A0A0]">Token:</span>
                    <span className="text-white ml-2 font-mono">{shortHex(agreementDetails.token)}</span>
                  </div>
                )}
                {agreementDetails.escrow && (
                  <div>
                    <span className="text-[#A0A0A0]">Escrow:</span>
                    <span className="text-white ml-2 font-mono">{shortHex(agreementDetails.escrow)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

