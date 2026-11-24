import { z } from "zod";
import { isValidStellarAddress } from "@/utils/stellarAddress";
import { escapeCsvField } from "@/utils/csvUtils";
import { neutralizeFormula } from "@/utils/csvParse";

/** Maximum rows permitted in a single batch payroll file. */
export const MAX_BATCH_ROWS = 5000;

/** Stellar stroops scale (7 decimal places). 1 XLM = 10,000,000 stroops. */
const STROOP_SCALE = 10_000_000n;
const MAX_DECIMAL_PLACES = 7;

/**
 * Validates a decimal amount string for Stellar:
 * - Must be a positive decimal number
 * - Cannot be zero or negative
 * - At most 7 decimal places
 */
export const amountSchema = z
  .string()
  .trim()
  .refine(
    (val) => /^\d+(\.\d+)?$/.test(val),
    "Amount must be a valid positive number",
  )
  .refine((val) => {
    const parts = val.split(".");
    return parts.length < 2 || parts[1].length <= MAX_DECIMAL_PLACES;
  }, `Amount can have at most ${MAX_DECIMAL_PLACES} decimal places`)
  .refine((val) => {
    try {
      const stroops = parseAmountToStroops(val);
      return stroops > 0n;
    } catch {
      return false;
    }
  }, "Amount must be greater than zero");

/**
 * Zod schema for a single batch payment row.
 */
export const batchRowSchema = z.object({
  address: z
    .string()
    .trim()
    .refine(isValidStellarAddress, "Invalid Stellar address (expected G... or M... strkey)"),
  amount: amountSchema,
  asset: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Asset code is required")
    .max(12, "Asset code cannot exceed 12 characters")
    .regex(/^[A-Z0-9]+$/, "Asset code must be alphanumeric"),
  memo: z
    .string()
    .trim()
    .max(28, "Memo cannot exceed 28 characters")
    .optional()
    .or(z.literal("")),
});

export type BatchRowInput = z.infer<typeof batchRowSchema>;

export interface BatchPaymentRow {
  rowNumber: number;
  address: string;
  amount: string;
  asset: string;
  memo: string;
}

