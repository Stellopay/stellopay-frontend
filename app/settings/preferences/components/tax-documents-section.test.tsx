import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import TaxDocumentsSection, {
  AVAILABLE_TAX_DOCUMENTS,
} from "./tax-documents-section";

describe("TaxDocumentsSection", () => {
  it("renders every available tax document row and the table caption", () => {
    render(<TaxDocumentsSection />);

    const table = screen.getByRole("table", {
      name: "Available statements and tax documents",
    });
    expect(
      within(table).getByText(
        "Documents are generated from completed Stellopay activity.",
      ),
    ).toBeInTheDocument();

    for (const document of AVAILABLE_TAX_DOCUMENTS) {
      const row = within(table).getByRole("row", {
        name: new RegExp(
          `${document.period} ${document.dateRange} ${document.type} ${document.generatedAt}`,
        ),
      });
      expect(
        within(row).getByRole("link", {
          name: `Download ${document.period} ${document.type}`,
        }),
      ).toHaveAttribute("href", document.downloadUrl);
    }
  });

  it("does not render a download link for processing documents", () => {
    const processingDocument = {
      ...AVAILABLE_TAX_DOCUMENTS[0],
      id: "stmt-processing",
      status: "Processing" as const,
    };
    render(<TaxDocumentsSection statements={[processingDocument]} />);

    const row = screen.getByRole("row", {
      name: new RegExp(
        `${processingDocument.period} ${processingDocument.dateRange} ${processingDocument.type} ${processingDocument.generatedAt} Processing`,
      ),
    });
    expect(
      within(row).queryByRole("link", { name: /download/i }),
    ).not.toBeInTheDocument();
    expect(within(row).getByText("Processing")).toBeInTheDocument();
  });

  it("passes axe accessibility audit on the default render", async () => {
    const { container } = render(<TaxDocumentsSection />);
    expect((await axe(container)).violations).toHaveLength(0);
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TaxDocumentsSection, {
  AVAILABLE_TAX_DOCUMENTS,
} from "./tax-documents-section";
import type { Transaction } from "@/types/transaction";
import * as taxReportModule from "@/utils/taxReport";

// Mock useTransactions hook so we have full control over test environments
vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "Payment Received",
    txId: "#TXNT2345",
    address: "0xA1B2...C3D4E5",
    date: "2026-05-12",
    time: "09:32AM",
    token: "USDC",
    amount: 500,
    status: "Completed",
    statusColor: "success",
  },
  {
    id: "tx-2",
    type: "Payment Sent",
    txId: "#TXNT2346",
    address: "0xA1B2...C3D4E5",
    date: "2025-11-05",
    time: "10:15AM",
    token: "XLM",
    amount: -150,
    status: "Completed",
    statusColor: "success",
  },
];

describe("TaxDocumentsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not ship any data:text/plain placeholder URLs in AVAILABLE_TAX_DOCUMENTS", () => {
    expect(AVAILABLE_TAX_DOCUMENTS).toEqual([]);
    for (const doc of AVAILABLE_TAX_DOCUMENTS) {
      expect(doc.downloadUrl).not.toContain("data:text/plain");
    }
  });

  it("renders empty state when there are no transactions", () => {
    render(<TaxDocumentsSection transactions={[]} timezone="UTC" />);

    expect(screen.getByText("No statements available yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Statements appear here after completed payment activity is ready for monthly, quarterly, or annual reporting.",
      ),
    ).toBeInTheDocument();
  });

  it("renders loading state when isLoading is true", () => {
    render(<TaxDocumentsSection isLoading={true} timezone="UTC" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading activity records...")).toBeInTheDocument();
  });

  it("renders error state and invokes retry callback", () => {
    const handleRetry = vi.fn();
    render(
      <TaxDocumentsSection
        error="Failed to load transaction activity"
        onRetry={handleRetry}
        timezone="UTC"
      />,
    );

    expect(
      screen.getByText("Failed to load transaction activity"),
    ).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("displays the visible informational disclaimer banner", () => {
    render(
      <TaxDocumentsSection transactions={mockTransactions} timezone="UTC" />,
    );

    const notice = screen.getByRole("note", {
      name: /informational tax disclaimer/i,
    });
    expect(notice).toBeInTheDocument();
    expect(
      screen.getByText(/do not constitute official tax or financial advice/i),
    ).toBeInTheDocument();
  });

  it("derives and renders statements for active years and quarters", () => {
    render(
      <TaxDocumentsSection transactions={mockTransactions} timezone="UTC" />,
    );

    // Active years & quarters: 2026 Q2, 2025 Q4
    expect(screen.getByText("Tax year 2026")).toBeInTheDocument();
    expect(screen.getByText("Q2 2026")).toBeInTheDocument();
    expect(screen.getByText("Tax year 2025")).toBeInTheDocument();
    expect(screen.getByText("Q4 2025")).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText("Period")).toBeInTheDocument();
    expect(screen.getByText("Date range")).toBeInTheDocument();
    expect(screen.getByText("Document type")).toBeInTheDocument();
    expect(screen.getByText("Downloads")).toBeInTheDocument();
  });

  it("handles CSV download on click", () => {
    const triggerSpy = vi
      .spyOn(taxReportModule, "triggerBlobDownload")
      .mockImplementation(() => {});

    render(
      <TaxDocumentsSection transactions={mockTransactions} timezone="UTC" />,
    );

    const csvButtons = screen.getAllByRole("button", {
      name: /download .* csv/i,
    });
    expect(csvButtons.length).toBeGreaterThan(0);

    fireEvent.click(csvButtons[0]);
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy.mock.calls[0][1]).toMatch(/\.csv$/);

    triggerSpy.mockRestore();
  });

  it("handles PDF download on click with dynamically imported jsPDF", async () => {
    const triggerSpy = vi
      .spyOn(taxReportModule, "triggerBlobDownload")
      .mockImplementation(() => {});

    render(
      <TaxDocumentsSection transactions={mockTransactions} timezone="UTC" />,
    );

    const pdfButtons = screen.getAllByRole("button", {
      name: /download .* pdf/i,
    });
    expect(pdfButtons.length).toBeGreaterThan(0);

    fireEvent.click(pdfButtons[0]);

    await waitFor(() => {
      expect(triggerSpy).toHaveBeenCalledTimes(1);
      expect(triggerSpy.mock.calls[0][1]).toMatch(/\.pdf$/);
    });

    triggerSpy.mockRestore();
  });
});
