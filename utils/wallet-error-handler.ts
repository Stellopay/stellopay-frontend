/**
 * Maps wallet and contract-specific errors to user-friendly messages
 */
export function getWalletErrorMessage(error: unknown): string {
  // Handle WalletRPCError and other error types
  let errorMessage = "";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === "object") {
    // Handle WalletRPCError which might have a message property
    const anyError = error as any;
    errorMessage = anyError.message || anyError.toString() || String(error);
  } else {
    errorMessage = String(error);
  }
  
  const errorLower = errorMessage.toLowerCase();

  // User rejection errors (including USER_REFUSED_OP)
  // Check both lowercase and original case for USER_REFUSED_OP
  if (
    errorLower.includes("user_refused") ||
    errorLower.includes("user_refused_op") ||
    errorLower.includes("user rejected") ||
    errorLower.includes("user cancelled") ||
    errorLower.includes("user canceled") ||
    errorLower.includes("rejected by user") ||
    errorLower.includes("user abort") ||
    errorLower.includes("user refused") ||
    errorMessage.includes("USER_REFUSED_OP") ||
    errorMessage.includes("USER_REFUSED")
  ) {
    return "Please sign the message to proceed";
  }

  // Transaction rejection errors
  if (
    errorLower.includes("transaction rejected") ||
    errorLower.includes("tx rejected") ||
    errorLower.includes("user refused") ||
    errorLower.includes("user declined")
  ) {
    return "Transaction was cancelled. Please try again when ready";
  }

  // Wallet connection errors
  if (
    errorLower.includes("wallet not found") ||
    errorLower.includes("no wallet") ||
    errorLower.includes("wallet extension") ||
    errorLower.includes("wallet not installed")
  ) {
    return "Wallet not found. Please install a Starknet wallet extension";
  }

  // Network errors
  if (
    errorLower.includes("network") ||
    errorLower.includes("rpc") ||
    errorLower.includes("connection") ||
    errorLower.includes("timeout")
  ) {
    return "Network error. Please check your connection and try again";
  }

  // Signature errors
  if (
    errorLower.includes("signature") ||
    errorLower.includes("sign message") ||
    errorLower.includes("signing failed")
  ) {
    return "Failed to sign message. Please try again";
  }

  // Contract/transaction errors
  if (
    errorLower.includes("contract") ||
    errorLower.includes("execution reverted") ||
    errorLower.includes("revert") ||
    errorLower.includes("insufficient") ||
    errorLower.includes("balance")
  ) {
    return "Transaction failed. Please check your balance and try again";
  }

  // Session/authentication errors
  if (
    errorLower.includes("session") ||
    errorLower.includes("unauthorized") ||
    errorLower.includes("authentication") ||
    errorLower.includes("verify")
  ) {
    return "Authentication failed. Please reconnect your wallet";
  }

  // Generic fallback
  if (errorLower.includes("failed") || errorLower.includes("error")) {
    return "Something went wrong. Please try again";
  }

  // Return original message if no match (but make it more user-friendly)
  return "An error occurred. Please try again";
}

