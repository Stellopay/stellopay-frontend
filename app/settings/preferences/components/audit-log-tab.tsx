"use client";

import { useMemo, useState } from "react";
import { Download, History, RefreshCw, Search } from "lucide-react";
import { AuditEvent, AuditEventType } from "@/types/audit";
import {
  downloadAuditEventsCsv,
  filterAuditEvents,
  readAuditEvents,
} from "@/lib/audit-log";
import { formatDateTimeWithTimezone, getSavedTimezone } from "@/utils/date-utils";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  wallet_connected: "Wallet Connected",
  wallet_disconnected: "Wallet Disconnected",
  password_changed: "Password Changed",
  two_factor_enabled: "2FA Enabled",
  two_factor_disabled: "2FA Disabled",
  api_key_created: "API Key Created",
  api_key_revoked: "API Key Revoked",
  api_key_rotated: "API Key Rotated",
};

interface AuditLogTabProps {
  highlightedSearchLabel?: string | null;
  initialEvents?: AuditEvent[];
}

export default function AuditLogTab({
  highlightedSearchLabel,
  initialEvents,
}: AuditLogTabProps) {
  useSearchHighlight(highlightedSearchLabel ?? null);

  const [events, setEvents] = useState<AuditEvent[]>(
    () => initialEvents ?? readAuditEvents(),
  );
  const [selectedType, setSelectedType] = useState<AuditEventType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const timezone = useMemo(() => getSavedTimezone(), []);

  const refreshEvents = () => {
    setEvents(readAuditEvents());
  };

  const filteredEvents = useMemo(() => {
    return filterAuditEvents(events, {
      type: selectedType,
      searchQuery,
    });
  }, [events, selectedType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, validCurrentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleExportCsv = () => {
    if (events.length === 0) return;
    downloadAuditEventsCsv(filteredEvents);
    setExportNotice("Audit log CSV exported successfully.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const getEventBadge = (type: AuditEventType) => {
    switch (type) {
      case "password_changed":
      case "two_factor_enabled":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            {EVENT_TYPE_LABELS[type]}
          </Badge>
        );
      case "two_factor_disabled":
      case "api_key_revoked":
      case "wallet_disconnected":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            {EVENT_TYPE_LABELS[type]}
          </Badge>
        );
      case "api_key_created":
      case "api_key_rotated":
      case "wallet_connected":
      default:
        return (
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
            {EVENT_TYPE_LABELS[type] || type}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card
        data-search-label="Audit log"
        className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <CardHeader className="border-b border-zinc-200/80 pb-6 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <History className="size-5" />
              </span>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-zinc-950 dark:text-white">
                  Security and Activity Audit Log
                  <Badge
                    variant="outline"
                    className="border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
                  >
                    {events.length} {events.length === 1 ? "event" : "events"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Local append-only trail of security and wallet events on this machine.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEvents}
                aria-label="Refresh audit events"
                className="gap-1.5"
              >
                <RefreshCw className="size-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCsv}
                disabled={events.length === 0}
                aria-label="Export audit log to CSV"
                className="gap-1.5"
              >
                <Download className="size-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {exportNotice && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
            >
              {exportNotice}
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search audit events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
                aria-label="Filter audit events by keyword"
              />
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="audit-event-type-filter"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
              >
                Event Type:
              </label>
              <select
                id="audit-event-type-filter"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as AuditEventType | "all");
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-900 dark:border-white/10"
                aria-label="Filter by event type"
              >
                <option value="all">All Events ({events.length})</option>
                <option value="wallet_connected">Wallet Connected</option>
                <option value="wallet_disconnected">Wallet Disconnected</option>
                <option value="password_changed">Password Changed</option>
                <option value="two_factor_enabled">2FA Enabled</option>
                <option value="two_factor_disabled">2FA Disabled</option>
                <option value="api_key_created">API Key Created</option>
                <option value="api_key_revoked">API Key Revoked</option>
                <option value="api_key_rotated">API Key Rotated</option>
              </select>
            </div>
          </div>

          {/* Audit Events Table */}
          {paginatedEvents.length === 0 ? (
            <EmptyState
              variant="search"
              title={events.length === 0 ? "No audit events recorded" : "No matching audit events"}
              description={
                events.length === 0
                  ? "Security-sensitive actions like wallet connections, password updates, and 2FA changes will appear here automatically."
                  : "No events matched your current filters. Try resetting the search query or event type filter."
              }
              action={
                events.length > 0 && (searchQuery || selectedType !== "all")
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setSearchQuery("");
                        setSelectedType("all");
                        setCurrentPage(1);
                      },
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              <Table containerClassName="border rounded-lg border-zinc-200 dark:border-white/10">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp ({timezone})</TableHead>
                    <TableHead className="w-[160px]">Event Type</TableHead>
                    <TableHead>Summary &amp; Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.map((event) => {
                    const dateObj = new Date(event.timestamp);
                    const formattedDate = formatDateTimeWithTimezone(dateObj, timezone);

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {formattedDate}
                        </TableCell>
                        <TableCell>{getEventBadge(event.type)}</TableCell>
                        <TableCell className="space-y-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {event.summary}
                          </p>
                          {event.details && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {Object.entries(event.details).map(([key, val]) => (
                                <span key={key}>
                                  <span className="font-mono text-zinc-400">{key}:</span>{" "}
                                  <span>{String(val)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-zinc-500">
                    Showing {(validCurrentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredEvents.length)} of{" "}
                    {filteredEvents.length} events
                  </p>
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(validCurrentPage - 1)}
                          className={
                            validCurrentPage <= 1
                              ? "pointer-events-none opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                          aria-disabled={validCurrentPage <= 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === validCurrentPage}
                            onClick={() => handlePageChange(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(validCurrentPage + 1)}
                          className={
                            validCurrentPage >= totalPages
                              ? "pointer-events-none opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                          aria-disabled={validCurrentPage >= totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
