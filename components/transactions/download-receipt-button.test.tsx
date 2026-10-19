import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadReceiptButton } from "./download-receipt-button";
import {
  generateTransactionReceiptPdf,
  type ReceiptTransaction,
} from "./receipt";
import {
  getReceiptValidationError,
  ReceiptValidationError,
} from "./receipt-validation";

const { stateWrite } = vi.hoisted(() => ({ stateWrite: vi.fn() }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const [value, setValue] = actual.useState(initial);
      return [
        value,
        (next: unknown) => {
          stateWrite(next);
          setValue(next);
        },
      ];
    },
  };
});
vi.mock("./receipt", () => ({ generateTransactionReceiptPdf: vi.fn() }));

const transaction: ReceiptTransaction = {
  id: "tx_1",
  hash: "0xabc123",
  amount: "$100.00",
  counterparty: "Example Customer",
  timestamp: "2026-10-19T08:00:00.000Z",
};
const limits = {
  id: 256,
  hash: 256,
  amount: 128,
  counterparty: 512,
  timestamp: 64,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateTransactionReceiptPdf).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("DownloadReceiptButton input validation", () => {
  const invalid: [string, unknown, string][] = [
    ["null", null, "transaction"],
    ["undefined", undefined, "transaction"],
    ["array", [], "transaction"],
    ["string", "receipt", "transaction"],
    ["empty object", {}, "id"],
    ["invalid date", { ...transaction, timestamp: "not a date" }, "timestamp"],
    ...Object.keys(limits).flatMap((field): [string, unknown, string][] => [
      [`${field} missing`, { ...transaction, [field]: undefined }, field],
      [`${field} wrong type`, { ...transaction, [field]: 42 }, field],
      [`${field} empty`, { ...transaction, [field]: "" }, field],
      [`${field} whitespace`, { ...transaction, [field]: " \t " }, field],
      [
        `${field} oversized`,
        {
          ...transaction,
          [field]: "x".repeat(limits[field as keyof typeof limits] + 1),
        },
        field,
      ],
    ]),
  ];

  it.each(invalid)(
    "rejects %s before state writes or download effects",
    (_, input, field) => {
      const error = getReceiptValidationError(input);
      render(
        <DownloadReceiptButton transaction={input as ReceiptTransaction} />,
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ReceiptValidationError);
      expect(error).toMatchObject({
        name: "ReceiptValidationError",
        code: "INVALID_RECEIPT_INPUT",
        issues: expect.arrayContaining([
          expect.objectContaining({ path: field, message: expect.any(String) }),
        ]),
        message: expect.stringContaining(field),
      });
      expect(stateWrite).not.toHaveBeenCalled();
      const button = screen.getByRole("button", {
        name: "Download PDF receipt",
      });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(screen.getByRole("alert")).toHaveTextContent(error!.message);
      expect(stateWrite).not.toHaveBeenCalled();
      expect(generateTransactionReceiptPdf).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["", /non-empty/i],
    [42, /expected string/i],
    ["x".repeat(257), /at most 256/i],
  ])("explains how to correct invalid id %s", (id, reason) => {
    render(
      <DownloadReceiptButton
        transaction={{ ...transaction, id } as ReceiptTransaction}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(reason as RegExp);
  });

  it("accepts a timestamp at its length boundary", async () => {
    const input = {
      ...transaction,
      timestamp: "Oct 19, 2026 08:00 AM".padEnd(64, " "),
    };
    render(<DownloadReceiptButton transaction={input} />);
    fireEvent.click(screen.getByRole("button"));
    expect(generateTransactionReceiptPdf).toHaveBeenCalledExactlyOnceWith(
      input,
    );
    await act(async () => {});
  });

  it.each(Object.keys(limits).filter((field) => field !== "timestamp"))(
    "accepts %s at its length boundary without changing the input",
    async (field) => {
      const input = Object.freeze({
        ...transaction,
        [field]: "x".repeat(limits[field as keyof typeof limits]),
      });
      render(<DownloadReceiptButton transaction={input} />);
      fireEvent.click(screen.getByRole("button"));
      expect(generateTransactionReceiptPdf).toHaveBeenCalledExactlyOnceWith(
        input,
      );
      expect(vi.mocked(generateTransactionReceiptPdf).mock.calls[0][0]).toBe(
        input,
      );
      await act(async () => {});
    },
  );

  it("preserves formatted amounts, whitespace, Unicode and table date formats", async () => {
    const input = Object.freeze({
      ...transaction,
      amount: " 1,000.00 USDC ",
      counterparty: "Éxample Customer",
      timestamp: "Oct 19, 2026 08:00 AM",
    });
    render(<DownloadReceiptButton transaction={input} />);
    fireEvent.click(screen.getByRole("button"));
    expect(generateTransactionReceiptPdf).toHaveBeenCalledExactlyOnceWith(
      input,
    );
    expect(input.amount).toBe(" 1,000.00 USDC ");
    await act(async () => {});
  });
});

describe("DownloadReceiptButton valid downloads", () => {
  it("keeps its label and loading state, prevents repeat clicks, and resets on success", async () => {
    let finish!: () => void;
    vi.mocked(generateTransactionReceiptPdf).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<DownloadReceiptButton transaction={transaction} />);
    const button = screen.getByRole("button", {
      name: "Download PDF receipt for transaction 0xabc123",
    });
    expect(button).toHaveTextContent("Download receipt");
    expect(stateWrite).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Generating…");
    fireEvent.click(button);
    expect(generateTransactionReceiptPdf).toHaveBeenCalledExactlyOnceWith(
      transaction,
    );
    await act(async () => {
      finish();
    });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Download receipt");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(stateWrite.mock.calls.map(([value]) => value)).toEqual([
      null,
      true,
      false,
    ]);
  });

  it("retains the generation error and allows a successful retry", async () => {
    vi.mocked(generateTransactionReceiptPdf).mockRejectedValueOnce(
      new Error("private detail"),
    );
    render(<DownloadReceiptButton transaction={transaction} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't generate the receipt. Please try again.",
    );
    expect(screen.queryByText("private detail")).not.toBeInTheDocument();
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await act(async () => {});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(generateTransactionReceiptPdf).toHaveBeenCalledTimes(2);
  });
});
