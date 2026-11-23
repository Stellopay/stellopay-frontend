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
  });
});
