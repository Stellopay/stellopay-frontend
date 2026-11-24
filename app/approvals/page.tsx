"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApprovalRequest, ApprovalStatus } from "@/types/approval";
import {
  decideApprovalRequest,
  getApprovalRequests,
} from "@/lib/approvals-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const STATUSES: ApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
];

export function buildApprovalHistoryCsv(requests: ApprovalRequest[]): string {
  const rows = [
    [
      "Payment ID",
      "Asset",
      "Amount (minor units)",
      "Requester",
      "Status",
      "Decision",
      "Who",
      "When",
      "Comment",
    ],
    ...requests.flatMap((request) =>
      (request.history.length
        ? request.history
        : [{ decision: "", actorName: "", at: "", comment: "" }]
      ).map((entry) => [
        request.paymentId,
        request.asset,
        String(request.amountMinorUnits),
        request.requesterName,
        request.status,
        entry.decision,
        entry.actorName,
        entry.at,
        entry.comment ?? "",
      ]),
    ),
  ];
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value);
          const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
          return `"${safeText.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(
    "pending",
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRequests = useCallback(() => {
    try {
      let stored = getApprovalRequests();
      const expired = stored.filter(
        (request) =>
          request.status === "pending" &&
          Date.parse(request.expiresAt) <= Date.now(),
      );
      for (const request of expired) {
        decideApprovalRequest(request.id, {
          type: "expire",
          at: new Date().toISOString(),
        });
      }
      stored = getApprovalRequests();
      setRequests(stored);
      setSelected((current) =>
        current
          ? (stored.find((request) => request.id === current.id) ?? null)
          : null,
      );
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Approval requests could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        [request.paymentId, request.asset, request.requesterName].some(
          (value) => value.toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const decide = (type: "approve" | "reject") => {
    if (!selected) return;
    try {
      decideApprovalRequest(selected.id, {
        type,
        actor: { id: reviewerId.trim(), name: reviewerName.trim() },
        at: new Date().toISOString(),
        comment,
      });
      setComment("");
      refreshRequests();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The decision could not be saved.",
      );
    }
  };

  const exportHistory = () => {
    const csv = buildApprovalHistoryCsv(requests);
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "approval-decision-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-screen-xl px-4 py-10 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">Payments</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Approvals
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Review payments that exceed their configured approval threshold.
            Decisions are stored in this browser and are not server-enforced.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportHistory}>
          Export decision history CSV
        </Button>
      </header>

      <section
        aria-label="Approval queue"
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950 md:p-6"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Approval queue</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {filteredRequests.length}{" "}
              {statusFilter === "pending" ? "pending " : ""}request
              {filteredRequests.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="grid gap-1 text-sm">
              <span>Status</span>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ApprovalStatus | "all")
                }
                className="h-9 rounded-md border border-input bg-background px-3"
              >
                <option value="pending">Pending</option>
                <option value="all">All statuses</option>
                {STATUSES.filter((status) => status !== "pending").map(
                  (status) => (
                    <option key={status} value={status}>
                      {status[0].toUpperCase() + status.slice(1)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Search</span>
              <Input
                aria-label="Search approval requests"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Payment, asset, requester"
              />
            </label>
          </div>
        </div>

        {error && (
          <p
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

        {isLoading ? (
          <p role="status" className="py-12 text-center text-sm text-zinc-500">
            Loading approval requests…
          </p>
        ) : filteredRequests.length === 0 ? (
          <p role="status" className="py-12 text-center text-sm text-zinc-500">
            No approval requests match these filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-white/10">
                  <th scope="col" className="px-3 py-3 font-medium">
                    Payment
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Requested by
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Approvals
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    tabIndex={0}
                    aria-label={`Open payment ${request.paymentId}, ${request.status}`}
                    onClick={() => setSelected(request)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(request);
                      }
                    }}
                    className="cursor-pointer border-b border-zinc-100 outline-none last:border-0 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <th scope="row" className="px-3 py-4 font-medium">
                      <span className="block">{request.paymentId}</span>
                      <span className="text-xs text-zinc-500">
                        {request.asset}
                      </span>
                    </th>
                    <td className="px-3 py-4">{request.requesterName}</td>
                    <td className="px-3 py-4">
                      {request.amountMinorUnits.toLocaleString()}{" "}
                      {request.asset} minor units
                    </td>
                    <td className="px-3 py-4">
                      {
                        request.history.filter(
                          (entry) => entry.decision === "approved",
                        ).length
                      }
                      {" / "}
                      {request.requiredApprovals}
                    </td>
                    <td className="px-3 py-4 capitalize">{request.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent
            showCloseButton={false}
            className="fixed inset-y-0 right-0 left-auto h-full w-full max-w-xl translate-x-0 translate-y-0 overflow-y-auto rounded-none p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Payment approval</p>
                <DialogTitle className="mt-1 text-xl font-semibold">
                  {selected.paymentId}
                </DialogTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-white/10">
              <div>
                <dt className="text-zinc-500">Amount</dt>
                <dd className="mt-1">
                  {selected.amountMinorUnits.toLocaleString()} {selected.asset}{" "}
                  minor units
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Requested by</dt>
                <dd className="mt-1">{selected.requesterName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Required</dt>
                <dd className="mt-1">
                  {selected.requiredApprovals} of {selected.approverIds.length}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Expires</dt>
                <dd className="mt-1">
                  {new Date(selected.expiresAt).toLocaleString()}
                </dd>
              </div>
            </dl>

            <section aria-labelledby="decision-history-title" className="mt-7">
              <h3 id="decision-history-title" className="font-semibold">
                Decision history
              </h3>
              {selected.history.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">No decisions yet.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {selected.history.map((entry, index) => (
                    <li
                      key={`${entry.actorId}-${entry.at}-${index}`}
                      className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-white/10"
                    >
                      <p className="font-medium capitalize">
                        {entry.decision} by {entry.actorName}
                      </p>
                      <time
                        className="mt-1 block text-xs text-zinc-500"
                        dateTime={entry.at}
                      >
                        {new Date(entry.at).toLocaleString()}
                      </time>
                      {entry.comment && <p className="mt-2">{entry.comment}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {selected.status === "pending" && (
              <section
                aria-labelledby="review-title"
                className="mt-7 border-t border-zinc-200 pt-5 dark:border-white/10"
              >
                <h3 id="review-title" className="font-semibold">
                  Record a decision
                </h3>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Demo reviewer identity only; authorization must be enforced by
                  a server before production use.
                </p>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm">
                    Reviewer ID
                    <Input
                      value={reviewerId}
                      onChange={(event) => setReviewerId(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Reviewer name
                    <Input
                      value={reviewerName}
                      onChange={(event) => setReviewerName(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Comment (optional)
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      className="min-h-20 rounded-md border border-input bg-background p-3"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => decide("approve")}>
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => decide("reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}
