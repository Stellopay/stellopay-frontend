import type { TransactionProps } from "@/types/transaction";

/**
 * Utility functions for generating and downloading CSV files.
 */

/**
 * Describes a selectable CSV export column.
 */
export interface CsvExportColumn {
  /** Unique key used to identify the column (corresponds to a TransactionProps field). */
  key: string;
  /** Human-readable header displayed in the column checklist and CSV header row. */
  header: string;
}

/**
 * Pre-defined exportable columns for the transactions CSV export.
 * Each key maps to a property on {@link TransactionProps}.
 */
export const TRANSACTION_CSV_COLUMNS: CsvExportColumn[] = [
  { key: "type", header: "Transaction Type" },
  { key: "address", header: "Address" },
  { key: "date", header: "Date" },
  { key: "token", header: "Token" },
  { key: "amount", header: "Amount" },
  { key: "status", header: "Status" },
];

/**
 * Escapes a single CSV field to prevent CSV injection and handle special characters.
 * 
 * Mitigations:
 * - CSV Injection: If a field starts with '=', '+', '-', or '@', it is prefixed with a single quote.
 * - Special Characters: Fields containing commas, newlines, or double quotes are wrapped in double quotes.
 * - Quote Escaping: Double quotes inside fields are escaped by doubling them ("").
 * 
 * @param field - The string value to escape.
 * @returns The escaped CSV field string.
 */
export function escapeCsvField(field: string | null | undefined): string {
  if (field == null) {
    return "";
  }

  let escapedField = String(field);

  // Prevent CSV Injection
  if (/^[=+\-@]/.test(escapedField)) {
    escapedField = "'" + escapedField;
  }

  // Handle special characters (comma, newline, double quote)
  if (escapedField.includes(",") || escapedField.includes("\n") || escapedField.includes('"')) {
    escapedField = '"' + escapedField.replace(/"/g, '""') + '"';
  }

  return escapedField;
}

/**
 * Builds CSV content string from transaction data using only the selected columns.
 *
 * @param transactions - Array of transaction display objects to export.
 * @param selectedColumnKeys - Ordered list of column keys to include.
 * @returns Full CSV content as a string (headers + data rows).
 */
export function generateTransactionsCsv(
  transactions: TransactionProps[],
  selectedColumnKeys: string[],
): string {
  if (selectedColumnKeys.length === 0) {
    return "";
  }

  const columns = TRANSACTION_CSV_COLUMNS.filter((col) =>
    selectedColumnKeys.includes(col.key),
  );

  const headers = columns.map((col) => col.header);
  const data = transactions.map((tx) =>
    columns.map((col) => {
      const value = tx[col.key as keyof TransactionProps];
      return value != null ? String(value) : "";
    }),
  );

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvField).join(","));
  for (const row of data) {
    csvRows.push(row.map(escapeCsvField).join(","));
  }

  return csvRows.join("\n");
}

/**
 * Triggers a browser download of the given CSV content string.
 *
 * @param filename - The downloaded file name (e.g. "transactions.csv").
 * @param csvContent - Raw CSV string to write into the file.
 */
export function downloadCsvContent(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup Object URL to prevent memory leaks
  URL.revokeObjectURL(url);
}

/**
 * Downloads data as a CSV file client-side.
 * 
 * @param filename - The name of the file to download (e.g., "data.csv").
 * @param headers - Array of string headers for the CSV.
 * @param data - Array of string arrays representing the rows of data.
 */
export function downloadCsv(filename: string, headers: string[], data: string[][]): void {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(escapeCsvField).join(","));
  
  // Add data rows
  for (const row of data) {
    csvRows.push(row.map(escapeCsvField).join(","));
  }
  
  const csvContent = csvRows.join("\n");
  downloadCsvContent(filename, csvContent);
}
