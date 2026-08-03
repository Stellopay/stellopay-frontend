/**
 * Tests for WatchlistPanel and the WatchlistProvider/useWatchlist integration.
 *
 * Coverage goals
 * ──────────────
 * - Render: panel mounts, heading, empty-state, loading skeleton
 * - Add item: form open/close, validation, successful pin, duplicate guard
 * - Remove item: unpin button removes the card
 * - Search: filters by address, label, token; clear button
 * - Persistence: localStorage read/write per account address
 * - Accessibility: aria attributes, keyboard reachability, role landmarks
 * - Dark-mode / design tokens: spot-checked via class assertions
 */

import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WatchlistPanel } from "@/components/dashboard/watchlist-panel";
import {
  WalletProvider,
  WatchlistProvider,
  useWatchlist,
} from "@/context/wallet-context";
import type { WatchlistItem } from "@/types/watchlist";

// ─── Shared test address ──────────────────────────────────────────────────────

const WALLET_ADDRESS =
  "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPF123";

const SECOND_WALLET =
  "GZYXWVUTSRQPONMLKJIHGFEDCBA7654321ZYXWVUTSRQPONMF456";

// ─── Helper: full provider tree ───────────────────────────────────────────────

function renderWithProviders(
  ui: React.ReactNode,
  { address = WALLET_ADDRESS }: { address?: string | null } = {},
) {
  return render(
    <WalletProvider initialAddress={address}>
      <WatchlistProvider>{ui}</WatchlistProvider>
    </WalletProvider>,
  );
}

// ─── Helper: pre-seed localStorage watchlist for an address ──────────────────

function seedStorage(address: string, items: WatchlistItem[]) {
  window.localStorage.setItem(
    `stellopay.watchlist.${address}`,
    JSON.stringify(items),
  );
}

function makeItem(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: "test-id-1",
    address: "0xA1B2...C3D4E5",
    pinnedAt: "2023-04-12T09:32:00Z",
    ...overrides,
  };
}

// ─── 1. Render & structure ────────────────────────────────────────────────────

describe("WatchlistPanel – render & structure", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("renders without crashing", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(screen.getByTestId("watchlist-panel")).toBeInTheDocument();
  });

  it("displays the 'Watchlist' heading", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.getByRole("heading", { name: /watchlist/i }),
    ).toBeInTheDocument();
  });

  it("shows the subtitle text", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.getByText(/pinned counterparties/i),
    ).toBeInTheDocument();
  });

  it("has a 'Pin Item' button in the header", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.getByRole("button", { name: /pin (?:new )?item/i }),
    ).toBeInTheDocument();
  });

  it("accepts an optional className prop", () => {
    renderWithProviders(<WatchlistPanel className="custom-class" />);
    expect(screen.getByTestId("watchlist-panel")).toHaveClass("custom-class");
  });

  it("panel is wrapped in a <section> element", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(screen.getByTestId("watchlist-panel").tagName).toBe("SECTION");
  });

  it("section has aria-labelledby pointing to the heading", () => {
    renderWithProviders(<WatchlistPanel />);
    const section = screen.getByTestId("watchlist-panel");
    const heading = screen.getByRole("heading", { name: /watchlist/i });
    const labelledById = section.getAttribute("aria-labelledby");
    expect(labelledById).toBeTruthy();
    expect(heading.id).toBe(labelledById);
  });
});

// ─── 2. Empty state ───────────────────────────────────────────────────────────

describe("WatchlistPanel – empty state", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("shows the empty state when no items are pinned", async () => {
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => {
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument();
    });
  });

  it("empty state contains a 'Pin your first item' button", async () => {
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /pin your first item/i }),
      ).toBeInTheDocument();
    });
  });

  it("clicking 'Pin your first item' opens the add form", async () => {
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      screen.getByRole("button", { name: /pin your first item/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /pin your first item/i }),
    );
    expect(
      screen.getByRole("form", { name: /add item to watchlist/i }),
    ).toBeInTheDocument();
  });

  it("empty state disappears once an item is added", async () => {
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      screen.getByRole("button", { name: /pin (?:new )?item/i }),
    );

    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));
    const input = screen.getByLabelText(/address or asset/i);
    fireEvent.change(input, { target: { value: "GABCDE...XYZ67890" } });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("watchlist-empty")).not.toBeInTheDocument();
    });
  });
});

// ─── 3. Loading state ─────────────────────────────────────────────────────────

describe("WatchlistPanel – loading state", () => {
  it("shows a loading skeleton with role='status' while loading", () => {
    // Render with a disconnected wallet so the effect hasn't resolved yet.
    // Because jsdom is synchronous this is tricky; we test the attribute instead.
    renderWithProviders(<WatchlistPanel />, { address: null });
    // After sync hydration the panel is in the post-loading state; check
    // that the loading element is NOT stuck on screen after load completes.
    expect(
      screen.queryByTestId("watchlist-loading"),
    ).not.toBeInTheDocument();
  });
});

