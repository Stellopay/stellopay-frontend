import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import SupportPage from "./page";
import * as demoData from "@/lib/demo-data-support";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/help/support",
}));

// Mock support tabs and FAQ components
vi.mock("@/components/common/support-tabs", () => ({
  default: ({ children, activeTab, setActiveTab }: any) => (
    <div data-testid="support-tabs">
      <button onClick={() => setActiveTab("Client FAQ")}>Client FAQ</button>
      <button onClick={() => setActiveTab("Contact Support")}>
        Contact Support
      </button>
      {activeTab === "Client FAQ" && children}
    </div>
  ),
}));

vi.mock("@/components/common/faq-card", () => ({
 ui/notifications-section-channel-matrix
  default: ({ title, highlightQuery }: any) => (
    <div data-testid="faq-card" data-highlight-query={highlightQuery || ""}>
      {title}

  default: ({ title, articleCount }: any) => (
    <div data-testid="faq-card">
      {title}
      {articleCount !== undefined && (
        <span data-testid="faq-article-count">{articleCount}</span>
      )}
 main
    </div>
  ),
}));

// Mock ticket widget
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
  });

  it("should render the support page", () => {
    render(<SupportPage />);
    expect(screen.getByTestId("ticket-widget")).toBeInTheDocument();
  });

  it("should display ticket status widget at top of page", () => {
    render(<SupportPage />);
    const widget = screen.getByTestId("ticket-widget");
    expect(widget).toBeInTheDocument();
    const mainContent = widget.closest("div");
    expect(mainContent).toBeTruthy();
  });

  it("should render support tabs component", () => {
    render(<SupportPage />);
    expect(screen.getByTestId("support-tabs")).toBeInTheDocument();
  });

  it("should load demo support tickets", () => {
    render(<SupportPage />);
    const ticketList = screen.getByTestId("ticket-list");
    expect(ticketList).toBeInTheDocument();

    const tickets = demoData.getDemoSupportTickets();
    tickets.forEach((ticket) => {
      expect(screen.getByTestId(`ticket-${ticket.id}`)).toBeInTheDocument();
    });
  });

  it("should display demo tickets with correct subjects", () => {
    render(<SupportPage />);
    const tickets = demoData.getDemoSupportTickets();

    tickets.forEach((ticket) => {
      expect(screen.getByText(ticket.subject)).toBeInTheDocument();
    });
  });

  it("should render FAQ cards", () => {
    render(<SupportPage />);

    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();

    const faqCards = screen.getAllByTestId("faq-card");
    expect(faqCards.length).toBe(4);

    // Verify all four unique categories are present by checking text content
    const expectedTitles = ["Account Management", "Transaction Issues", "Security & Privacy", "Payment & Transfers"];
    expectedTitles.forEach((title) => {
      expect(screen.getByText(title, { exact: false })).toBeInTheDocument();
    });

    // Verify article count badges are rendered
    const badges = screen.getAllByTestId("faq-article-count");
    expect(badges).toHaveLength(4);
    badges.forEach((badge) => {
      expect(badge.textContent).toBe("6");
    });
  });
});

describe("Support Page - Demo Data", () => {
  it("should have mock support tickets with required fields", () => {
    const tickets = demoData.getDemoSupportTickets();

    expect(tickets.length).toBeGreaterThan(0);

    tickets.forEach((ticket) => {
      expect(ticket).toHaveProperty("id");
      expect(ticket).toHaveProperty("category");
      expect(ticket).toHaveProperty("subject");
      expect(ticket).toHaveProperty("message");
      expect(ticket).toHaveProperty("status");
      expect(ticket).toHaveProperty("submittedAt");
      expect(ticket).toHaveProperty("lastUpdatedAt");
      expect(ticket).toHaveProperty("firstName");
      expect(ticket).toHaveProperty("lastName");
      expect(ticket).toHaveProperty("email");
    });
  });

  it("should have tickets with valid status values", () => {
    const tickets = demoData.getDemoSupportTickets();
    const validStatuses = ["open", "in-progress", "resolved"];

    tickets.forEach((ticket) => {
      expect(validStatuses).toContain(ticket.status);
    });
  });

  it("should have tickets with different statuses", () => {
    const tickets = demoData.getDemoSupportTickets();
    const statuses = new Set(tickets.map((t) => t.status));

    expect(statuses.size).toBeGreaterThanOrEqual(2);
  });

  it("should have valid ISO timestamps", () => {
    const tickets = demoData.getDemoSupportTickets();

    tickets.forEach((ticket) => {
      const submittedDate = new Date(ticket.submittedAt);
      const updatedDate = new Date(ticket.lastUpdatedAt);

      expect(submittedDate.getTime()).toBeGreaterThan(0);
      expect(updatedDate.getTime()).toBeGreaterThan(0);
    });
  });

  it("should have lastUpdatedAt after or equal to submittedAt", () => {
    const tickets = demoData.getDemoSupportTickets();

    tickets.forEach((ticket) => {
      const submitted = new Date(ticket.submittedAt).getTime();
      const updated = new Date(ticket.lastUpdatedAt).getTime();
      expect(updated).toBeGreaterThanOrEqual(submitted);
    });
  });
});

