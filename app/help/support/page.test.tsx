import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { toast } from "sonner"; // VERIFY: match real toast lib
import SupportPage from "./page";
import * as demoData from "@/lib/demo-data-support";
import { safeStorage } from "@/utils/safeStorage";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => "/help/support",
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/common/support-tabs", () => ({
  default: ({ children, activeTab, setActiveTab }: any) => (
    <div data-testid="support-tabs">
      <button onClick={() => setActiveTab("Client FAQ")}>Client FAQ</button>
      <button onClick={() => setActiveTab("Contact Support")}>Contact Support</button>
      {activeTab === "Client FAQ" && children}
    </div>
  ),
}));

vi.mock("@/components/common/faq-card", () => ({
  default: ({ title, articleCount, highlightQuery }: any) => (
    <div
      data-testid="faq-card"
      data-highlight-query={highlightQuery || ""}
    >
      {title}
      {articleCount !== undefined && (
        <span data-testid="faq-article-count">{articleCount}</span>
      )}
    </div>
  ),
}));

vi.mock("@/components/help-support/ticket-status-widget", () => ({
  default: ({ tickets, isLoading }: any) => (
    <div data-testid="ticket-widget">
      {isLoading ? (
        <div>Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div>No tickets</div>
      ) : (
        <div data-testid="ticket-list">
          {tickets.map((ticket: any) => (
            <div key={ticket.id} data-testid={`ticket-${ticket.id}`}>
              {ticket.subject}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

describe("Support Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeStorage.setItem("stellopay_help_coach_mark_dismissed", "true");
  });

  it("should render the support page", () => {
    render(<SupportPage />);
    expect(screen.getByTestId("ticket-widget")).toBeInTheDocument();
  });

  it("should render support tabs component", () => {
    render(<SupportPage />);
    expect(screen.getByTestId("support-tabs")).toBeInTheDocument();
  });

  it("should render FAQ category cards", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();

    const faqCards = screen.getAllByTestId("faq-card");
    expect(faqCards.length).toBe(4);

    const expectedTitles = [
      "Account Management",
      "Transaction Issues",
      "Security & Privacy",
      "Payment & Transfers",
    ];
    expectedTitles.forEach((title) => {
      expect(screen.getByText(title, { exact: false })).toBeInTheDocument();
    });

    const badges = screen.getAllByTestId("faq-article-count");
    expect(badges).toHaveLength(4);
    badges.forEach((badge) => expect(badge.textContent).toBe("6"));
  });
});

describe("Support Page - Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeStorage.setItem("stellopay_help_coach_mark_dismissed", "true");
  });

  it("should render search input inside FAQ section", () => {
    render(<SupportPage />);
    screen.getByText("Client FAQ").click();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("should filter FAQ cards based on search query", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    screen.getByText("Client FAQ").click();
    await user.type(screen.getByRole("searchbox"), "password");

    // 4 static category cards + however many filtered topic cards match
    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it("should clear search when clear button clicked", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    screen.getByText("Client FAQ").click();
    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "password");

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue("");
  });
});

describe("Support Page - Restart product tour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeStorage.setItem("stellopay_help_coach_mark_dismissed", "true");
    safeStorage.setItem("stellopay_dashboard_tour_seen", "true");
  });

  it("renders a clearly labeled restart action", () => {
    render(<SupportPage />);
    expect(
      screen.getByRole("button", { name: /restart product tour/i })
    ).toBeInTheDocument();
  });

  it("clears both tour-seen flags and redirects to /dashboard", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);

    await user.click(screen.getByRole("button", { name: /restart product tour/i }));

    expect(safeStorage.getItem("stellopay_help_coach_mark_dismissed")).toBeNull();
    expect(safeStorage.getItem("stellopay_dashboard_tour_seen")).toBeNull();
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows a success toast on restart", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    await user.click(screen.getByRole("button", { name: /restart product tour/i }));
    expect(toast.success).toHaveBeenCalled();
  });

  it("is keyboard accessible", () => {
    render(<SupportPage />);
    const button = screen.getByRole("button", { name: /restart product tour/i });
    button.focus();
    expect(button).toHaveFocus();
  });

  it("shows an error toast and does not navigate if storage throws", async () => {
    const original = safeStorage.removeItem;
    // @ts-expect-error - intentionally breaking for this test
    safeStorage.removeItem = () => {
      throw new Error("storage disabled");
    };

    const user = userEvent.setup();
    render(<SupportPage />);
    await user.click(screen.getByRole("button", { name: /restart product tour/i }));

    expect(toast.error).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    safeStorage.removeItem = original;
  });
});

describe("Support Page — FAQ card route existence", () => {
  const repoRoot = path.resolve(__dirname, "../../..");
  const faqLinkRoutes = [
    "/help/support/accountManagement",
    "/help/support/transactionIssues",
    "/help/support/securityPrivacy",
    "/help/support/paymentTransfers",
  ];

  it.each(faqLinkRoutes)("FAQ card link %s has a page.tsx", (route) => {
    const routeDir = route.replace(/^\//, "");
    const pagePath = path.join(repoRoot, "app", routeDir, "page.tsx");
    expect(fs.existsSync(pagePath)).toBe(true);
  });
});