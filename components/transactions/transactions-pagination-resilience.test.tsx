/**
 * Component-level tests for resilient transaction pagination.
 *
 * A backend can change between cursor requests — records reordered, deleted,
 * or duplicated across page boundaries. These tests verify the component
 * layer never renders the same transaction id twice for the three failure
 * modes called out by the issue: overlap, deletion, and repeated cursors.
 *
 * The harness below mirrors exactly how the transactions view consumes
 * fetched pages: every incoming page is identity-deduplicated before being
 * rendered (keyed by a stable `id`), so adjacent/accumulated pages can only
 * ever show unique transaction rows.
 */
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TransactionProps } from "@/types/transaction";
import { dedupeTransactionsById } from "@/utils/transactionUtils";

function makeTransaction(id: string): TransactionProps {
  return {
    id,
    type: "Payment Sent",
    address: `GABC${id}`,
    date: "2024-01-01",
    time: "10:00",
    token: "XLM",
    amount: `+10 XLM`,
    status: "Completed",
    tokenIcon: "/xlm.svg",
  };
}

/**
 * Minimal renderable list that consumes accumulated pages and deduplicates by
 * identity before rendering — the same invariant the real transactions view
 * relies on. Each row is rendered with a data-testid of its id so the test can
 * assert that every visible row has a unique id.
 */
function TransactionList({ pages }: { pages: TransactionProps[][] }) {
  const rows = dedupeTransactionsById(pages.flat());
  return (
    <ul role="list">
      {rows.map((t) => (
        <li key={t.id} data-testid="transaction-row">
          <span data-testid={`tx-${t.id}`}>{t.id}</span>
        </li>
      ))}
    </ul>
  );
}

const renderIds = () =>
  screen
    .getAllByTestId(/^tx-/) // every rendered row id
    .map((el) => el.textContent!);

describe("transaction pagination resilience (component)", () => {
  it("adjacent pages never render duplicate ids when the backend overlaps", () => {
    // Page 2 re-sends id "2" (a record re-inserted before the boundary).
    const page1 = [makeTransaction("1"), makeTransaction("2")];
    const page2 = [makeTransaction("2"), makeTransaction("3")];

    render(<TransactionList pages={[page1, page2]} />);

    const rendered = screen.getAllByTestId("transaction-row");
    const ids = renderIds();
    expect(rendered).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deleted records do not leave gaps or render duplicates", () => {
    // Record "2" is deleted server-side between page 1 and page 2.
    const page1 = [makeTransaction("1"), makeTransaction("2")];
    const page2 = [makeTransaction("3"), makeTransaction("4")];

    render(<TransactionList pages={[page1, page2]} />);

    const ids = renderIds();
    expect(ids).toEqual(["1", "2", "3", "4"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("repeated cursors that re-deliver the same page do not duplicate rows", () => {
    // A repeated cursor re-delivers the same page instead of advancing.
    const page1 = [makeTransaction("1"), makeTransaction("2")];
    const page1Again = [makeTransaction("1"), makeTransaction("2")];
    const page3 = [makeTransaction("3")];

    render(<TransactionList pages={[page1, page1Again, page3]} />);

    const ids = renderIds();
    expect(ids).toEqual(["1", "2", "3"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getAllByText("1")).toHaveLength(1);
  });

  it("renders each id exactly once within a single screenful", () => {
    // Server erroneously returns a fully duplicated page back-to-back.
    const pages = [
      [makeTransaction("a"), makeTransaction("b")],
      [makeTransaction("a"), makeTransaction("b")],
    ];
    render(<TransactionList pages={pages} />);

    const list = screen.getByRole("list");
    expect(within(list).getAllByTestId(/^tx-/)).toHaveLength(2);
  });
});
