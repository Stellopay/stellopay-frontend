import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Navbar from "./navbar";

// ── Mock external dependencies ────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

vi.mock("@/context/theme-context", () => ({
  useTheme: () => ({
    theme: "light",
    resolvedTheme: "light",
    toggleTheme: vi.fn(),
  }),
}));

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/context/wallet-context", () => ({
  useWallet: vi.fn(),
  formatAddress: (addr: string | null) => {
    if (!addr) return "";
    if (addr.length <= 9) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  },
}));

vi.mock("@/components/common/network-switcher", () => ({
  default: () => <div data-testid="network-switcher" />,
}));

vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  },
}));

import { useWallet } from "@/context/wallet-context";
const mockUseWallet = useWallet as unknown as ReturnType<typeof vi.fn>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMenuButton() {
  return screen.getByRole("button", { name: /open menu|close menu/i });
}

function openMenu() {
  fireEvent.click(getMenuButton());
}

function getDrawer() {
  return screen.queryByRole("dialog", { name: /mobile navigation menu/i });
}

const ADDRESS = "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV";

function defaultWalletState(overrides: Record<string, unknown> = {}) {
  return {
    address: null,
    isConnected: false,
    network: { id: "stellar", name: "Stellar" },
    isUnsupportedNetwork: false,
    setNetwork: vi.fn(),
    connect: mockConnect,
    disconnect: mockDisconnect,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Navbar mobile menu focus trap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.mockReturnValue(defaultWalletState());
  });

  it("renders the toggle button and the drawer is initially closed", () => {
    render(<Navbar />);
    expect(getMenuButton()).toBeInTheDocument();
    expect(getDrawer()).toBeNull();
  });

  it("opens the drawer when the toggle button is clicked", () => {
    render(<Navbar />);
    openMenu();
    expect(getDrawer()).toBeInTheDocument();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the drawer when the toggle button is clicked again", () => {
    render(<Navbar />);
    openMenu();
    fireEvent.click(getMenuButton());
    expect(getDrawer()).toBeNull();
    expect(getMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the drawer when Escape is pressed", () => {
    render(<Navbar />);
    openMenu();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(getDrawer()).toBeNull();
  });

  it("drawer has aria-modal=true while open", () => {
    render(<Navbar />);
    openMenu();
    const drawer = getDrawer();
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("Tab wraps from last focusable element to first inside the drawer", () => {
    render(<Navbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    expect(focusableEls.length).toBeGreaterThan(1);

    const last = focusableEls[focusableEls.length - 1];
    const first = focusableEls[0];

    act(() => last.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });

    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab wraps from first focusable element to last inside the drawer", () => {
    render(<Navbar />);
    openMenu();

    const drawer = getDrawer()!;
    const focusableEls = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ),
    );

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    act(() => first.focus());
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("focus returns to the trigger button after closing via Escape", () => {
    render(<Navbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.activeElement).toBe(btn);
  });

  it("focus returns to the trigger button after closing via button click", () => {
    render(<Navbar />);
    const btn = getMenuButton();

    openMenu();
    fireEvent.click(btn);

    expect(document.activeElement).toBe(btn);
  });
});

describe("Navbar wallet connect button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWallet.mockReturnValue(defaultWalletState());
  });

  it('shows "Connect Wallet" when disconnected', () => {
    render(<Navbar />);
    const buttons = screen.getAllByRole("button", { name: /connect wallet/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls connect() on click and shows loading state", async () => {
    mockUseWallet.mockReturnValue(defaultWalletState());
    render(<Navbar />);

    const btn = screen.getAllByRole("button", { name: /connect wallet/i })[0];
    fireEvent.click(btn);

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
    expect(btn).toBeDisabled();

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledOnce();
    });
  });

  it("shows formatted address when connected", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletState({ address: ADDRESS, isConnected: true }),
    );
    render(<Navbar />);

    expect(screen.getByText("GAAQ...ABOV")).toBeInTheDocument();
  });

  it("calls disconnect() when clicking connected button", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletState({ address: ADDRESS, isConnected: true }),
    );
    render(<Navbar />);

    const btn = screen.getByRole("button", {
      name: /disconnect/i,
    });
    fireEvent.click(btn);

    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it("shows inline error on connect failure", async () => {
    const connectError = new Error("Wallet rejected");
    mockConnect.mockRejectedValueOnce(connectError);
    mockUseWallet.mockReturnValue(defaultWalletState());
    render(<Navbar />);

    const btn = screen.getAllByRole("button", { name: /connect wallet/i })[0];
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Wallet rejected");
    });
  });

  it("clears error on retry", async () => {
    mockConnect
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(undefined);
    mockUseWallet.mockReturnValue(defaultWalletState());
    render(<Navbar />);

    const btn = screen.getAllByRole("button", { name: /connect wallet/i })[0];
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("First failure");
    });

    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  it("renders connect button in mobile drawer", () => {
    render(<Navbar />);
    openMenu();

    const drawer = getDrawer()!;
    const drawerButtons = drawer.querySelectorAll("button");
    const connectBtn = Array.from(drawerButtons).find(
      (b) =>
        b.textContent?.includes("Connect Wallet") ||
        b.textContent?.includes("Connecting") ||
        b.textContent?.includes("GAAQ"),
    );
    expect(connectBtn).toBeTruthy();
  });

  it("desktop connect button has aria-label for screen readers", () => {
    mockUseWallet.mockReturnValue(
      defaultWalletState({ address: ADDRESS, isConnected: true }),
    );
    render(<Navbar />);

    const btn = screen.getByRole("button", {
      name: /disconnect/i,
    });
    expect(btn).toHaveAttribute(
      "aria-label",
      "Disconnect GAAQ...ABOV",
    );
  });
});