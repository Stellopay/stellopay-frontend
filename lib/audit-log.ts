import { AuditEvent, AuditEventInput, AuditLogFilterOptions } from "@/types/audit";
import { safeStorage, STORAGE_KEYS } from "@/utils/safeStorage";
import { truncateStellarAddress } from "@/utils/stellarAddress";

export const MAX_AUDIT_LOG_EVENTS = 500;
export const AUDIT_LOG_STORAGE_KEY = STORAGE_KEYS.AUDIT_LOG;

/**
 * List of sensitive key names that should always have their values redacted.
 */
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /totp/i,
  /seed/i,
  /token/i,
  /credential/i,
  /private/i,
  /recovery/i,
  /backup.*code/i,
];

/**
 * Checks whether a key name is considered sensitive and must be redacted.
 * Whitelists benign metadata keys like "keyName", "keyId", "prefix".
 */
function isSensitiveKey(key: string): boolean {
  if (/^(keyname|keyid|prefix|network|address|type|action)$/i.test(key)) {
    return false;
  }
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redacts sensitive values such as private seeds and sanitizes full Stellar
 * addresses to prevent logging raw public keys beyond truncateStellarAddress.
 */
export function sanitizeAuditValue(value: unknown, keyName?: string): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (keyName && isSensitiveKey(keyName)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    // Redact Stellar secret seeds (S followed by 55 base32 chars)
    if (/^S[A-Z2-7]{55}$/.test(trimmed)) {
      return "[REDACTED]";
    }

    // Redact generic high-entropy secret-like strings (e.g. hex tokens, base64 secrets)
    if (/^(sk_[a-zA-Z0-9_-]{20,}|stellopay_sec_[a-zA-Z0-9]{16,})$/.test(trimmed)) {
      return "[REDACTED]";
    }

    // Truncate full Stellar public addresses (G... or M...)
    if (/^G[A-Z2-7]{55}$/.test(trimmed) || /^M[A-Z2-7]{68}$/.test(trimmed)) {
      return truncateStellarAddress(trimmed);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item, keyName));
  }

  if (typeof value === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitizedObj[k] = sanitizeAuditValue(v, k);
    }
    return sanitizedObj;
  }

  return value;
}

/**
 * Sanitizes the summary string to truncate any full Stellar addresses.
 */
function sanitizeSummary(summary: string): string {
  if (!summary) return "";

  // Replace full Stellar public addresses (G... / M...) with truncated versions
  return summary
    .replace(/\b(G[A-Z2-7]{55})\b/g, (match) => truncateStellarAddress(match))
    .replace(/\b(M[A-Z2-7]{68})\b/g, (match) => truncateStellarAddress(match))
    .replace(/\b(S[A-Z2-7]{55})\b/g, "[REDACTED]");
}

/**
 * Sanitizes an entire audit event input, stripping secrets and formatting addresses.
 */
export function sanitizeAuditEventInput(input: AuditEventInput): AuditEvent {
  const timestamp = input.timestamp || new Date().toISOString();
  const id = input.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const sanitizedDetails: Record<string, string | number | boolean | null | undefined> = {};

  if (input.details && typeof input.details === "object") {
    for (const [k, v] of Object.entries(input.details)) {
      const sanitized = sanitizeAuditValue(v, k);
      if (
        sanitized === null ||
        sanitized === undefined ||
        typeof sanitized === "string" ||
        typeof sanitized === "number" ||
        typeof sanitized === "boolean"
      ) {
        sanitizedDetails[k] = sanitized;
      } else {
        sanitizedDetails[k] = JSON.stringify(sanitized);
      }
    }
  }

  return {
    id,
    timestamp,
    type: input.type,
    summary: sanitizeSummary(input.summary),
    severity: input.severity || "info",
    details: Object.keys(sanitizedDetails).length > 0 ? sanitizedDetails : undefined,
  };
}

/**
 * Reads all stored audit events from versioned safeStorage.
 * Handles corrupt storage, missing keys, and invalid formats safely without throwing.
 */