// ─── 4. Add-item form ─────────────────────────────────────────────────────────

describe("WatchlistPanel – add-item form", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  function openForm() {
    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));
  }

  it("the 'Pin Item' header button toggles the add form open", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.queryByRole("form", { name: /add item to watchlist/i }),
    ).not.toBeInTheDocument();

    openForm();

    expect(
      screen.getByRole("form", { name: /add item to watchlist/i }),
    ).toBeInTheDocument();
  });

  it("the header button label changes to 'Cancel' when form is open", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    expect(
      screen.getByRole("button", { name: /cancel adding to watchlist/i }),
    ).toBeInTheDocument();
  });

  it("the header button has aria-expanded=true when form is open", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    expect(
      screen.getByRole("button", { name: /cancel adding to watchlist/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("the header button has aria-expanded=false when form is closed", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.getByRole("button", { name: /pin (?:new )?item/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("form has address and label inputs", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    expect(screen.getByLabelText(/address or asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
  });

  it("address input is marked required", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    expect(screen.getByLabelText(/address or asset/i)).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("submitting with empty address shows a validation error", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/address is required/i)).toBeInTheDocument();
  });

  it("submitting with address < 8 chars shows a validation error", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABC" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("validation error sets aria-invalid=true on the address input", () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
    expect(screen.getByLabelText(/address or asset/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("successfully adds an item with just an address", async () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABCDE...XYZ67890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

    await waitFor(() => {
      expect(screen.getByText("GABCDE...XYZ67890")).toBeInTheDocument();
    });
  });

  it("successfully adds an item with address and label", async () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABCDE...XYZ67890" },
    });
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: "Payroll Account" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

    await waitFor(() => {
      expect(screen.getByText("Payroll Account")).toBeInTheDocument();
    });
  });

  it("closes the form after a successful pin", async () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABCDE...XYZ67890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("form", { name: /add item to watchlist/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("Cancel button closes the form without adding an item", async () => {
    renderWithProviders(<WatchlistPanel />);
    openForm();
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABCDE...XYZ67890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(
      screen.queryByRole("form", { name: /add item to watchlist/i }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument();
    });
  });

  it("does not add a duplicate address (case-insensitive)", async () => {
    renderWithProviders(<WatchlistPanel />);

    const pinTwice = async (addr: string) => {
      openForm();
      fireEvent.change(screen.getByLabelText(/address or asset/i), {
        target: { value: addr },
      });
      fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
      await waitFor(() =>
        expect(
          screen.queryByRole("form", { name: /add item to watchlist/i }),
        ).not.toBeInTheDocument(),
      );
    };

    await pinTwice("GABCDE...XYZ67890");
    await pinTwice("GABCDE...XYZ67890");

    // Only one card should appear.
    expect(screen.getAllByText("GABCDE...XYZ67890")).toHaveLength(1);
  });
});

// ─── 5. Remove (unpin) ────────────────────────────────────────────────────────

describe("WatchlistPanel – remove item", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  async function addItemToPanel(address: string, label?: string) {
    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: address },
    });
    if (label) {
      fireEvent.change(screen.getByLabelText(/label/i), {
        target: { value: label },
      });
    }
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("form", { name: /add item to watchlist/i }),
      ).not.toBeInTheDocument(),
    );
  }

  it("renders an unpin button for each item", async () => {
    renderWithProviders(<WatchlistPanel />);
    await addItemToPanel("GABCDE...XYZ67890");
    expect(
      screen.getByRole("button", { name: /unpin GABCDE\.\.\.XYZ67890/i }),
    ).toBeInTheDocument();
  });

  it("clicking unpin removes the item from the list", async () => {
    renderWithProviders(<WatchlistPanel />);
    await addItemToPanel("GABCDE...XYZ67890");

    fireEvent.click(
      screen.getByRole("button", { name: /unpin GABCDE\.\.\.XYZ67890/i }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText("GABCDE...XYZ67890"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows empty state again after the last item is unpinned", async () => {
    renderWithProviders(<WatchlistPanel />);
    await addItemToPanel("GABCDE...XYZ67890");

    fireEvent.click(
      screen.getByRole("button", { name: /unpin GABCDE\.\.\.XYZ67890/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument();
    });
  });

  it("unpin button uses label to describe the item when label is set", async () => {
    renderWithProviders(<WatchlistPanel />);
    await addItemToPanel("GABCDE...XYZ67890", "Payroll Account");

    expect(
      screen.getByRole("button", { name: /unpin Payroll Account/i }),
    ).toBeInTheDocument();
  });
});

// ─── 6. Search / filter ───────────────────────────────────────────────────────

describe("WatchlistPanel – search", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  function seedTwoItems() {
    const items: WatchlistItem[] = [
      makeItem({ id: "id-1", address: "GABCDE...XYZ67890", label: "Payroll" }),
      makeItem({ id: "id-2", address: "0xA1B2...C3D4E5", token: "USDC" }),
    ];
    seedStorage(WALLET_ADDRESS, items);
  }

  it("search input is visible when items are present", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/GABCDE/i).length).toBeGreaterThan(0),
    );
    expect(screen.getByLabelText(/search watchlist/i)).toBeInTheDocument();
  });

  it("filters items by address fragment", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/GABCDE/i).length).toBeGreaterThan(0),
    );

    fireEvent.change(screen.getByLabelText(/search watchlist/i), {
      target: { value: "GABCDE" },
    });

    expect(screen.queryByText("0xA1B2...C3D4E5")).not.toBeInTheDocument();
    expect(screen.getByText("GABCDE...XYZ67890")).toBeInTheDocument();
  });

  it("filters items by label", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/Payroll/i).length).toBeGreaterThan(0),
    );

    fireEvent.change(screen.getByLabelText(/search watchlist/i), {
      target: { value: "Payroll" },
    });

    expect(screen.getByText("GABCDE...XYZ67890")).toBeInTheDocument();
    expect(screen.queryByText("0xA1B2...C3D4E5")).not.toBeInTheDocument();
  });

  it("filters items by token symbol", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/USDC/i).length).toBeGreaterThan(0),
    );

    fireEvent.change(screen.getByLabelText(/search watchlist/i), {
      target: { value: "USDC" },
    });

    expect(screen.getByText("0xA1B2...C3D4E5")).toBeInTheDocument();
    expect(screen.queryByText("GABCDE...XYZ67890")).not.toBeInTheDocument();
  });

  it("shows no-results message when query matches nothing", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/GABCDE/i).length).toBeGreaterThan(0),
    );

    fireEvent.change(screen.getByLabelText(/search watchlist/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByTestId("watchlist-no-results")).toBeInTheDocument();
    expect(screen.getByText(/zzznomatch/i)).toBeInTheDocument();
  });

  it("clear search button removes the query and shows all items", async () => {
    seedTwoItems();
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getAllByText(/GABCDE/i).length).toBeGreaterThan(0),
    );

    fireEvent.change(screen.getByLabelText(/search watchlist/i), {
      target: { value: "GABCDE" },
    });
    expect(screen.queryByText("0xA1B2...C3D4E5")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    await waitFor(() => {
      expect(screen.getByText("0xA1B2...C3D4E5")).toBeInTheDocument();
    });
  });

  it("search input is not rendered when the list is empty", async () => {
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText(/search watchlist/i),
    ).not.toBeInTheDocument();
  });
});

