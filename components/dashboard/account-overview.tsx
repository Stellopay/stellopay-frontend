'use client';

import React, { useCallback, useMemo } from 'react';
import AccountSummaryCard from './account-summary-card';
import { summaryCardsData } from './summary-data';
import { Wallet, BarChart3, ArrowRight, PieChart } from "lucide-react";
import { formatAddress, useWallet } from "@/context/wallet-context";

export default function AccountOverview() {
  const { address, isConnected, connect } = useWallet();

  const formattedAddress = useMemo(() => formatAddress(address), [address]);
  const handleConnect = useCallback(() => {
    connect();
  }, [connect]);

  // Keep static icon/card render data stable across wallet context ticks.
  const icons = useMemo(
    () => [
      <Wallet key="wallet" className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      <BarChart3 key="chart" className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      <PieChart key="pie" className="w-6 h-6 text-amber-600 dark:text-amber-400" />
    ],
    [],
  );

  const accountSummaryCards = useMemo(
    () =>
      summaryCardsData.map((card, idx) => ({
        ...card,
        icon: icons[idx],
      })),
    [icons],
  );

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
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Account Overview</h2>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
          View Full Account <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountSummaryCards.map((card) => (
          <AccountSummaryCard
            key={card.title}
            {...card}
          />
        ))}
      </div>

      {/* Mobile Button */}
      <button className="sm:hidden w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-semibold shadow-lg cursor-pointer">
        View Full Account <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
