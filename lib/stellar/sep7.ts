/**
 * @fileoverview SEP-0007 URI builder and parser for Stellar payment requests.
 *
 * SEP-0007 defines a URI scheme for Stellar payment requests:
 * web+stellar:pay?destination=<address>&amount=<amount>&asset_code=<code>&asset_issuer=<issuer>&memo=<memo>&msg=<message>
 *
 * This module provides strict validation and encoding/decoding for building and parsing
 * these URIs. All memo values are percent-encoded to ensure safe transmission.
 *
 * Security notes:
 * - Destination addresses are validated using isValidStellarAddress from utils/stellarAddress.ts
 * - Amounts are capped at 7 decimal places (Stellar's precision limit)
 * - Negative amounts are rejected
 * - Only the web+stellar:pay scheme is accepted (unknown schemes are rejected)
 * - Memo values are always percent-encoded when building and decoded when parsing
 */

import { isValidStellarAddress } from "@/utils/stellarAddress";

/** Maximum decimal places for Stellar amounts (protocol precision limit). */
const MAX_AMOUNT_DECIMALS = 7;

/** Valid SEP-0007 URI scheme. */
const STELLAR_PAY_SCHEME = "web+stellar:pay";

/**
 * Parameters for building a SEP-0007 payment URI.
 */
export interface Sep7PayParams {
  /** The destination Stellar address (G... or M...). */
  destination: string;
  /** Optional amount in decimal format (e.g., "10.50"). Capped at 7 decimals. */
  amount?: string;
  /** Optional asset code (e.g., "USDC", "XLM"). */
  assetCode?: string;
  /** Optional asset issuer address (required for custom assets). */
  assetIssuer?: string;
  /** Optional memo value (will be percent-encoded). */
  memo?: string;
  /** Optional memo type (text, id, hash, return). Defaults to "text". */
  memoType?: "text" | "id" | "hash" | "return";
  /** Optional human-readable message (will be percent-encoded). */
  message?: string;
}

/**
 * Parsed SEP-0007 payment URI components.
 */
export interface ParsedSep7Uri {
  /** The destination Stellar address. */
  destination: string;
  /** The amount if present. */
  amount?: string;
  /** The asset code if present. */
  assetCode?: string;
  /** The asset issuer if present. */
  assetIssuer?: string;
  /** The memo value if present. */
  memo?: string;
  /** The memo type if present. */
  memoType?: string;
  /** The message if present. */
  message?: string;
}

/**
 * Validates an amount string for Stellar payment URIs.
 *
 * - Must be a valid decimal number
 * - Must be non-negative
 * - Must not exceed 7 decimal places
 *
 * @param amount - The amount string to validate.
 * @returns true if valid, false otherwise.
 */
function isValidAmount(amount: string): boolean {
  if (typeof amount !== "string" || amount.trim() === "") {
    return false;
  }

  // Check if it's a valid decimal number
  const num = Number(amount);
  if (isNaN(num)) {
    return false;
  }

  // Reject negative amounts
  if (num < 0) {
    return false;
  }

  // Check decimal precision
  if (amount.includes(".")) {
    const decimalPart = amount.split(".")[1];
    if (decimalPart && decimalPart.length > MAX_AMOUNT_DECIMALS) {
      return false;
    }
  }

  return true;
}

/**
 * Formats an amount to ensure it doesn't exceed 7 decimal places.
 *
 * @param amount - The amount string to format.
 * @returns The formatted amount string.
 * @throws Error if the amount is invalid.
 */
function formatAmount(amount: string): string {
  if (!isValidAmount(amount)) {
    throw new Error(
      `Invalid amount: ${amount}. Amount must be a non-negative decimal with at most ${MAX_AMOUNT_DECIMALS} decimal places.`,
    );
  }

  const num = Number(amount);
  // Round to 7 decimal places to ensure precision cap
  return num.toFixed(MAX_AMOUNT_DECIMALS).replace(/\.?0+$/, "");
}

/**
 * Percent-encodes a value for safe URI inclusion.
 *
 * Uses encodeURIComponent but preserves certain characters that are
 * safe in query parameters for better readability.
 *
 * @param value - The value to encode.
 * @returns The percent-encoded value.
 */
function encodeQueryParam(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Decodes a percent-encoded query parameter value.
 *
 * @param value - The percent-encoded value.
 * @returns The decoded value.
 */
function decodeQueryParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // If decoding fails, return the original value
    return value;
  }
}