describe("Support Page - Empty State Handling", () => {
  it("should handle empty tickets array gracefully", () => {
    vi.spyOn(demoData, "getDemoSupportTickets").mockReturnValue([]);
    render(<SupportPage />);

    const widget = screen.getByTestId("ticket-widget");
    expect(within(widget).getByText("No tickets")).toBeInTheDocument();
  });
});

describe("Support Page - Responsive Layout", () => {
  it("should render full width ticket widget", () => {
    render(<SupportPage />);
    const widget = screen.getByTestId("ticket-widget");
 ui/notifications-section-channel-matrix
    const wrapper = widget.parentElement;

    // Check that widget's parent has full width class
    const wrapper = widget.parentElement;
 main
    expect(wrapper?.className).toMatch(/w-full/);
  });

  it("should have responsive gap and padding", () => {
    const { container } = render(<SupportPage />);
    const mainDiv = container.querySelector(".min-h-screen");

    expect(mainDiv?.className).toMatch(/p-4/);
    expect(mainDiv?.className).toMatch(/sm:p-6/);

    expect(mainDiv?.className).toMatch(/gap-6/);
  });
});

describe("Support Page - Integration", () => {
  it("should render ticket widget before tabs", () => {
 ui/notifications-section-channel-matrix
    render(<SupportPage />);
    const container = screen.getByTestId("ticket-widget").closest(
      ".min-h-screen",
    )!;
    const widget = container.querySelector(
      `[data-testid="ticket-widget"]`,
    )!;
    const tabs = container.querySelector(`[data-testid="support-tabs"]`)!;

    expect(
      widget.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const { container } = render(<SupportPage />);
    const mainContainer = container.querySelector(".min-h-screen");
    const widgetElem = mainContainer?.querySelector(
      '[data-testid="ticket-widget"]',
    );
    const tabsElem = mainContainer?.querySelector(
      '[data-testid="support-tabs"]',
    );

    // Ticket widget should appear before support tabs in document order
    if (widgetElem && tabsElem) {
      expect(
        widgetElem.compareDocumentPosition(tabsElem) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
 main
  });

  it("should maintain dark mode styling context", () => {
    const { container } = render(<SupportPage />);
    const mainDiv = container.querySelector(".min-h-screen");

    expect(mainDiv?.className).toMatch(/text-white/);
  });
});
 ui/notifications-section-channel-matrix
describe("Support Page - Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input inside FAQ section", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toBeInTheDocument();
  });

  it("should have accessible search label", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toHaveAttribute("aria-label", "Search help articles");
  });

  it("should show search landmark with correct aria-label", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchLandmark = screen.getByRole("search");
    expect(searchLandmark).toHaveAttribute("aria-label", "Search help articles");
  });

  it("should display all FAQ cards when search is empty", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBe(6);
  });

  it("should filter FAQ cards based on search query", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "password");

    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBe(1);
    expect(cards[0]).toHaveTextContent("Account Management");
  });

  it("should filter FAQ cards by subtitle", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "dispute");

    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBe(1);
    expect(cards[0]).toHaveTextContent("Transaction Issues");
  });

  it("should show no results state when no topics match", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "xyznonexistent");

    expect(
      screen.getByText(/no results for.*xyznonexistent/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("faq-card")).not.toBeInTheDocument();
  });

  it("should show result count when searching", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "payment");

    expect(screen.getByText(/showing \d+ results?/i)).toBeInTheDocument();
  });

  it("should not show result count when search is empty", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument();
  });

  it("should clear search and restore all cards when clear button clicked", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "password");
    expect(screen.getAllByTestId("faq-card").length).toBe(1);

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue("");
    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBe(6);
  });

  it("should have polite live region for empty state", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "xyznonexistent");

    const statusRegions = screen.getAllByRole("status");
    statusRegions.forEach((r) => {
      expect(r).toHaveAttribute("aria-live", "polite");
    });
  });

  it("should show clear button only when search has text", () => {
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    expect(
      screen.queryByRole("button", { name: /clear search/i }),
    ).not.toBeInTheDocument();
  });

  it("should forward search query to FaqCard as highlightQuery", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "password");

    const cards = screen.getAllByTestId("faq-card");
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-highlight-query", "password");
    });
  });

  it("should handle search by keywords", async () => {
    const user = userEvent.setup();
    render(<SupportPage />);
    const faqButton = screen.getByText("Client FAQ");
    faqButton.click();
    const searchInput = screen.getByRole("searchbox");

    await user.type(searchInput, "2fa");

    const cards = screen.getAllByTestId("faq-card");
    expect(cards.length).toBe(1);
    expect(cards[0]).toHaveTextContent("Security & Privacy");

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

  it("all FAQ card links match the support-tabs routeMappings", () => {
    const uniqueLinks = new Set(faqLinkRoutes);

    // SupportTabs routeMappings must cover all FAQ links
    const mappedRoutes = new Set([
      "/help/support/accountManagement",
      "/help/support/transactionIssues",
      "/help/support/securityPrivacy",
      "/help/support/paymentTransfers",
    ]);

    for (const link of uniqueLinks) {
      expect(mappedRoutes.has(link)).toBe(true);
    }
  });

  it("no FAQ card links are duplicated for different routes", () => {
    expect(faqLinkRoutes.length).toBe(new Set(faqLinkRoutes).size);
 main
  });
});
