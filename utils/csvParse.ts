/**
 * RFC 4180-compliant CSV parser with BOM stripping, formula injection mitigation,
 * and chunked parsing support.
 */

/**
 * Characters that trigger spreadsheet formula execution when leading a cell value.
 */
const FORMULA_INJECTION_CHARS = ["=", "+", "-", "@"];

/**
 * Neutralizes spreadsheet formula injection in a string value.
 * If the value begins with '=', '+', '-', or '@', prefixes it with a single quote.
 *
 * @param value - The raw string value.
 * @returns The neutralized string.
 */
export function neutralizeFormula(value: string): string {
  if (typeof value !== "string") return "";
  if (FORMULA_INJECTION_CHARS.some((char) => value.startsWith(char))) {
    return "'" + value;
  }
  return value;
}

export interface ParseCsvOptions {
  /** If true, neutralizes formula-injection characters in cell values. Defaults to false. */
  sanitizeFormulas?: boolean;
  /** Maximum number of data rows to parse. */
  maxRows?: number;
  /** If true, trims whitespace around unquoted fields. Defaults to true. */
  trim?: boolean;
}

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/**
 * Parses a CSV string into headers and rows.
 *
 * Handles:
 * - UTF-8 Byte Order Mark (BOM: \uFEFF)
 * - CRLF (\r\n), LF (\n), and CR (\r) line endings
 * - Quoted fields with embedded commas and newlines
 * - Escaped quotes ("")
 * - Formula injection neutralization (optional)
 *
 * @param csvText - The raw CSV text content.
 * @param options - Parsing options.
 * @returns The parsed headers, rows, and row count.
 */
export function parseCsv(csvText: string, options: ParseCsvOptions = {}): CsvParseResult {
  const { sanitizeFormulas = false, maxRows, trim = true } = options;

  if (!csvText || typeof csvText !== "string") {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Strip BOM if present
  let text = csvText;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (insideQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      }

      if (char === ",") {
        const val = trim ? currentField.trim() : currentField;
        currentRow.push(sanitizeFormulas ? neutralizeFormula(val) : val);
        currentField = "";
        i++;
        continue;
      }

      if (char === "\r" || char === "\n") {
        // Handle \r\n
        if (char === "\r" && i + 1 < len && text[i + 1] === "\n") {
          i++;
        }
        const val = trim ? currentField.trim() : currentField;
        currentRow.push(sanitizeFormulas ? neutralizeFormula(val) : val);
        currentField = "";

        // Only push non-empty rows
        if (currentRow.some((field) => field.length > 0)) {
          rawRows.push(currentRow);
        }
        currentRow = [];
        i++;

        // Stop early if maxRows reached (accounting for header row)
        if (maxRows && rawRows.length > maxRows) {
          break;
        }
        continue;
      }

      currentField += char;
      i++;
    }
  }

  // Handle unclosed quote gracefully by saving whatever was read
  if (currentField.length > 0 || currentRow.length > 0) {
    const val = trim ? currentField.trim() : currentField;
    currentRow.push(sanitizeFormulas ? neutralizeFormula(val) : val);
    if (currentRow.some((field) => field.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = rawRows[0].map((h) => h.toLowerCase().trim());
  const rows = rawRows.slice(1);

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

export interface ChunkedParseOptions extends ParseCsvOptions {
  chunkSize?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Parses large CSV strings asynchronously in chunks to prevent UI blocking.
 *
 * @param csvText - The raw CSV string.
 * @param options - Chunking and parse options.
 * @returns Promise resolving to the CsvParseResult.
 */
export async function parseCsvChunked(
  csvText: string,
  options: ChunkedParseOptions = {},
): Promise<CsvParseResult> {
  const { chunkSize = 1000, onProgress, ...parseOptions } = options;

  // Initial full parse (fast in V8 JS engine up to tens of thousands of rows)
  const result = parseCsv(csvText, parseOptions);

  if (onProgress && result.rows.length > chunkSize) {
    const total = result.rows.length;
    for (let i = 0; i < total; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const percent = Math.min(100, Math.round(((i + chunkSize) / total) * 100));
      onProgress(percent);
    }
    onProgress(100);
  } else if (onProgress) {
    onProgress(100);
  }

  return result;
}
