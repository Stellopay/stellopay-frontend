/**
 * @fileoverview Allowlisted URL state model and serialization utilities for the
 * Transactions view.
 *
 * Provides pure parsing, validation, and serialization functions that enforce:
 * - Only supported filter, sort, and pagination parameters are serialized.
 * - Wallet addresses, account identifiers, tokens, secrets, and private metadata
 *   are strictly excluded from serialized query strings.
 * - Shared URLs parse deterministically when handling encoded, repeated,
 *   invalid, or sensitive query parameters.
 */

import type {
  SortField,
  SortConfig,
  SortDirection,
  TransactionFilters,
} from "@/types/transaction";
import {
  DEFAULT_SELECTED_FILTER,
  getDefaultDateRange,
} from "./transactions-config";

/**
 * Allowlisted query parameter keys supported by the transactions URL state model.
 */
export const TRANSACTIONS_QUERY_KEYS = {
  search: "q",
  filter: "filter",
  fromDate: "from",
  toDate: "to",
  sort: "sort",
  page: "page",
} as const;

export type TransactionsQueryKey =
  (typeof TRANSACTIONS_QUERY_KEYS)[keyof typeof TRANSACTIONS_QUERY_KEYS];

export const ALLOWLISTED_QUERY_KEY_SET: ReadonlySet<string> = new Set(
  Object.values(TRANSACTIONS_QUERY_KEYS),
);

/**
 * Common sensitive parameter keys that must never be serialized or retained
 * in shareable transaction URLs.
 */
export const SENSITIVE_QUERY_KEY_SET: ReadonlySet<string> = new Set([
  "wallet",
  "walletaddress",
  "address",
  "account",
  "accountid",
  "publickey",
  "secret",
  "secretkey",
  "privatekey",
  "seed",
  "token",
  "authtoken",
  "session",
  "sessionid",
  "user",
  "userid",
  "auth",
  "authorization",
  "signature",
  "counterparty",
  "internalid",
  "viewid",
  "savedview",
  "memo",
  "metadata",
  "balance",
  "pin",
  "password",
  "key",
  "apikey",
]);

export const DEFAULT_SORT_CONFIGS: readonly SortConfig[] = [
  { field: "date", direction: "desc" },
];

export const FILTER_QUERY_VALUE_TO_LABEL: Readonly<Record<string, string>> = {
  all: DEFAULT_SELECTED_FILTER,
  sent: "Payment Sent",
  received: "Payment Received",
};

export const FILTER_LABEL_TO_QUERY_VALUE: Readonly<Record<string, string>> = {
  [DEFAULT_SELECTED_FILTER]: "all",
  "Payment Sent": "sent",
  "Payment Received": "received",
};

const SORT_FIELDS = [
  "date",
  "amount",
  "type",
  "status",
] as const satisfies readonly SortField[];

const SORT_DIRECTIONS = [
  "asc",
  "desc",
] as const satisfies readonly SortDirection[];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type SearchParamsLike = {
  get(name: string): string | null;
  getAll?(name: string): string[];
  toString(): string;
};

export interface TransactionsUrlState {
  filters: TransactionFilters;
  page: number;
}

export function cloneSortConfigs(
  configs: readonly SortConfig[],
): SortConfig[] {
  return configs.map(({ field, direction }) => ({ field, direction }));
}

export function createDefaultTransactionFilters(): TransactionFilters {
  return {
    searchQuery: "",
    filterQuery: "",
    ...getDefaultDateRange(),
    selectedFilter: DEFAULT_SELECTED_FILTER,
    sortConfigs: cloneSortConfigs(DEFAULT_SORT_CONFIGS),
  };
}

/**
 * Validates that a string is a valid ISO 8601 calendar date (`YYYY-MM-DD`).
 * Checks month and day boundaries strictly without auto-rollover
 * (e.g. rejects `2024-02-30` or `2023-02-29`).
 */
export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE_PATTERN.test(value)) return false;

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) return false;

  // Verify that UTC year, month, and day match the input components
  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() + 1 === month &&
    parsedDate.getUTCDate() === day
  );
}

export function isSortField(value: string): value is SortField {
  return (SORT_FIELDS as readonly string[]).includes(value as SortField);
}

