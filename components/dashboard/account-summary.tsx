"use client";

import { useState } from "react";
import Image from "next/image";
import { copyToClipboardWithTimeout } from "@/utils/clipboardUtils";
import { AccountSummaryCardSkeleton } from "@/components/ui/card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountSummary } from "@/hooks/useAccountSummary";

export default function AccountSummary() {
  const [copied, setCopied] = useState(false);
  const { data, isLoading, error, refetch } = useAccountSummary();

  if (isLoading) {
    return (
      <div className="max-w-full p-4 rounded-xl h-[12.75rem] my-6 border-[1px] border-[#2D2D2D] bg-[#0D0D0D80]">
        <div className="w-full h-8 gap-3 mb-4 flex items-center">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="max-w-full h-[7.5rem] gap-4 justify-between flex overflow-hidden">
          <AccountSummaryCardSkeleton />
          <AccountSummaryCardSkeleton />
          <AccountSummaryCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full my-6">
        <ErrorState
          title="Failed to Load"
          description={error}
          onRetry={refetch}
          retrying={isLoading}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-full my-6">
        <ErrorState
          title="Failed to Load"
          description="Failed to load account summary."
          onRetry={refetch}
          retrying={isLoading}
        />
      </div>
    );
  }

  if (data.isUnfunded) {
    return (
      <div className="max-w-full my-6">
        <EmptyState
          variant="default"
          title="Account not funded yet"
          description="This address has no account on the Stellar network yet. Fund it with XLM from another wallet or a network faucet, then refresh to see your balances."
          action={{ label: "Refresh", onClick: refetch }}
        />
      </div>
    );
  }

  const summary = [
    {
      accountInfo: "Your Account Balance",
      amount: data.balance,
      image: "/copy-01.png",
      item: "Copy Address",
      address: data.walletAddress,
      accountImage: "/piggy-bank.png",
      note:
        data.trustlines.length > 0
          ? `${data.trustlines.length} trustline${data.trustlines.length === 1 ? "" : "s"}`
          : "",
      noteTitle: data.trustlines
        .map((line) => `${line.assetCode}: ${line.balance}`)
        .join(", "),
    },
    {
      accountInfo: "Paid This Month",
      amount: data.paidThisMonth,
      item: "ITEMS",
      address: String(data.paidThisMonthCount),
      accountImage: "/dollar-02.png",
      note: "",
      noteTitle: "",
    },
    {
      accountInfo: "To be Paid",
      amount: data.toBePaid,
      item: "ITEMS",
      address: String(data.toBePaidCount),
      accountImage: "/dollar-01.png",
      note: "",
      noteTitle: "",
    },
  ];

  return (
    <div className="max-w-full p-4 rounded-xl h-[12.75rem] my-6 border-[1px] border-[#2D2D2D] bg-[#0D0D0D80]">
      <div className="w-full h-8 gap-3 mb-4 flex items-center">
        <div className="w-8 h-8 rounded-[8px] border border-[#2D2D2D] flex justify-center items-center">
          <Image
            src="/bank.png"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-[Inter] text-base leading-[145%] align-middle">
          Account Summary
        </h1>
        {data.source === "mock" && (
          <span
            data-testid="demo-data-badge"
            className="rounded border border-[#2D2D2D] px-2 py-0.5 text-[11px] text-[#8A8A8A]"
          >
            Demo data
          </span>
        )}
      </div>

      <div className="max-w-full h-[7.5rem] gap-4 justify-between flex overflow-hidden">
        {summary.map((info, index) => (
          <div className="w-full" key={`${info.accountInfo}-${index}`}>
            <div className="h-[7.5rem] py-4 px-6 border border-[#2E2E2E] rounded-xl">
              <div className="w-full flex items-center gap-2 mb-2">
                <div className="text-sm align-middle font-[Inter]">
                  {info.accountInfo}
                </div>
                <Image
                  src={info.accountImage}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                  aria-hidden="true"
                />
              </div>
              <div className="font-semibold text-2xl align-middle font-[Inter] mb-1 font-mono tabular-nums">
                {info.amount}
              </div>
              <p className="max-w-[16.4375rem] h-[17px] flex items-center font-medium text-xs align-middle font-[Inter] text-[#3B3B3B]">
                {info.item} :
                <span className="text-[#D8D8D8] cursor-pointer">
                  {info.address}
                  {info.note && (
                    <span
                      className="ml-2"
                      title={info.noteTitle}
                      aria-label={`${info.note}: ${info.noteTitle}`}
                    >
                      · {info.note}
                    </span>
                  )}
                </span>
                {info.image && (
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboardWithTimeout(info.address, setCopied, 1200)
                    }
                    className="ml-1 inline-flex items-center"
                    aria-label="Copy address"
                  >
                    <Image
                      src={info.image}
                      alt=""
                      width={14}
                      height={14}
                      className="object-contain w-3.5 h-3.5 cursor-pointer"
                      aria-hidden="true"
                    />
                  </button>
                )}
                {copied && info.item === "Copy Address" && (
                  <span className="ml-2 text-[#E5E5E5]">Copied</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
