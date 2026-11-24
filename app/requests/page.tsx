"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/wallet-context";
import { useRequests, RequestStatus } from "@/lib/requests-store";
import { buildSep7Uri } from "@/lib/stellar/sep7";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";
import { QrCode } from "@/components/ui/qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Check, Clock, AlertCircle, Trash2, QrCode as QrCodeIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/utils/commonUtils";

export default function RequestsPage() {
  const { address } = useWallet();
  const { requests, addRequest, updateRequestStatus, deleteRequest, updateExpiredRequests } = useRequests();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [assetCode, setAssetCode] = useState("XLM");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [memo, setMemo] = useState("");
  const [message, setMessage] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");
  const [formError, setFormError] = useState<string | null>(null);

  // Update expired requests on mount and periodically
  useEffect(() => {
    updateExpiredRequests();
    const interval = setInterval(() => updateExpiredRequests(), 60000);
    return () => clearInterval(interval);
  }, [updateExpiredRequests]);

  const handleCreateRequest = () => {
    setFormError(null);

    if (!address) {
      setFormError("Please connect your wallet first");
      return;
    }

    // Validate amount if provided
    if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      setFormError("Amount must be a positive number");
      return;
    }

    // Validate expiry
    const expiry = Number(expiryHours);
    if (isNaN(expiry) || expiry < 1) {
      setFormError("Expiry must be at least 1 hour");
      return;
    }

    try {
      const uri = buildSep7Uri({
        destination: address,
        amount: amount || undefined,
        assetCode: assetCode || undefined,
        assetIssuer: assetIssuer || undefined,
        memo: memo || undefined,
        message: message || undefined,
      });

      addRequest({
        destination: address,
        amount: amount || undefined,
        assetCode: assetCode || undefined,
        assetIssuer: assetIssuer || undefined,
        memo: memo || undefined,
        message: message || undefined,
        expiryHours: expiry,
        uri,
      });

      // Reset form
      setAmount("");
      setAssetCode("XLM");
      setAssetIssuer("");
      setMemo("");
      setMessage("");
      setExpiryHours("24");
      setIsCreateDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create request");
    }
  };

  const handleCopyLink = (requestId: string, uri: string) => {
    copyToClipboardWithTimeout(uri, () => {
      setCopiedId(requestId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleMarkAsPaid = (requestId: string) => {
    updateRequestStatus(requestId, "Paid");
  };

  const handleDeleteRequest = (requestId: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      deleteRequest(requestId);
    }
  };

  const openQrDialog = (requestId: string) => {
    setSelectedRequest(requestId);
    setIsQrDialogOpen(true);
  };

  const selectedRequestData = requests.find((r) => r.id === selectedRequest);

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "Paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <Check className="w-3 h-3" />
            Paid
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        );
    }
  };

  const isExpired = (request: typeof requests[0]) => {
    if (!request.expiresAt) return false;
    return new Date(request.expiresAt) < new Date();
  };

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Payment Requests</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create and track SEP-0007 payment requests with shareable links
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Payment Request</DialogTitle>
              <DialogDescription>
                Generate a shareable payment link with QR code for receiving funds.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (optional)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0000001"
                  min="0"
                  placeholder="e.g., 10.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetCode">Asset Code</Label>
                <Input
                  id="assetCode"
                  placeholder="e.g., XLM, USDC"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetIssuer">Asset Issuer (optional)</Label>
                <Input
                  id="assetIssuer"
                  placeholder="Stellar address for custom assets"
                  value={assetIssuer}
                  onChange={(e) => setAssetIssuer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memo">Memo (optional)</Label>
                <Input
                  id="memo"
                  placeholder="Reference or invoice number"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Input
                  id="message"
                  placeholder="Description for the payer"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expires in (hours)</Label>
                <Input
                  id="expiry"
                  type="number"
                  min="1"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRequest}>Create Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Plus className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">No payment requests</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Create your first payment request to start receiving funds
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        </div>
      ) : (
        <div className="bg-foreground border rounded-[1.5rem] border-[#2D2D2D] p-2">
          <div className="space-y-2">
            {requests.map((request) => {
              const expired = isExpired(request);
              return (
                <div
                  key={request.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    expired || request.status === "Expired"
                      ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {format(new Date(request.createdAt), "MMM d, yyyy • h:mm a")}
                        </span>
                      </div>
                      <div className="mb-2">
                        {request.amount && (
                          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {request.amount} {request.assetCode || "XLM"}
                          </p>
                        )}
                        {!request.amount && (
                          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                            Any amount
                          </p>
                        )}
                      </div>
                      {request.memo && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                          Memo: {request.memo}
                        </p>
                      )}
                      {request.message && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {request.message}
                        </p>
                      )}
                      {request.expiresAt && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Expires: {formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openQrDialog(request.id)}
                        disabled={expired || request.status !== "Pending"}
                        title="Show QR Code"
                      >
                        <QrCodeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyLink(request.id, request.uri)}
                        disabled={expired || request.status !== "Pending"}
                        title="Copy Link"
                      >
                        {copiedId === request.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      {request.status === "Pending" && !expired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsPaid(request.id)}
                          title="Mark as Paid"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRequest(request.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Request QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code with a Stellar wallet to send payment
            </DialogDescription>
          </DialogHeader>
          {selectedRequestData && (
            <div className="flex flex-col items-center py-4">
              <QrCode
                value={selectedRequestData.uri}
                downloadFileName={`stellopay-request-${selectedRequestData.id}.png`}
                size={256}
              />
              {selectedRequestData.amount && (
                <p className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  {selectedRequestData.amount} {selectedRequestData.assetCode || "XLM"}
                </p>
              )}
              {selectedRequestData.memo && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Memo: {selectedRequestData.memo}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
