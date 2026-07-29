"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import AccountSummaryCard from "./account-summary-card";
import {
  summaryCardsData,
  SummaryCardsSkeleton,
  AccountSummaryCardProps,
} from "./summary-data";
import {
  Wallet,
  BarChart3,
  ArrowRight,
  PieChart,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatAddress, useWallet } from "@/context/wallet-context";

// ─── Loading / error state types ─────────────────────────────────────────────

type SummaryState =
  | { status: "loading" }
  | { status: "success"; cards: AccountSummaryCardProps[] }
  | { status: "error"; message: string };

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountOverview() {
  const { address, isConnected, connect } = useWallet();

  const formattedAddress = useMemo(() => formatAddress(address), [address]);
  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  // ── Data resolution ─────────────────────────────────────────────────────
  const [summaryState, setSummaryState] = useState<SummaryState>({
    status: "loading",
  });

  // Keep static icon/card render data stable across wallet context ticks.
  const icons = useMemo(
    () => [
      <Wallet
        key="wallet"
        className="w-6 h-6 text-blue-600 dark:text-blue-400"
      />,
      <BarChart3
        key="chart"
        className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
      />,
      <PieChart
        key="pie"
        className="w-6 h-6 text-amber-600 dark:text-amber-400"
      />,
    ],
    [],
  );

  const loadSummary = useCallback(() => {
    setSummaryState({ status: "loading" });

    // The data currently comes from a static module (summaryCardsData).
    // This async wrapper keeps the loading/error contract intact so that
    // when a real API replaces the static import the component needs no
    // structural changes — only the Promise body changes.
    Promise.resolve(summaryCardsData)
      .then((data) => {
        const cards = data.map((card, idx) => ({ ...card, icon: icons[idx] }));
        setSummaryState({ status: "success", cards });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load account summary.";
        setSummaryState({ status: "error", message });
      });
  }, [icons]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full">
      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-2 flex items-center gap-4 flex-wrap">
          Welcome back,
          {isConnected ? (
            <>
              <span
                className="text-zinc-900 dark:text-white font-mono"
                data-testid="account-overview-address"
              >
                {formattedAddress}
              </span>
              <span className="animate-bounce">👋</span>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              data-testid="account-overview-connect"
              className="text-base md:text-lg font-semibold px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          {isConnected
            ? "Manage your assets and payments across all chains easily."
            : "Connect your Stellar wallet to view balances and send payments."}
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Account Overview
        </h2>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
          View Full Account <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Grid — loading / error / success */}
      {summaryState.status === "loading" && (
        <SummaryCardsSkeleton shade="dark" />
      )}

      {summaryState.status === "error" && (
        <div
          role="alert"
          data-testid="summary-error"
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center"
        >
          <AlertCircle
            className="h-8 w-8 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-destructive">
            {summaryState.message}
          </p>
          <button
            type="button"
            onClick={loadSummary}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {summaryState.status === "success" && (
        <div
          data-testid="summary-cards-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {summaryState.cards.map((card) => (
            <AccountSummaryCard key={card.title} {...card} />
          ))}
        </div>
      )}

      {/* Mobile Button */}
      <button className="sm:hidden w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold shadow-lg cursor-pointer">
        View Full Account <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
