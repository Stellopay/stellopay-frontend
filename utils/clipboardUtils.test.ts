/**
 * @fileoverview Tests for utils/clipboardUtils.ts
 *
 * Covers:
 * - copyToClipboard: modern Clipboard API path, fallback execCommand path,
 *   and all failure branches
 * - execCommandCopy: success, execCommand returning false, and thrown errors
 * - copyToClipboardWithFeedback: success and failure callbacks
 * - copyToClipboardWithTimeout: success (setCopied toggled), failure (alert),
 *   custom timeout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  copyToClipboard,
  copyToClipboardWithFeedback,
  copyToClipboardWithTimeout,
  execCommandCopy,
} from "./clipboardUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove the Clipboard API from navigator so the fallback path is exercised. */
function removeClipboardApi() {
  Object.defineProperty(navigator, "clipboard", {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

/** Restore a working Clipboard API stub. */
function restoreClipboardApi(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

// ─── execCommandCopy ──────────────────────────────────────────────────────────

describe("execCommandCopy", () => {
  let execCommandSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    execCommandSpy = vi
      .spyOn(document, "execCommand")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when execCommand succeeds", () => {
    expect(execCommandCopy("hello")).toBe(true);
  });

  it("appends and then removes the textarea from the DOM", () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");

    execCommandCopy("test");

    expect(appendSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();
  });

  it("creates a textarea with the correct value", () => {
    let capturedTextarea: HTMLTextAreaElement | null = null;
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      capturedTextarea = el as HTMLTextAreaElement;
      return el;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    execCommandCopy("clipboard text");

    expect(capturedTextarea).not.toBeNull();
    expect((capturedTextarea as unknown as HTMLTextAreaElement).value).toBe(
      "clipboard text",
    );
  });

  it("sets aria-hidden and tabindex on the textarea for accessibility", () => {
    let capturedTextarea: HTMLTextAreaElement | null = null;
    vi.spyOn(document.body, "appendChild").mockImplementation((el) => {
      capturedTextarea = el as HTMLTextAreaElement;
      return el;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    execCommandCopy("a11y test");

    expect(
      (capturedTextarea as unknown as HTMLTextAreaElement).getAttribute(
        "aria-hidden",
      ),
    ).toBe("true");
    expect(
      (capturedTextarea as unknown as HTMLTextAreaElement).getAttribute(
        "tabindex",
      ),
    ).toBe("-1");
  });

  it("returns false when execCommand returns false", () => {
    execCommandSpy.mockReturnValue(false);
    expect(execCommandCopy("hello")).toBe(false);
  });

  it("returns false when execCommand throws", () => {
    execCommandSpy.mockImplementation(() => {
      throw new Error("execCommand not supported");
    });
    expect(execCommandCopy("hello")).toBe(false);
  });

  it("returns false when appendChild throws", () => {
    vi.spyOn(document.body, "appendChild").mockImplementation(() => {
      throw new Error("DOM error");
    });
    expect(execCommandCopy("hello")).toBe(false);
  });
});

// ─── copyToClipboard — Clipboard API available ────────────────────────────────

describe("copyToClipboard — Clipboard API available", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    restoreClipboardApi(writeTextMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when writeText resolves", async () => {
    expect(await copyToClipboard("hello")).toBe(true);
  });

  it("calls navigator.clipboard.writeText with the correct text", async () => {
    await copyToClipboard("stellar address");
    expect(writeTextMock).toHaveBeenCalledWith("stellar address");
  });

  it("falls back to execCommand when writeText rejects", async () => {
    writeTextMock.mockRejectedValue(new Error("Permission denied"));
    const execSpy = vi
      .spyOn(document, "execCommand")
      .mockImplementation(() => true);

    const result = await copyToClipboard("fallback text");

    expect(result).toBe(true);
    expect(execSpy).toHaveBeenCalled();
  });

  it("returns false when writeText rejects and execCommand also fails", async () => {
    writeTextMock.mockRejectedValue(new Error("Permission denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);

    expect(await copyToClipboard("fail")).toBe(false);
  });
});

// ─── copyToClipboard — Clipboard API unavailable (fallback path) ──────────────

describe("copyToClipboard — Clipboard API unavailable", () => {
  beforeEach(() => {
    removeClipboardApi();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore a basic clipboard stub so other suites are unaffected.
    restoreClipboardApi(vi.fn().mockResolvedValue(undefined));
  });

  it("uses the execCommand fallback when navigator.clipboard is undefined", async () => {
    const execSpy = vi
      .spyOn(document, "execCommand")
      .mockImplementation(() => true);

    const result = await copyToClipboard("fallback");

    expect(result).toBe(true);
    expect(execSpy).toHaveBeenCalled();
  });

  it("returns true when the execCommand fallback succeeds", async () => {
    vi.spyOn(document, "execCommand").mockImplementation(() => true);
    expect(await copyToClipboard("text")).toBe(true);
  });

  it("returns false when the execCommand fallback returns false", async () => {
    vi.spyOn(document, "execCommand").mockImplementation(() => false);
    expect(await copyToClipboard("text")).toBe(false);
  });

  it("returns false when the execCommand fallback throws", async () => {
    vi.spyOn(document, "execCommand").mockImplementation(() => {
      throw new Error("not supported");
    });
    expect(await copyToClipboard("text")).toBe(false);
  });

  it("does not call navigator.clipboard.writeText when the API is absent", async () => {
    // Verify no attempt is made on the (now-undefined) clipboard object.
    vi.spyOn(document, "execCommand").mockImplementation(() => true);
    // Simply must not throw trying to call .writeText on undefined.
    await expect(copyToClipboard("text")).resolves.toBe(true);
  });
});

// ─── copyToClipboardWithFeedback ──────────────────────────────────────────────

describe("copyToClipboardWithFeedback", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    restoreClipboardApi(writeTextMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onSuccess when the copy succeeds", async () => {
    const onSuccess = vi.fn();
    await copyToClipboardWithFeedback("text", onSuccess);
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onError when the copy succeeds", async () => {
    const onError = vi.fn();
    await copyToClipboardWithFeedback("text", undefined, onError);
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError with a message when the copy fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);

    const onError = vi.fn();
    await copyToClipboardWithFeedback("text", undefined, onError);
    expect(onError).toHaveBeenCalledWith("Failed to copy text. Please try again.");
  });

  it("does not call onSuccess when the copy fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);

    const onSuccess = vi.fn();
    await copyToClipboardWithFeedback("text", onSuccess);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("works when both callbacks are omitted", async () => {
    await expect(
      copyToClipboardWithFeedback("text"),
    ).resolves.toBeUndefined();
  });

  it("works when only onSuccess is provided and copy fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);

    const onSuccess = vi.fn();
    await copyToClipboardWithFeedback("text", onSuccess);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

// ─── copyToClipboardWithTimeout ───────────────────────────────────────────────

describe("copyToClipboardWithTimeout", () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    restoreClipboardApi(writeTextMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls setCopied(true) immediately on success", async () => {
    const setCopied = vi.fn();
    await copyToClipboardWithTimeout("text", setCopied);
    expect(setCopied).toHaveBeenCalledWith(true);
  });

  it("calls setCopied(false) after the default 2000 ms timeout", async () => {
    const setCopied = vi.fn();
    await copyToClipboardWithTimeout("text", setCopied);

    expect(setCopied).not.toHaveBeenCalledWith(false);
    vi.advanceTimersByTime(2000);
    expect(setCopied).toHaveBeenCalledWith(false);
  });

  it("calls setCopied(false) after a custom timeout", async () => {
    const setCopied = vi.fn();
    await copyToClipboardWithTimeout("text", setCopied, 500);

    vi.advanceTimersByTime(499);
    expect(setCopied).not.toHaveBeenCalledWith(false);

    vi.advanceTimersByTime(1);
    expect(setCopied).toHaveBeenCalledWith(false);
  });

  it("calls alert when the copy fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const setCopied = vi.fn();

    await copyToClipboardWithTimeout("text", setCopied);

    expect(alertSpy).toHaveBeenCalledWith(
      "Failed to copy text. Please try again.",
    );
    expect(setCopied).not.toHaveBeenCalled();
  });

  it("does not schedule a timeout when the copy fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    vi.spyOn(document, "execCommand").mockImplementation(() => false);
    vi.spyOn(window, "alert").mockImplementation(() => {});

    const setCopied = vi.fn();
    await copyToClipboardWithTimeout("text", setCopied);

    vi.advanceTimersByTime(5000);
    // setCopied must never have been called — not true, not false.
    expect(setCopied).not.toHaveBeenCalled();
  });

  it("uses the fallback path when Clipboard API is absent and still sets setCopied", async () => {
    removeClipboardApi();
    vi.spyOn(document, "execCommand").mockImplementation(() => true);

    const setCopied = vi.fn();
    await copyToClipboardWithTimeout("text", setCopied);

    expect(setCopied).toHaveBeenCalledWith(true);

    // Restore for subsequent tests
    restoreClipboardApi(vi.fn().mockResolvedValue(undefined));
  });
});
