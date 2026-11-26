"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/wallet-context";
import { loadContracts, transitionContract } from "@/lib/contracts-store";
import { getContractActions } from "@/lib/contracts-state";
import { createAccountScope } from "@/lib/realtime-registry";
import type { Contract, ContractAction, ContractStatus } from "@/types/contract";
import { formatMinorUnits } from "@/utils/moneyUtils";
import { cn } from "@/utils/commonUtils";
import { ContractActionDialog } from "./components/contract-action-dialog";

const STATUS_FILTERS: Array<"all" | ContractStatus> = [
  "all",
  "draft",
  "active",
  "completed",
  "cancelled",
];

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function ContractsPage() {
  const { address, network } = useWallet();
  const account = createAccountScope(network.id, address);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>(
    "all",
  );

  const refresh = useCallback(() => {
    setContracts(loadContracts(account));
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const result: Record<"all" | ContractStatus, number> = {
      all: contracts.length,
      draft: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const contract of contracts) result[contract.status] += 1;
    return result;
  }, [contracts]);

  const visibleContracts = useMemo(
    () =>
      statusFilter === "all"
        ? contracts
        : contracts.filter((contract) => contract.status === statusFilter),
    [contracts, statusFilter],
  );

  const handleAction = (contract: Contract, action: ContractAction) => {
    try {
      transitionContract(account, contract.id, action);
      refresh();
      toast.success(`Contract marked as ${CONTRACT_ACTION_PAST[action]}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Update failed.",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Contracts
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create escrow contracts, track milestones and manage their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <Plus aria-hidden />
            New contract
          </Link>
        </Button>
      </div>

      <div
        role="group"
        aria-label="Filter contracts by status"
        className="mb-6 flex flex-wrap gap-2"
      >
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              statusFilter === status
                ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
            )}
          >
            {status} ({counts[status]})
          </button>
        ))}
      </div>

      {visibleContracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <FileText className="mx-auto h-10 w-10 text-zinc-400" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            No contracts found
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {contracts.length === 0
              ? "Create your first escrow contract to get started."
              : "Try a different status filter."}
          </p>
          {contracts.length === 0 && (
            <Button asChild className="mt-6">
              <Link href="/contracts/new">Create contract</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">Escrow contracts</caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Contract
                </th>
                <th scope="col" className="px-4 py-3">
                  Parties
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Milestones
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visibleContracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{contract.title}</div>
                    <div className="max-w-[12rem] truncate text-xs text-zinc-500">
                      {contract.id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {contract.parties.map((party) => party.name).join(" / ")}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {contract.releaseCondition.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {contract.currency}{" "}
                    {formatMinorUnits(contract.totalAmountMinorUnits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {contract.milestones.length}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                        STATUS_STYLES[contract.status],
                      )}
                    >
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {getContractActions(contract.status).map((action) => (
                        <ContractActionDialog
                          key={action}
                          contract={contract}
                          action={action}
                          onConfirm={() => handleAction(contract, action)}
                        />
                      ))}
                      {getContractActions(contract.status).length === 0 && (
                        <span className="text-xs text-zinc-500">Final state</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Contracts are stored in this browser for the connected account.
      </p>
    </main>
  );
}

const CONTRACT_ACTION_PAST: Record<ContractAction, string> = {
  activate: "active",
  complete: "completed",
  cancel: "cancelled",
};
