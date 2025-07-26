import { parse, isWithinInterval, isValid } from "date-fns"

export function parseTransactionDate(dateString: string): Date | null {
  try {
    // Parse the date string "Apr 12, 2023" format
    const parsed = parse(dateString, "MMM dd, yyyy", new Date())
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function isDateInRange(
  transactionDate: string,
  startDate: Date | undefined,
  endDate: Date | undefined,
): boolean {
  const parsedDate = parseTransactionDate(transactionDate)

  if (!parsedDate) return true // If we can't parse the date, include it

  // If no date range is selected, show all transactions
  if (!startDate && !endDate) return true

  // If only start date is selected
  if (startDate && !endDate) {
    return parsedDate >= startDate
  }

  // If only end date is selected
  if (!startDate && endDate) {
    return parsedDate <= endDate
  }

  // If both dates are selected
  if (startDate && endDate) {
    return isWithinInterval(parsedDate, { start: startDate, end: endDate })
  }

  return true
}