/**
 * Builds a SEP-0007 payment URI from the given parameters.
 *
 * The destination address is validated using isValidStellarAddress.
 * Amounts are validated and capped at 7 decimal places.
 * Memo and message values are percent-encoded.
 *
 * @param params - The payment parameters.
 * @returns The complete SEP-0007 URI.
 * @throws Error if validation fails.
 *
 * @example
 * buildSep7Uri({
 *   destination: "GD5...",
 *   amount: "10.50",
 *   assetCode: "USDC",
 *   assetIssuer: "GA5...",
 *   memo: "Invoice #123"
 * });
 * // => "web+stellar:pay?destination=GD5...&amount=10.5&asset_code=USDC&asset_issuer=GA5...&memo=Invoice%20%23123"
 */
export function buildSep7Uri(params: Sep7PayParams): string {
  const { destination, amount, assetCode, assetIssuer, memo, memoType = "text", message } = params;

  // Validate destination
  if (!isValidStellarAddress(destination)) {
    throw new Error(`Invalid destination address: ${destination}`);
  }

  // Validate and format amount if provided
  let formattedAmount: string | undefined;
  if (amount !== undefined && amount !== "") {
    formattedAmount = formatAmount(amount);
  }

  // Build query parameters
  const queryParams = new URLSearchParams();

  // Destination is required
  queryParams.set("destination", destination);

  // Add optional parameters
  if (formattedAmount !== undefined) {
    queryParams.set("amount", formattedAmount);
  }

  if (assetCode !== undefined && assetCode !== "") {
    queryParams.set("asset_code", assetCode);
  }

  if (assetIssuer !== undefined && assetIssuer !== "") {
    // Validate issuer address
    if (!isValidStellarAddress(assetIssuer)) {
      throw new Error(`Invalid asset issuer address: ${assetIssuer}`);
    }
    queryParams.set("asset_issuer", assetIssuer);
  }

  if (memo !== undefined && memo !== "") {
    queryParams.set("memo", encodeQueryParam(memo));
    queryParams.set("memo_type", memoType);
  }

  if (message !== undefined && message !== "") {
    queryParams.set("msg", encodeQueryParam(message));
  }

  return `${STELLAR_PAY_SCHEME}?${queryParams.toString()}`;
}

/**
 * Parses a SEP-0007 payment URI into its components.
 *
 * Only accepts URIs with the web+stellar:pay scheme.
 * Rejects unknown schemes and malformed URIs.
 * Validates the destination address and amount format.
 *
 * @param uri - The SEP-0007 URI to parse.
 * @returns The parsed URI components.
 * @throws Error if the URI is invalid or uses an unknown scheme.
 *
 * @example
 * parseSep7Uri("web+stellar:pay?destination=GD5...&amount=10.5");
 * // => { destination: "GD5...", amount: "10.5" }
 */
export function parseSep7Uri(uri: string): ParsedSep7Uri {
  if (typeof uri !== "string" || uri.trim() === "") {
    throw new Error("URI must be a non-empty string");
  }

  // Check scheme
  if (!uri.startsWith(`${STELLAR_PAY_SCHEME}?`)) {
    throw new Error(
      `Invalid URI scheme. Expected "${STELLAR_PAY_SCHEME}?" but got "${uri.slice(0, 20)}..."`,
    );
  }

  // Extract query string
  const queryString = uri.slice(`${STELLAR_PAY_SCHEME}?`.length);
  const queryParams = new URLSearchParams(queryString);

  // Parse destination (required)
  const destination = queryParams.get("destination");
  if (!destination) {
    throw new Error("Missing required parameter: destination");
  }

  // Validate destination
  if (!isValidStellarAddress(destination)) {
    throw new Error(`Invalid destination address: ${destination}`);
  }

  // Parse optional parameters
  const amount = queryParams.get("amount") || undefined;
  const assetCode = queryParams.get("asset_code") || undefined;
  const assetIssuer = queryParams.get("asset_issuer") || undefined;
  const memo = queryParams.get("memo") || undefined;
  const memoType = queryParams.get("memo_type") || undefined;
  const message = queryParams.get("msg") || undefined;

  // Validate amount if present
  if (amount !== undefined && !isValidAmount(amount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Validate asset issuer if present
  if (assetIssuer !== undefined && !isValidStellarAddress(assetIssuer)) {
    throw new Error(`Invalid asset issuer address: ${assetIssuer}`);
  }

  // Decode memo and message if present
  const decodedMemo = memo !== undefined ? decodeQueryParam(memo) : undefined;
  const decodedMessage = message !== undefined ? decodeQueryParam(message) : undefined;

  return {
    destination,
    amount,
    assetCode,
    assetIssuer,
    memo: decodedMemo,
    memoType,
    message: decodedMessage,
  };
}

/**
 * Validates a SEP-0007 URI without throwing.
 *
 * @param uri - The URI to validate.
 * @returns true if valid, false otherwise.
 */
export function isValidSep7Uri(uri: string): boolean {
  try {
    parseSep7Uri(uri);
    return true;
  } catch {
    return false;
  }
}
