import { vi } from "vitest";

import TransactionPage from "./page";
import { getTransactionById, TransactionNotFoundError } from "@/lib/api";
import { TransactionDetailView } from "@/components/transactions/transaction-detail-view";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/api", () => ({
  getTransactionById: vi.fn(),
  TransactionNotFoundError: class TransactionNotFoundError extends Error {},
}));

vi.mock("@/components/transactions/transaction-detail-view", () => ({
  TransactionDetailView: vi.fn(() => null),
}));

const mockGetTransactionById = vi.mocked(getTransactionById);

describe("transaction detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads by the route id and renders the detail view", async () => {
    const transaction = { id: "42" } as Awaited<
      ReturnType<typeof getTransactionById>
    >;
    mockGetTransactionById.mockResolvedValue(transaction);

    const element = await TransactionPage({
      params: Promise.resolve({ id: "42" }),
    });

    expect(mockGetTransactionById).toHaveBeenCalledWith("42");
    expect(element.type).toBe(TransactionDetailView);
    expect(element.props).toEqual({ transaction });
  });

  it("maps typed not-found errors to the route not-found boundary", async () => {
    mockGetTransactionById.mockRejectedValue(
      new TransactionNotFoundError("missing"),
    );

    await expect(
      TransactionPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("rethrows non-not-found API errors for the route error boundary", async () => {
    mockGetTransactionById.mockRejectedValue(new Error("network down"));

    await expect(
      TransactionPage({ params: Promise.resolve({ id: "42" }) }),
    ).rejects.toThrow("network down");
  });
});