export function readAuditEvents(): AuditEvent[] {
  try {
    const raw = safeStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filter to valid objects with at least id, timestamp, type, and summary
    return parsed.filter(
      (event): event is AuditEvent =>
        event &&
        typeof event === "object" &&
        typeof event.id === "string" &&
        typeof event.timestamp === "string" &&
        typeof event.type === "string" &&
        typeof event.summary === "string",
    );
  } catch {
    // Corrupt JSON or storage unavailable: return empty array safely
    return [];
  }
}

/**
 * Records a security audit event into the append-only ring buffer in safeStorage.
 * Capped at 500 events (oldest dropped first).
 *
 * @security Never throws into the calling flow, matching safeStorage semantics.
 */
export function recordAuditEvent(input: AuditEventInput): AuditEvent | null {
  try {
    const sanitized = sanitizeAuditEventInput(input);
    const existing = readAuditEvents();

    // Prepend newest event, maintaining ring buffer cap of 500
    const updated = [sanitized, ...existing].slice(0, MAX_AUDIT_LOG_EVENTS);

    const serialized = JSON.stringify(updated);
    safeStorage.setItem(AUDIT_LOG_STORAGE_KEY, serialized);

    return sanitized;
  } catch {
    // Storage failures never surface to calling workflows
    return null;
  }
}

/**
 * Clears all audit events from safeStorage.
 */
export function clearAuditEvents(): boolean {
  try {
    return safeStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch {
    return false;
  }
}

/**
 * Filters audit events by type, date range, or search query.
 */
export function filterAuditEvents(
  events: AuditEvent[],
  options: AuditLogFilterOptions,
): AuditEvent[] {
  return events.filter((event) => {
    if (options.type && options.type !== "all" && event.type !== options.type) {
      return false;
    }

    if (options.startDate) {
      const eventTime = new Date(event.timestamp).getTime();
      const startTime = new Date(options.startDate).getTime();
      if (!isNaN(startTime) && eventTime < startTime) {
        return false;
      }
    }

    if (options.endDate) {
      const eventTime = new Date(event.timestamp).getTime();
      const endTime = new Date(options.endDate).getTime();
      if (!isNaN(endTime) && eventTime > endTime) {
        return false;
      }
    }

    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const query = options.searchQuery.toLowerCase().trim();
      const matchesSummary = event.summary.toLowerCase().includes(query);
      const matchesType = event.type.toLowerCase().includes(query);
      const matchesDetails = event.details
        ? Object.values(event.details).some(
            (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(query),
          )
        : false;

      if (!matchesSummary && !matchesType && !matchesDetails) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Escapes a cell value for RFC 4180 CSV export and neutralizes spreadsheet formula injection.
 */
export function sanitizeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) {
    return '""';
  }

  let str = String(cell);

  // Neutralize formula injection: prefix with single-quote if it begins with =, +, -, @, \t, or \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double-quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string of audit events with formula injection protection.
 */
export function exportAuditEventsCsv(events: AuditEvent[]): string {
  const headers = [
    "Event ID",
    "Timestamp (UTC)",
    "Event Type",
    "Severity",
    "Summary",
    "Details",
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(",");

  const rows = events.map((event) => {
    const detailsStr = event.details ? JSON.stringify(event.details) : "";
    return [
      sanitizeCsvCell(event.id),
      sanitizeCsvCell(event.timestamp),
      sanitizeCsvCell(event.type),
      sanitizeCsvCell(event.severity || "info"),
      sanitizeCsvCell(event.summary),
      sanitizeCsvCell(detailsStr),
    ].join(",");
  });

  return [headerRow, ...rows].join("\r\n");
}

/**
 * Triggers a browser download of the audit events as a CSV file.
 */
export function downloadAuditEventsCsv(
  events: AuditEvent[],
  filename?: string,
): void {
  if (typeof window === "undefined") return;

  const csvContent = exportAuditEventsCsv(events);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const name =
    filename ||
    `stellopay-audit-log-${new Date().toISOString().split("T")[0]}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", name);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