export function isSortDirection(value: string): value is SortDirection {
  return (SORT_DIRECTIONS as readonly string[]).includes(
    value as SortDirection,
  );
}

/**
 * Safely extracts the first valid, non-empty value for a query parameter,
 * supporting both single-valued `.get()` and repeated `.getAll()`.
 */
function getFirstParamValue(
  searchParams: SearchParamsLike,
  key: string,
): string | null {
  if (typeof searchParams.getAll === "function") {
    const all = searchParams.getAll(key);
    if (all && all.length > 0) {
      for (const item of all) {
        if (typeof item === "string" && item.trim().length > 0) {
          return item.trim();
        }
      }
    }
  }
  const val = searchParams.get(key);
  return val ? val.trim() : null;
}

export function parsePage(value: string | null | undefined): number {
  if (!value) return 1;
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 1;
}

export function parseSelectedFilter(
  value: string | null | undefined,
): string {
  if (!value) return DEFAULT_SELECTED_FILTER;

  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue in FILTER_QUERY_VALUE_TO_LABEL) {
    return FILTER_QUERY_VALUE_TO_LABEL[normalizedValue];
  }

  const matchingLabel = Object.values(FILTER_QUERY_VALUE_TO_LABEL).find(
    (label) => label.toLowerCase() === normalizedValue,
  );

  return matchingLabel ?? DEFAULT_SELECTED_FILTER;
}

export function serializeSelectedFilter(label: string): string {
  return FILTER_LABEL_TO_QUERY_VALUE[label] ?? "all";
}

/**
 * Parses sort configurations from a query string token (e.g. `date.desc,amount.asc`
 * or `date:desc`). Only allowlisted sort fields and directions are accepted.
 * Up to 2 distinct sort fields are parsed.
 */
export function parseSortConfigs(value: string | null | undefined): SortConfig[] {
  if (!value) return cloneSortConfigs(DEFAULT_SORT_CONFIGS);

  const seenFields = new Set<SortField>();
  const sortConfigs: SortConfig[] = [];

  // Support encoded commas or multiple tokens
  const tokens = value.split(/[,\s]+/);

  for (const rawToken of tokens) {
    if (sortConfigs.length >= 2) break;

    const token = rawToken.trim();
    if (!token) continue;

    // Support both `date.desc` and `date:desc`
    const [field, direction] = token.split(/[.:]/);
    if (!field || !direction) continue;

    const normalizedField = field.trim().toLowerCase();
    const normalizedDir = direction.trim().toLowerCase();

    if (
      !isSortField(normalizedField) ||
      !isSortDirection(normalizedDir)
    ) {
      continue;
    }

    if (seenFields.has(normalizedField)) continue;

    seenFields.add(normalizedField);
    sortConfigs.push({
      field: normalizedField,
      direction: normalizedDir,
    });
  }

  return sortConfigs.length > 0
    ? sortConfigs
    : cloneSortConfigs(DEFAULT_SORT_CONFIGS);
}

/**
 * Serializes sort configurations into a canonical `field.direction` string.
 * Strips invalid fields/directions and caps at 2 sort criteria.
 */
export function serializeSortConfigs(
  configs: readonly SortConfig[],
): string {
  const seenFields = new Set<SortField>();
  const safeConfigs = configs.filter(({ field, direction }) => {
    if (!isSortField(field) || !isSortDirection(direction)) return false;
    if (seenFields.has(field)) return false;
    seenFields.add(field);
    return true;
  });

  const configsToSerialize =
    safeConfigs.length > 0
      ? safeConfigs
      : cloneSortConfigs(DEFAULT_SORT_CONFIGS);

  return configsToSerialize
    .slice(0, 2)
    .map(({ field, direction }) => `${field}.${direction}`)
    .join(",");
}

/**
 * Deterministically parses transaction filter and pagination state from URL search params.
 * Safely ignores unknown, sensitive, or malformed parameters.
 */
