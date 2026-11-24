import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BatchPayrollPage from "./page";
import * as paymentsApi from "@/lib/api/payments";
import * as csvUtils from "@/utils/csvUtils";

const VALID_ADDR_1 = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const VALID_ADDR_2 = "GAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHV4";

describe("app/payments/batch/page.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the batch payroll page header and upload zone", () => {
    render(<BatchPayrollPage />);

    expect(screen.getByText(/Batch Payroll Payments/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop your payroll CSV here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download Template/i })).toBeInTheDocument();
  });

  it("triggers template download when Download Template button is clicked", async () => {
    const downloadSpy = vi.spyOn(csvUtils, "downloadCsvContent").mockImplementation(() => {});
    const user = userEvent.setup();

    render(<BatchPayrollPage />);
    const templateBtn = screen.getByRole("button", { name: /Download Template/i });
    await user.click(templateBtn);

    expect(downloadSpy).toHaveBeenCalledWith(
      "stellopay-batch-template.csv",
      expect.stringContaining("address,amount,asset,memo"),
    );
  });

  it("shows an error when an empty or invalid file is uploaded", async () => {
    render(<BatchPayrollPage />);

    const emptyFile = new File([""], "empty.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [emptyFile] } });

    await waitFor(() => {
      expect(screen.getByText(/The file is empty/i)).toBeInTheDocument();
    });
  });

  it("parses valid CSV and renders row table and summary stats", async () => {
    render(<BatchPayrollPage />);

    const validCsv = [
      "address,amount,asset,memo",
      `${VALID_ADDR_1},500.5,USDC,Jan Payroll`,
      `${VALID_ADDR_2},250.0,USDC,Bonus`,
    ].join("\n");

    const file = new File([validCsv], "payroll.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Total Rows/i)).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Check table headers and rows
    expect(screen.getByText(/Row-by-Row Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Batch \(2 payments\)/i)).toBeInTheDocument();
  });

  it("submits valid batch payments successfully", async () => {
    const submitSpy = vi.spyOn(paymentsApi, "submitBatch").mockResolvedValue({
      success: true,
      batchId: "batch_12345",
      totalPayments: 1,
      submittedAt: new Date().toISOString(),
      message: "Batch batch_12345 with 1 payments queued successfully.",
    });

    render(<BatchPayrollPage />);

    const validCsv = [
      "address,amount,asset,memo",
      `${VALID_ADDR_1},100,USDC,Payroll`,
    ].join("\n");

    const file = new File([validCsv], "payroll.csv", { type: "text/csv" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Submit Batch/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Batch/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Batch Successfully Queued!/i)).toBeInTheDocument();
    });

    expect(submitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          {
            address: VALID_ADDR_1,
            amount: "100",
            asset: "USDC",
            memo: "Payroll",
          },
        ],
      }),
    );
  });
});