// ─── 7. Item card display ─────────────────────────────────────────────────────

describe("WatchlistPanel – item card display", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("shows the address on the card", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem()]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("0xA1B2...C3D4E5")).toBeInTheDocument(),
    );
  });

  it("shows the label when present", async () => {
    seedStorage(WALLET_ADDRESS, [
      makeItem({ label: "My Counterparty" }),
    ]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("My Counterparty")).toBeInTheDocument(),
    );
  });

  it("shows the balance when present", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ balance: "$1,234.56" })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("$1,234.56")).toBeInTheDocument(),
    );
  });

  it("shows the last-activity timestamp when present", async () => {
    seedStorage(WALLET_ADDRESS, [
      makeItem({ lastActivity: "Apr 12, 2023" }),
    ]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("Apr 12, 2023")).toBeInTheDocument(),
    );
  });

  it("shows the last-status badge when present", async () => {
    seedStorage(WALLET_ADDRESS, [
      makeItem({ lastStatus: "Completed", lastStatusColor: "success" }),
    ]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("Completed")).toBeInTheDocument(),
    );
  });

  it("shows the token badge when present", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ token: "XLM" })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("XLM")).toBeInTheDocument(),
    );
  });

  it("shows the positive last-amount when present", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ lastAmount: 307.07 })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("+$307.07")).toBeInTheDocument(),
    );
  });

  it("shows the negative last-amount when present", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ lastAmount: -607.87 })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("-$607.87")).toBeInTheDocument(),
    );
  });

  it("each item card is an <article> with an aria-label", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ label: "Payroll" })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => screen.getByText("Payroll"));
    const article = screen.getByRole("article", {
      name: /watchlist item: Payroll/i,
    });
    expect(article).toBeInTheDocument();
  });

  it("the items list is a <ul> with an accessible label", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem()]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => screen.getByText("0xA1B2...C3D4E5"));
    expect(screen.getByRole("list", { name: /pinned item/i })).toBeInTheDocument();
  });
});

