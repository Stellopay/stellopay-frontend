"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/backend";
import { useWallet } from "@/context/wallet-context";
import WalletConnectionModal from "@/components/wallet/wallet-connection-modal";
import ViewAgreementModal from "@/components/agreements/view-agreement-modal";
import CreateAgreementModal from "@/components/agreements/create-agreement-modal";

function shortHex(addr: string) {
  if (!addr) return "—";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const statusLabels: Record<number, string> = {
  0: "Created",
  1: "Active",
  2: "Paused",
  3: "Cancelled",
  4: "Completed",
};

const modeLabels: Record<number, string> = {
  0: "Escrow",
  1: "Payroll",
};

export default function AgreementsPage() {
  const router = useRouter();
  const { address, isVerified, isInitializing, sessionToken } = useWallet();
  const [myAgreements, setMyAgreements] = useState<Array<{
    agreement_id: string;
    employer: string;
    contributor: string;
    status: number;
    mode: number;
    total_amount: string;
    paid_amount: string;
  }>>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [agreementsError, setAgreementsError] = useState<string | null>(null);
  const [agreementDefault, setAgreementDefault] = useState<string>("");
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    void apiGet<{ address: string }>("/agreement/defaults")
      .then((d) => setAgreementDefault(d.address))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Only attempt to load if we have all prerequisites
    if (address && agreementDefault && isVerified && !hasLoadedOnce) {
      void loadAgreements();
    }
    // Keep loading state true while waiting for prerequisites
    // Only set to false if we don't have wallet connection (handled by showModal check)
  }, [address, agreementDefault, isVerified, hasLoadedOnce]);

  const loadAgreements = async () => {
    if (!address || !agreementDefault) return;
    setLoadingAgreements(true);
    setAgreementsError(null);
    setHasLoadedOnce(true);
    try {
      const data = await apiGet<{ agreements: typeof myAgreements }>(
        `/agreement/${agreementDefault}/list/${address}?refresh=true`
      );
      setMyAgreements(data.agreements);
    } catch (e: any) {
      setAgreementsError(e?.message || "Failed to load agreements");
    } finally {
      setLoadingAgreements(false);
    }
  };

  const handleCreateSuccess = () => {
    // Refresh agreements list after successful creation
    void loadAgreements();
  };

  const handleAgreementClick = (agreementId: string) => {
    setSelectedAgreementId(agreementId);
    setIsModalOpen(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-[#9CA3AF]">Loading...</p>
        </div>
      </div>
    );
  }

  const showModal = !address || !isVerified;
  // Determine if we should show loading: either actively loading OR waiting for prerequisites
  const shouldShowLoading = loadingAgreements || (address && isVerified && !agreementDefault && !hasLoadedOnce);

  return (
    <div className="min-h-screen">
      <WalletConnectionModal />
      <ViewAgreementModal
        agreementId={selectedAgreementId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgreementId(null);
        }}
      />
      <CreateAgreementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
      {showModal ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#9CA3AF]">Please connect your wallet to continue</p>
          </div>
        </div>
      ) : (
        <>
          <DashboardHeader 
            pageTitle="My Agreements" 
            onCreateAgreementClick={() => setIsCreateModalOpen(true)}
          />
          <main className="px-4 md:px-10 pt-6 pb-8">
            <Card className="bg-[#0D0D0D80] border-[#2D2D2D] rounded-[0.875rem]">
              <CardHeader>
                <div>
                  <CardTitle className="text-white text-2xl mb-2">My Agreements</CardTitle>
                  <CardDescription className="text-[#A0A0A0]">
                    View all agreements where you are the employer, contributor, or employee
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {agreementsError ? (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md p-3">
                    {agreementsError}
                  </div>
                ) : null}

                {shouldShowLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="ml-2 text-[#A0A0A0]">Loading agreements...</span>
                  </div>
                ) : myAgreements.length === 0 ? (
                  <div className="text-sm text-[#A0A0A0] text-center py-12">
                    <p className="mb-2">No agreements found.</p>
                    <p>Create an agreement to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAgreements.map((agreement) => (
                      <div
                        key={agreement.agreement_id}
                        className="p-4 rounded-md bg-[#0D0D0D] border border-[#242428] hover:border-[#598EFF]/50 transition cursor-pointer"
                        onClick={() => handleAgreementClick(agreement.agreement_id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-white font-semibold text-lg">
                              Agreement #{agreement.agreement_id}
                            </div>
                            <div className="text-sm text-[#A0A0A0] mt-1">
                              {modeLabels[agreement.mode]} • {statusLabels[agreement.status]}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#A0A0A0]">Total</div>
                            <div className="text-white font-mono text-sm font-semibold">
                              {agreement.total_amount}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs border-t border-[#242428] pt-3">
                          <div>
                            <span className="text-[#A0A0A0]">Employer:</span>
                            <span className="text-white ml-2 font-mono">
                              {shortHex(agreement.employer)}
                            </span>
                          </div>
                          {agreement.contributor && agreement.contributor !== "0x0" && (
                            <div>
                              <span className="text-[#A0A0A0]">Contributor:</span>
                              <span className="text-white ml-2 font-mono">
                                {shortHex(agreement.contributor)}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-[#A0A0A0]">Paid:</span>
                            <span className="text-white ml-2 font-mono">
                              {agreement.paid_amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </>
      )}
    </div>
  );
}