export interface BatchPaymentRowValidation {
  rowNumber: number;
  data: BatchPaymentRow;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export interface AssetTotal {
  asset: string;
  totalAmount: string;
  itemCount: number;
}

export interface BatchValidationResult {
  rows: BatchPaymentRowValidation[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  totalsByAsset: Record<string, AssetTotal>;
  headerErrors: string[];
}

/**
 * Converts a decimal amount string (up to 7 decimal places) to integer stroops (BigInt).
 * Prevents floating-point rounding inaccuracies.
 */
export function parseAmountToStroops(amountStr: string): bigint {
  const trimmed = amountStr.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid decimal amount: ${amountStr}`);
  }

  const [integerPart, fractionalPart = ""] = trimmed.split(".");
  if (fractionalPart.length > MAX_DECIMAL_PLACES) {
    throw new Error(`Amount exceeds max precision of ${MAX_DECIMAL_PLACES} decimal places`);
  }

  const paddedFraction = fractionalPart.padEnd(MAX_DECIMAL_PLACES, "0");
  return BigInt(integerPart) * STROOP_SCALE + BigInt(paddedFraction);
}

/**
 * Converts integer stroops back to a clean decimal string without trailing zeros.
 */
export function stroopsToAmountString(stroops: bigint): string {
  const integerPart = stroops / STROOP_SCALE;
  const remainder = stroops % STROOP_SCALE;

  if (remainder === 0n) {
    return integerPart.toString();
  }

  let fraction = remainder.toString().padStart(MAX_DECIMAL_PLACES, "0");
  fraction = fraction.replace(/0+$/, "");
  return `${integerPart}.${fraction}`;
}

/**
 * Adds an array of decimal amount strings with exact decimal precision.
 */
export function sumExactAmounts(amounts: string[]): string {
  let totalStroops = 0n;
  for (const amt of amounts) {
    try {
      totalStroops += parseAmountToStroops(amt);
    } catch {
      // Ignore invalid amounts in sum
    }
  }
  return stroopsToAmountString(totalStroops);
}

/**
 * Validates parsed CSV data rows against payroll schemas and checks for duplicates.
 *
 * @param headers - Array of header strings from the CSV.
 * @param dataRows - Array of data row string arrays.
 * @returns Comprehensive validation results, row-level errors, and asset totals.
 */
export function validateBatchData(
  headers: string[],
  dataRows: string[][],
): BatchValidationResult {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  const headerErrors: string[] = [];

  const addressIdx = normalizedHeaders.findIndex((h) => h === "address" || h === "recipient");
  const amountIdx = normalizedHeaders.findIndex((h) => h === "amount");
  const assetIdx = normalizedHeaders.findIndex((h) => h === "asset" || h === "currency" || h === "token");
  const memoIdx = normalizedHeaders.findIndex((h) => h === "memo");

  if (addressIdx === -1) headerErrors.push("Missing required column: 'address'");
  if (amountIdx === -1) headerErrors.push("Missing required column: 'amount'");
  if (assetIdx === -1) headerErrors.push("Missing required column: 'asset'");

  const validatedRows: BatchPaymentRowValidation[] = [];
  const addressSeen = new Map<string, number[]>(); // address -> list of row numbers
  const assetStroops = new Map<string, { stroops: bigint; count: number }>();

  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  dataRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // Row 1 is header
    const address = addressIdx >= 0 && row[addressIdx] != null ? row[addressIdx].trim() : "";
    const amount = amountIdx >= 0 && row[amountIdx] != null ? row[amountIdx].trim() : "";
    const asset = assetIdx >= 0 && row[assetIdx] != null ? row[assetIdx].trim().toUpperCase() : "";
    const memo = memoIdx >= 0 && row[memoIdx] != null ? row[memoIdx].trim() : "";

    const rowData: BatchPaymentRow = {
      rowNumber,
      address,
      amount,
      asset,
      memo,
    };

    const errors: string[] = [];

    // If missing header errors exist, report them for each row
    if (headerErrors.length > 0) {
      errors.push(...headerErrors);
    } else {
      const parsed = batchRowSchema.safeParse(rowData);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => {
          errors.push(err.message);
        });
      }
    }

    // Duplicate detection based on address
    let isDuplicate = false;
    if (address && isValidStellarAddress(address)) {
      const normalizedAddr = address.toUpperCase();
      const previousRows = addressSeen.get(normalizedAddr);
      if (previousRows) {
        isDuplicate = true;
        duplicateCount++;
        errors.push(`Duplicate address: already appears on row ${previousRows[0]}`);
        previousRows.push(rowNumber);
      } else {
        addressSeen.set(normalizedAddr, [rowNumber]);
      }
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validCount++;
      try {
        const stroops = parseAmountToStroops(amount);
        const existing = assetStroops.get(asset) || { stroops: 0n, count: 0 };
        assetStroops.set(asset, {
          stroops: existing.stroops + stroops,
          count: existing.count + 1,
        });
      } catch {
        // Fallback
      }
    } else {
      invalidCount++;
    }

    validatedRows.push({
      rowNumber,
      data: rowData,
      isValid,
      errors,
      isDuplicate,
    });
  });

  const totalsByAsset: Record<string, AssetTotal> = {};
  assetStroops.forEach((value, asset) => {
    totalsByAsset[asset] = {
      asset,
      totalAmount: stroopsToAmountString(value.stroops),
      itemCount: value.count,
    };
  });

  return {
    rows: validatedRows,
    totalRows: dataRows.length,
    validCount,
    invalidCount,
    duplicateCount,
    totalsByAsset,
    headerErrors,
  };
}

/**
 * Generates an error report CSV for all invalid rows in the batch.
 * Mitigates formula injection in cell contents.
 *
 * @param invalidRows - List of validation results with errors.
 * @returns Formatted and escaped CSV string.
 */
export function generateErrorReportCsv(invalidRows: BatchPaymentRowValidation[]): string {
  const headers = ["Row Number", "Address", "Amount", "Asset", "Memo", "Validation Errors"];
  const rows: string[][] = [];

  rows.push(headers.map(escapeCsvField));

  for (const item of invalidRows) {
    const errorText = item.errors.join("; ");
    const cells = [
      String(item.rowNumber),
      neutralizeFormula(item.data.address),
      neutralizeFormula(item.data.amount),
      neutralizeFormula(item.data.asset),
      neutralizeFormula(item.data.memo),
      neutralizeFormula(errorText),
    ];
    rows.push(cells.map(escapeCsvField));
  }

  return rows.map((r) => r.join(",")).join("\n");
}

/**
 * Returns a downloadable template CSV string with valid sample payroll rows.
 */
export function getBatchTemplateCsv(): string {
  return [
    "address,amount,asset,memo",
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF,1500.50,USDC,Jan Payroll",
    "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4,2350.00,USDC,Jan Payroll",
    "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV,125.7500000,XLM,Bonus",
  ].join("\n");
}