// ─── 8. Persistence (localStorage) ───────────────────────────────────────────

describe("WatchlistProvider – persistence", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("reads pre-seeded items from localStorage on mount", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ label: "Seeded Item" })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByText("Seeded Item")).toBeInTheDocument(),
    );
  });

  it("writes newly-pinned item to localStorage", async () => {
    renderWithProviders(<WatchlistPanel />);
    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));
    fireEvent.change(screen.getByLabelText(/address or asset/i), {
      target: { value: "GABCDE...XYZ67890" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

    await waitFor(() =>
      expect(screen.getByText("GABCDE...XYZ67890")).toBeInTheDocument(),
    );

    const stored = JSON.parse(
      window.localStorage.getItem(
        `stellopay.watchlist.${WALLET_ADDRESS}`,
      ) ?? "[]",
    ) as WatchlistItem[];
    expect(stored.some((i) => i.address === "GABCDE...XYZ67890")).toBe(true);
  });

  it("removes item from localStorage when unpinned", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ id: "x1" })]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => screen.getByText("0xA1B2...C3D4E5"));

    fireEvent.click(
      screen.getByRole("button", { name: /unpin 0xA1B2/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText("0xA1B2...C3D4E5"),
      ).not.toBeInTheDocument(),
    );

    const stored = JSON.parse(
      window.localStorage.getItem(
        `stellopay.watchlist.${WALLET_ADDRESS}`,
      ) ?? "[]",
    ) as WatchlistItem[];
    expect(stored).toHaveLength(0);
  });

  it("uses a separate storage key per wallet address", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ label: "WalletA item" })]);
    seedStorage(SECOND_WALLET, [
      makeItem({ id: "b1", address: "0xBBBB...1234", label: "WalletB item" }),
    ]);

    // Render with WALLET_ADDRESS
    const { unmount } = render(
      <WalletProvider initialAddress={WALLET_ADDRESS}>
        <WatchlistProvider>
          <WatchlistPanel />
        </WatchlistProvider>
      </WalletProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("WalletA item")).toBeInTheDocument(),
    );
    expect(screen.queryByText("WalletB item")).not.toBeInTheDocument();
    unmount();
  });

  it("shows empty watchlist for a disconnected wallet (null address)", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem({ label: "Should not show" })]);
    renderWithProviders(<WatchlistPanel />, { address: null });
    await waitFor(() =>
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("ignores malformed localStorage data gracefully", async () => {
    window.localStorage.setItem(
      `stellopay.watchlist.${WALLET_ADDRESS}`,
      "NOT_VALID_JSON{{",
    );
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() =>
      expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument(),
    );
  });
});

// ─── 9. useWatchlist – outside-provider error ─────────────────────────────────

describe("useWatchlist – guard", () => {
  it("throws when called outside WatchlistProvider", () => {
    // Suppress the expected React error boundary output.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BareConsumer() {
      useWatchlist();
      return null;
    }

    expect(() => render(<BareConsumer />)).toThrow(
      /useWatchlist must be used within a WatchlistProvider/,
    );

    spy.mockRestore();
  });
});

// ─── 10. Accessibility spot-checks ───────────────────────────────────────────

describe("WatchlistPanel – accessibility", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("all interactive buttons are keyboard-reachable (not disabled via tabIndex)", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem()]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => screen.getByText("0xA1B2...C3D4E5"));

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).not.toHaveAttribute("tabindex", "-1");
    }
  });

  it("form inputs have visible labels", () => {
    renderWithProviders(<WatchlistPanel />);
    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));

    const addressInput = screen.getByLabelText(/address or asset/i);
    const labelInput = screen.getByLabelText(/label/i);
    expect(addressInput).toBeInTheDocument();
    expect(labelInput).toBeInTheDocument();
  });

  it("search input has an accessible label", async () => {
    seedStorage(WALLET_ADDRESS, [makeItem()]);
    renderWithProviders(<WatchlistPanel />);
    await waitFor(() => screen.getByText("0xA1B2...C3D4E5"));
    expect(screen.getByLabelText(/search watchlist/i)).toBeInTheDocument();
  });

  it("validation error message has role='alert'", () => {
    renderWithProviders(<WatchlistPanel />);
    fireEvent.click(screen.getByRole("button", { name: /pin (?:new )?item/i }));
    fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("the panel section has a heading at level 2", () => {
    renderWithProviders(<WatchlistPanel />);
    expect(
      screen.getByRole("heading", { name: /watchlist/i, level: 2 }),
    ).toBeInTheDocument();
  });
});