export function parseTransactionsUrlState(
  searchParams: SearchParamsLike,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
): TransactionsUrlState {
  const fromDateParam = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.fromDate,
  );
  const toDateParam = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.toDate,
  );

  let fromDate = isValidIsoDate(fromDateParam)
    ? fromDateParam
    : defaults.fromDate;
  let toDate = isValidIsoDate(toDateParam) ? toDateParam : defaults.toDate;

  // Inverted range check: if start date is after end date, fallback to defaults
  if (new Date(fromDate) > new Date(toDate)) {
    fromDate = defaults.fromDate;
    toDate = defaults.toDate;
  }

  const rawSearch = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.search,
  );
  const searchQuery = rawSearch ? rawSearch.trim() : "";

  const filterParam = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.filter,
  );
  const selectedFilter = parseSelectedFilter(filterParam);

  const sortParam = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.sort,
  );
  const sortConfigs = parseSortConfigs(sortParam);

  const pageParam = getFirstParamValue(
    searchParams,
    TRANSACTIONS_QUERY_KEYS.page,
  );
  const page = parsePage(pageParam);

  return {
    filters: {
      ...defaults,
      searchQuery,
      selectedFilter,
      fromDate,
      toDate,
      sortConfigs,
    },
    page,
  };
}

export interface BuildQueryStringOptions {
  /**
   * When true (default for shareable links), strips any parameter not in the
   * allowlist and strips all known sensitive keys (wallet, address, secret, etc.).
   */
  stripSensitiveAndUnlisted?: boolean;
}

/**
 * Builds a clean, deterministic query string for transaction state.
 *
 * By default, retains unrelated safe query parameters (like UI tabs) while
 * purging known sensitive keys (like wallet addresses, accounts, secrets).
 * When `stripSensitiveAndUnlisted: true`, guarantees that ONLY allowlisted
 * transaction parameters are included.
 */
export function buildTransactionsQueryString(
  currentSearchParams: SearchParamsLike,
  state: TransactionsUrlState,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
  options: BuildQueryStringOptions = {},
): string {
  const { stripSensitiveAndUnlisted = false } = options;
  const currentParams = new URLSearchParams(currentSearchParams.toString());
  const nextParams = new URLSearchParams();

  if (stripSensitiveAndUnlisted) {
    // Only copy over allowlisted params that are active in state below
  } else {
    // Copy existing params excluding transaction keys and sensitive keys
    for (const [key, value] of currentParams.entries()) {
      const lowerKey = key.toLowerCase();
      if (
        ALLOWLISTED_QUERY_KEY_SET.has(key) ||
        SENSITIVE_QUERY_KEY_SET.has(lowerKey)
      ) {
        continue;
      }
      nextParams.append(key, value);
    }
  }

  const searchQuery = state.filters.searchQuery?.trim() ?? "";
  if (searchQuery.length > 0) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.search, searchQuery);
  }

  const selectedFilter = serializeSelectedFilter(state.filters.selectedFilter);
  if (selectedFilter !== "all") {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.filter, selectedFilter);
  }

  if (
    state.filters.fromDate &&
    isValidIsoDate(state.filters.fromDate) &&
    state.filters.fromDate !== defaults.fromDate
  ) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.fromDate, state.filters.fromDate);
  }

  if (
    state.filters.toDate &&
    isValidIsoDate(state.filters.toDate) &&
    state.filters.toDate !== defaults.toDate
  ) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.toDate, state.filters.toDate);
  }

  const serializedSort = serializeSortConfigs(state.filters.sortConfigs);
  const defaultSortSerialized = serializeSortConfigs(defaults.sortConfigs);
  if (serializedSort !== defaultSortSerialized) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.sort, serializedSort);
  }

  if (state.page > 1) {
    nextParams.set(TRANSACTIONS_QUERY_KEYS.page, String(state.page));
  }

  return nextParams.toString();
}

/**
 * Builds a standalone shareable URL or query string containing ONLY
 * allowlisted filter/sort/pagination parameters.
 */
export function buildShareableTransactionsQueryString(
  state: TransactionsUrlState,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
): string {
  return buildTransactionsQueryString(
    new URLSearchParams(),
    state,
    defaults,
    { stripSensitiveAndUnlisted: true },
  );
}

/**
 * Formats a full pathname with the shareable query string.
 */
export function buildShareableTransactionsUrl(
  pathname: string,
  state: TransactionsUrlState,
  defaults: TransactionFilters = createDefaultTransactionFilters(),
): string {
  const query = buildShareableTransactionsQueryString(state, defaults);
  return query ? `${pathname}?${query}` : pathname;
}
