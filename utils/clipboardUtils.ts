/**
 * Clipboard utility functions
 */

/**
 * Copies text to clipboard with error handling
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy text to clipboard:", error);
    return false;
  }
};

/**
 * Copies text to clipboard and shows feedback
 * @param text - The text to copy
 * @param onSuccess - Callback function to call on successful copy
 * @param onError - Callback function to call on error
 */
export const copyToClipboardWithFeedback = async (
  text: string,
  onSuccess?: () => void,
  onError?: (error: string) => void,
): Promise<void> => {
  const success = await copyToClipboard(text);

  if (success) {
    onSuccess?.();
  } else {
    onError?.("Failed to copy text. Please try again.");
  }
};

/**
 * Copies text to clipboard with timeout feedback
 * @param text - The text to copy
 * @param setCopied - State setter function for copied status
 * @param timeout - Timeout duration in milliseconds (default: 2000)
 * @param onError - Callback function to call on error
 * @returns Cleanup function that clears the pending reset timer
 */
export const copyToClipboardWithTimeout = async (
  text: string,
  setCopied: (value: boolean) => void,
  timeout: number = 2000,
  onError?: (error: string) => void,
): Promise<() => void> => {
  const success = await copyToClipboard(text);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (success) {
    const safeTimeout =
      Number.isFinite(timeout) && timeout > 0 ? timeout : 2000;

    setCopied(true);
    timeoutId = setTimeout(() => setCopied(false), safeTimeout);
  } else {
    onError?.("Failed to copy text. Please try again.");
  }

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};
