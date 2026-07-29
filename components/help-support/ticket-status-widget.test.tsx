import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import TicketStatusWidget from "./ticket-status-widget";
import { SupportTicket } from "@/types/support";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Clock: ({ className }: any) => <div data-testid="icon-clock" className={className} />,
  AlertCircle: ({ className }: any) => <div data-testid="icon-alert" className={className} />,
  CheckCircle2: ({ className }: any) => <div data-testid="icon-check" className={className} />,
  Zap: ({ className }: any) => <div data-testid="icon-zap" className={className} />,
}));

// Mock UI components
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2 data-testid="card-title">{children}</h2>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

vi.mock("@/utils/commonUtils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

const mockTickets: SupportTicket[] = [
  {
    id: "TKT-001",
    category: "Payment & Transfers",
    subject: "Transfer failed with error code 502",
    message: "Test message 1",
    status: "resolved",
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  },
  {
    id: "TKT-002",
    category: "Account Management",
    subject: "Unable to update profile picture",
    message: "Test message 2",
    status: "in-progress",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  },
  {
    id: "TKT-003",
    category: "Security & Privacy",
    subject: "Suspicious login attempt",
    message: "Test message 3",
    status: "open",
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  },
];

describe("TicketStatusWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render card component", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("should display widget title", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByText("Your Support Tickets")).toBeInTheDocument();
    });

    it("should display ticket count in description", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByText(/3 submitted support requests/)).toBeInTheDocument();
    });

    it("should render ticket list with correct role", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      const list = screen.getByRole("list", { name: /Support tickets list/ });
      expect(list).toBeInTheDocument();
    });
  });

  describe("Ticket Display", () => {
    it("should render all tickets", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      mockTickets.forEach((ticket) => {
        expect(screen.getByText(ticket.subject)).toBeInTheDocument();
      });
    });

    it("should display ticket ID for each ticket", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      mockTickets.forEach((ticket) => {
        expect(screen.getByText(ticket.id)).toBeInTheDocument();
      });
    });

    it("should display category badge for each ticket", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      mockTickets.forEach((ticket) => {
        expect(screen.getByText(ticket.category)).toBeInTheDocument();
      });
    });

    it("should render tickets as list items", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockTickets.length);
    });
  });

  describe("Status Badges", () => {
    it("should display correct status for each ticket", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      expect(screen.getByText(/Resolved/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress/)).toBeInTheDocument();
      expect(screen.getByText(/Open/)).toBeInTheDocument();
    });

    it("should have status aria-labels", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      expect(screen.getByLabelText(/Status: resolved/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status: in progress/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status: open/)).toBeInTheDocument();
    });

    it("should display status legend", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByText("Status Legend")).toBeInTheDocument();
    });

    it("should explain all status types in legend", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByText("Awaiting response")).toBeInTheDocument();
      expect(screen.getByText("Being worked on")).toBeInTheDocument();
      expect(screen.getByText("Issue closed")).toBeInTheDocument();
    });
  });

  describe("Timestamps", () => {
    it("should display timestamps for each ticket", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      // Should have clock icons (one per ticket + one in legend context)
      const clockIcons = screen.getAllByTestId("icon-clock");
      expect(clockIcons.length).toBeGreaterThanOrEqual(mockTickets.length);
    });

    it("should display time elements with dateTime attribute", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      mockTickets.forEach((ticket) => {
        const timeElements = screen.getAllByText((content, element) => {
          return element?.tagName.toLowerCase() === "time";
        });
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no tickets", () => {
      render(<TicketStatusWidget tickets={[]} />);
      expect(screen.getByText("No support tickets yet")).toBeInTheDocument();
    });

    it("should display helpful message in empty state", () => {
      render(<TicketStatusWidget tickets={[]} />);
      expect(
        screen.getByText(
          /When you submit a support request using the Contact Support form/,
        ),
      ).toBeInTheDocument();
    });

    it("should show alert icon in empty state", () => {
      render(<TicketStatusWidget tickets={[]} />);
      expect(screen.getByTestId("icon-alert")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading message when isLoading is true", () => {
      render(<TicketStatusWidget tickets={mockTickets} isLoading={true} />);
      expect(screen.getByText("Loading your submitted tickets...")).toBeInTheDocument();
    });

    it("should show loading skeleton placeholders", () => {
      render(<TicketStatusWidget tickets={mockTickets} isLoading={true} />);

      // Should have animated placeholder elements
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should not display tickets while loading", () => {
      render(<TicketStatusWidget tickets={mockTickets} isLoading={true} />);

      mockTickets.forEach((ticket) => {
        expect(screen.queryByText(ticket.subject)).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      const title = screen.getByTestId("card-title");
      expect(title.tagName).toBe("H2");
    });

    it("should have descriptive aria-labels", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByRole("list", { name: /Support tickets list/ })).toBeInTheDocument();
    });

    it("should have semantic HTML structure", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      const list = screen.getByRole("list");
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(mockTickets.length);
    });

    it("should have time elements with dateTime attributes", () => {
      const { container } = render(<TicketStatusWidget tickets={mockTickets} />);
      const timeElements = container.querySelectorAll("time");
      expect(timeElements.length).toBeGreaterThan(0);

      timeElements.forEach((element) => {
        expect(element.getAttribute("dateTime")).toBeTruthy();
      });
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive flex layout on tickets", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      // Check that responsive classes are applied
      const ticketRows = screen.getAllByRole("listitem");
      ticketRows.forEach((row) => {
        expect(row.className).toMatch(/flex/);
        expect(row.className).toMatch(/flex-col/);
        expect(row.className).toMatch(/sm:flex-row/);
      });
    });

    it("should apply responsive gap classes", () => {
      const { container } = render(<TicketStatusWidget tickets={mockTickets} />);

      const listContainer = container.querySelector('[role="list"]');
      expect(listContainer?.className).toMatch(/space-y-3/);
    });

    it("should have responsive status badge layout", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);

      // Status badges should be inline-flex with responsive styling
      const statusElements = screen.getAllByLabelText(/Status:/);
      statusElements.forEach((element) => {
        expect(element.className).toMatch(/inline-flex/);
      });
    });
  });

  describe("Dark Mode Support", () => {
    it("should have dark mode classes", () => {
      const { container } = render(<TicketStatusWidget tickets={mockTickets} />);

      // Check for dark: prefixed Tailwind classes
      const elements = container.querySelectorAll("[class*='dark:']");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should apply dark border and background", () => {
      const { container } = render(<TicketStatusWidget tickets={mockTickets} />);

      const ticketRows = container.querySelectorAll('[role="listitem"]');
      ticketRows.forEach((row) => {
        expect(row.className).toMatch(/dark:border-white/);
        expect(row.className).toMatch(/dark:bg-white/);
      });
    });
  });

  describe("Ticket Subjects with Long Text", () => {
    it("should truncate long ticket subjects", () => {
      const longSubjectTicket: SupportTicket = {
        ...mockTickets[0],
        subject:
          "This is a very long ticket subject that should be truncated to prevent layout breaking and ensure consistent ticket row heights across the widget",
      };

      render(<TicketStatusWidget tickets={[longSubjectTicket]} />);

      const subjectElement = screen.getByText(longSubjectTicket.subject);
      expect(subjectElement.className).toMatch(/line-clamp-2/);
    });
  });

  describe("Singular vs Plural", () => {
    it("should use singular 'request' for one ticket", () => {
      render(<TicketStatusWidget tickets={[mockTickets[0]]} />);
      expect(screen.getByText(/1 submitted support request/)).toBeInTheDocument();
    });

    it("should use plural 'requests' for multiple tickets", () => {
      render(<TicketStatusWidget tickets={mockTickets} />);
      expect(screen.getByText(/3 submitted support requests/)).toBeInTheDocument();
    });
  });
});
