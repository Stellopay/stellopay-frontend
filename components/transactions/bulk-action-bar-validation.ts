/**
 * Input-validation helpers for `BulkActionBar`.
 *
 * Every check runs **before** the component writes any state or renders,
 * so a malformed value can never propagate further into the system.
 *
 * Callers can inspect `BulkActionBarValidationError.code` to decide how
 * to react (display a toast, log, silently ignore, etc.).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hard upper-bound on the number of rows the bar will accept. */
export const MAX_SELECTED_COUNT = 10_000;

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------

/**
 * Discriminated error codes so the caller can tell *why* input was rejected.
 *
 * - `INVALID_TYPE`  – value is NaN, ±Infinity, or not a finite number.
 * - `NOT_INTEGER`   – value is a finite number but has a fractional part.
 * - `NEGATIVE`      – value is a negative integer.
 * - `OVERSIZED`     – value exceeds `MAX_SELECTED_COUNT`.
 */
export type BulkActionBarErrorCode =
  | "INVALID_TYPE"
  | "NOT_INTEGER"
  | "NEGATIVE"
  | "OVERSIZED";

export class BulkActionBarValidationError extends Error {
  readonly code: BulkActionBarErrorCode;

  constructor(code: BulkActionBarErrorCode, message: string) {
    super(message);
    this.name = "BulkActionBarValidationError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validate `selectedCount` and throw a typed
 * `BulkActionBarValidationError` if it's malformed.
 *
 * Returns the validated count on success so the call-site can use a
 * single expression: `const safe = validateSelectedCount(raw);`
 */
export function validateSelectedCount(value: number): number {
  if (!Number.isFinite(value)) {
    throw new BulkActionBarValidationError(
      "INVALID_TYPE",
      `selectedCount must be a finite number, received ${String(value)}`,
    );
  }

  if (!Number.isInteger(value)) {
    throw new BulkActionBarValidationError(
      "NOT_INTEGER",
      `selectedCount must be an integer, received ${value}`,
    );
  }

  if (value < 0) {
    throw new BulkActionBarValidationError(
      "NEGATIVE",
      `selectedCount must be non-negative, received ${value}`,
    );
  }

  if (value > MAX_SELECTED_COUNT) {
    throw new BulkActionBarValidationError(
      "OVERSIZED",
      `selectedCount must be ≤ ${MAX_SELECTED_COUNT}, received ${value}`,
    );
  }

  return value;
}
