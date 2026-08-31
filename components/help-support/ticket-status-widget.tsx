"use client";

import { useEffect, useRef, useState } from "react";
import { SupportTicket, SupportTicketStatus } from "@/types/support";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/utils/commonUtils";

/**
 * Status badge styling using established Tailwind color patterns.
 * Follows same WCAG AA contrast ratio patterns as transaction status badges.
 */
const STATUS_STYLES: Record<SupportTicketStatus, string> = {
  open: "bg-[#191919] text-[#FBBF24]", // Amber - awaiting attention
  "in-progress": "bg-[#1A1A1A] text-[#60A5FA]", // Blue - actively being worked
  resolved: "bg-[#102B19] text-[#34D399]", // Green - completed
};

/**
 * Status icon mapping for visual representation.
 */
const STATUS_ICONS: Record<
  SupportTicketStatus,
  React.ComponentType<{ className?: string }>
> = {
  open: AlertCircle, // Warning icon for open tickets
  "in-progress": Zap, // Lightning for active work
  resolved: CheckCircle2, // Checkmark for completed
};

interface TicketStatusWidgetProps {
  tickets: SupportTicket[];
  isLoading?: boolean;
}

const STATUS_STEPS: Array<{ value: SupportTicketStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

function getStepState(
  step: SupportTicketStatus,
  currentStatus: SupportTicketStatus,
): "current" | "completed" | "upcoming" {
  if (currentStatus === "resolved") return "completed";

  const currentIndex = STATUS_STEPS.findIndex(
    (statusStep) => statusStep.value === currentStatus,
  );
  const stepIndex = STATUS_STEPS.findIndex(
    (statusStep) => statusStep.value === step,
  );

  if (stepIndex === currentIndex) return "current";
  if (stepIndex < currentIndex) return "completed";
  return "upcoming";
}

/**
 * Formats a timestamp to a human-readable relative time string.
 *
 * @param dateString - ISO datetime string
 * @returns Relative time description (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function StatusLiveRegion({ ticket }: { ticket: SupportTicket }) {
  const previousStatus = useRef(ticket.status);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (previousStatus.current !== ticket.status) {
      setAnnouncement(
        `Ticket ${ticket.id} status changed to ${ticket.status.replace("-", " ")}`,
      );
      previousStatus.current = ticket.status;
    }
  }, [ticket.id, ticket.status]);

  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </span>
  );
}

/**
 * Renders a single support ticket row with status badge, category, and timestamps.
 * Accessible via keyboard and screen readers.
 */
function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const StatusIcon = STATUS_ICONS[ticket.status];
  const statusStyle = STATUS_STYLES[ticket.status];

  return (
    <li
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg border border-zinc-200 bg-white/50 hover:bg-white/70 transition-colors dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      {/* Screen reader status timeline */}
      <ol
        className="sr-only"
        aria-label={`Status timeline for ticket ${ticket.id}`}
      >
        {STATUS_STEPS.map((step) => {
          const state = getStepState(step.value, ticket.status);
          return (
            <li
              key={step.value}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="sr-only">
                {state === "current"
                  ? "Current step: "
                  : state === "completed"
                    ? "Completed step: "
                    : "Upcoming step: "}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>
      {/* Left side: Ticket info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          {/* Ticket ID and subject */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {ticket.id}
              </span>
              <Badge
                variant="outline"
                className="text-xs rounded px-2 py-0.5"
              >
                {ticket.category}
              </Badge>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">
              {ticket.subject}
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Status badge and update time */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {/* Status badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
            statusStyle,
          )}
          data-state={ticket.status === "resolved" ? "completed" : "current"}
          aria-current={ticket.status === "resolved" ? undefined : "step"}
          aria-label={`Status: ${ticket.status.replace("-", " ")}`}
        >
          <StatusIcon className="h-3 w-3" />
          <span className="capitalize">{ticket.status.replace("-", " ")}</span>
        </div>

        {/* Last updated timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <time dateTime={ticket.lastUpdatedAt}>
            {formatRelativeTime(ticket.lastUpdatedAt)}
          </time>
        </div>
      </div>
      <StatusLiveRegion ticket={ticket} />
    </li>
  );
}

/**
 * TicketStatusWidget - Displays submitted support tickets with status tracking.
 *
 * Shows:
 * - List of submitted tickets with status badges (open/in-progress/resolved)
 * - Ticket ID, category, and subject
 * - Most recent status update timestamp
 * - Empty state when no tickets exist
 *
 * Accessibility:
 * - Semantic list structure (role="list")
 * - ARIA labels for status
 * - Proper heading hierarchy
 * - Keyboard navigable (Tab through tickets)
 * - Dark mode support
 *
 * Responsive:
 * - Stacked layout on mobile (sm: 640px)
 * - Side-by-side on tablet+ (md: 768px+)
 */
export default function TicketStatusWidget({
  tickets,
  isLoading = false,
}: TicketStatusWidgetProps) {
  if (isLoading) {
    return (
      <Card className="border-zinc-200 bg-white/90 dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
            Your Support Tickets
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Loading your submitted tickets...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-zinc-100 animate-pulse dark:bg-white/5"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="border-zinc-200 bg-white/90 dark:border-white/10 dark:bg-white/5">
        <CardHeader>
          <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
            Your Support Tickets
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Track the status of your submitted support requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No support tickets yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              When you submit a support request using the Contact Support form,
              it will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 bg-white/90 dark:border-white/10 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="font-general text-xl text-zinc-950 dark:text-white">
          Your Support Tickets
        </CardTitle>
        <CardDescription className="text-zinc-600 dark:text-zinc-400">
          Track the status of your {tickets.length} submitted support{" "}
          {tickets.length === 1 ? "request" : "requests"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul
          className="space-y-3"
          aria-label="Support tickets list"
        >
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </ul>

        {/* Legend for status badges */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/10">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            Status Legend
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#191919] text-[#FBBF24]">
                <AlertCircle className="h-3 w-3" />
                <span>Open</span>
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Awaiting response
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#1A1A1A] text-[#60A5FA]">
                <Zap className="h-3 w-3" />
                <span>In Progress</span>
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Being worked on
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#102B19] text-[#34D399]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolved</span>
              </div>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Issue closed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
