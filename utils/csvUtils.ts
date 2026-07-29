/**
 * Utility functions for generating and downloading CSV files.
 */

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
