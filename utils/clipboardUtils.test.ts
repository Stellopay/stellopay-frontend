import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  copyToClipboard,
  copyToClipboardWithFeedback,
  copyToClipboardWithTimeout,
} from "./clipboardUtils";

const writeText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  writeText.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  writeText.mockReset();
});

describe("clipboardUtils", () => {
  it("copies text to clipboard", async () => {
    await expect(copyToClipboard("stellar")).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("stellar");
  });

  it("keeps feedback callbacks unchanged", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await copyToClipboardWithFeedback("ok", onSuccess, onError);

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it("sets copied true and resets after a valid timeout", async () => {
    const setCopied = vi.fn();

    await copyToClipboardWithTimeout("address", setCopied, 500);

    expect(setCopied).toHaveBeenCalledWith(true);
    expect(setCopied).not.toHaveBeenCalledWith(false);

    vi.advanceTimersByTime(500);

    expect(setCopied).toHaveBeenLastCalledWith(false);
  });

  it("defaults invalid timeout values to 2000ms", async () => {
    const setCopied = vi.fn();

    await copyToClipboardWithTimeout("address", setCopied, Number.POSITIVE_INFINITY);

    vi.advanceTimersByTime(1999);
    expect(setCopied).not.toHaveBeenCalledWith(false);

    vi.advanceTimersByTime(1);
    expect(setCopied).toHaveBeenLastCalledWith(false);
  });

  it("returns cleanup that cancels the pending reset timer", async () => {
    const setCopied = vi.fn();

    const cleanup = await copyToClipboardWithTimeout("address", setCopied, 500);
    cleanup();
    vi.advanceTimersByTime(500);

    expect(setCopied).toHaveBeenCalledTimes(1);
    expect(setCopied).toHaveBeenCalledWith(true);
  });

  it("calls onError instead of alerting when clipboard write fails", async () => {
    const setCopied = vi.fn();
    const onError = vi.fn();
    const alertSpy = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
    writeText.mockRejectedValueOnce(new Error("permission denied"));

    await copyToClipboardWithTimeout("address", setCopied, 500, onError);

    expect(setCopied).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Failed to copy text. Please try again.");
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
