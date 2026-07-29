import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import QuickTransfer, { type QuickTransferProps } from "./quick-transfer";

const DEFAULT_RECIPIENTS: QuickTransferProps["recentRecipients"] = [
  {
    address: "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    label: "Vendor A",
  },
  {
    address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ2345678901234567890",
    label: "Contractor B",
  },
];

function renderDefault(props?: Partial<QuickTransferProps>) {
  return render(
    <QuickTransfer
      recentRecipients={DEFAULT_RECIPIENTS}
      token="XLM"
      {...props}
    />,
  );
}

describe("QuickTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof HTMLElement.prototype.scrollIntoView !== "function") {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  it("renders the heading and form fields", () => {
    renderDefault();
    expect(screen.getByText("Quick Transfer")).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount \(XLM\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Review Transfer/i })).toBeInTheDocument();
  });

  it("shows recent recipients when the recipient input is focused", async () => {
    renderDefault();
    const recipientInput = screen.getByLabelText(/Recipient/i);
    await userEvent.click(recipientInput);

    expect(screen.getByRole("listbox", { name: /Recent recipients/i })).toBeInTheDocument();
    expect(screen.getByText("Vendor A")).toBeInTheDocument();
    expect(screen.getByText("Contractor B")).toBeInTheDocument();
  });

  it("filters suggestions as the user types", async () => {
    renderDefault();
    const recipientInput = screen.getByLabelText(/Recipient/i);
    await userEvent.click(recipientInput);
    await userEvent.type(recipientInput, "Vendor");

    expect(screen.getByText("Vendor A")).toBeInTheDocument();
    expect(screen.queryByText("Contractor B")).not.toBeInTheDocument();
  });

  it("fills the input when a suggestion is selected", async () => {
    renderDefault();
    const recipientInput = screen.getByLabelText(/Recipient/i);
    await userEvent.click(recipientInput);
    await userEvent.click(screen.getByText("Vendor A"));

    expect(recipientInput).toHaveValue(
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
  });

  it("validates invalid Stellar addresses on blur", async () => {
    renderDefault();
    const recipientInput = screen.getByLabelText(/Recipient/i);
    await userEvent.type(recipientInput, "INVALID_ADDRESS");
    await userEvent.tab();

    expect(
      screen.getByText(
        /Enter a valid Stellar address \(public G\.\.\. or muxed M\.\.\.\)/,
      ),
    ).toBeInTheDocument();
  });

  it("disables the submit button when the form is invalid", async () => {
    renderDefault();
    const submitButton = screen.getByRole("button", {
      name: /Review Transfer/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables the submit button when both fields are valid", async () => {
    renderDefault();
    const recipientInput = screen.getByLabelText(/Recipient/i);
    const amountInput = screen.getByLabelText(/Amount \(XLM\)/);

    await userEvent.type(
      recipientInput,
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
    await userEvent.type(amountInput, "100");

    const submitButton = screen.getByRole("button", {
      name: /Review Transfer/i,
    });
    expect(submitButton).not.toBeDisabled();
  });

  it("opens the confirmation dialog with form details", async () => {
    const onSend = vi.fn();
    renderDefault({ onSend });

    const recipientInput = screen.getByLabelText(/Recipient/i);
    const amountInput = screen.getByLabelText(/Amount \(XLM\)/);

    await userEvent.type(
      recipientInput,
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
    await userEvent.type(amountInput, "50.5");
    await userEvent.click(
      screen.getByRole("button", { name: /Review Transfer/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /Confirm Transfer/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("50.5 XLM")).toBeInTheDocument();
  });

  it("calls onSend when Confirms from the dialog", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    renderDefault({ onSend });

    const recipientInput = screen.getByLabelText(/Recipient/i);
    const amountInput = screen.getByLabelText(/Amount \(XLM\)/);

    await userEvent.type(
      recipientInput,
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
    await userEvent.type(amountInput, "25");

    await userEvent.click(
      screen.getByRole("button", { name: /Review Transfer/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Confirm & Send/i }));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith({
      recipient: "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
      amount: "25",
    });
  });

  it("closes the dialog without sending when Cancel is clicked", async () => {
    const onSend = vi.fn();
    renderDefault({ onSend });

    const recipientInput = screen.getByLabelText(/Recipient/i);
    const amountInput = screen.getByLabelText(/Amount \(XLM\)/);

    await userEvent.type(
      recipientInput,
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
    await userEvent.type(amountInput, "10");

    await userEvent.click(
      screen.getByRole("button", { name: /Review Transfer/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByRole("dialog", { name: /Confirm Transfer/i })).not.toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("surfaces and clears errors when onSend throws", async () => {
    const onSend = vi.fn().mockRejectedValue(new Error("Network error"));
    renderDefault({ onSend });

    const recipientInput = screen.getByLabelText(/Recipient/i);
    const amountInput = screen.getByLabelText(/Amount \(XLM\)/);

    await userEvent.type(
      recipientInput,
      "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
    );
    await userEvent.type(amountInput, "10");

    await userEvent.click(
      screen.getByRole("button", { name: /Review Transfer/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Confirm & Send/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });

  describe("keyboard navigation", () => {
    it("navigates through suggestions with arrow keys", async () => {
      renderDefault();
      const recipientInput = screen.getByLabelText(/Recipient/i);
      await userEvent.click(recipientInput);
      fireEvent.keyDown(recipientInput, { key: "ArrowDown" });
      fireEvent.keyDown(recipientInput, { key: "Enter" });

      expect(recipientInput).toHaveValue(
        "GAAQEAYEAUDAOCAJBIFQYDIOB4IBCEQTCQKRMFYYDENBWHA5DYPSABOV",
      );
    });

    it("closes suggestions on Escape", async () => {
      renderDefault();
      const recipientInput = screen.getByLabelText(/Recipient/i);
      await userEvent.click(recipientInput);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      fireEvent.keyDown(recipientInput, { key: "Escape" });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  describe("empty and invalid states", () => {
    it("renders with an empty recipients list without crashing", () => {
      renderDefault({ recentRecipients: [] });
      expect(screen.getByText("Quick Transfer")).toBeInTheDocument();
    });

    it("rejects negative amounts", async () => {
      renderDefault();
      const amountInput = screen.getByLabelText(/Amount \(XLM\)/);
      await userEvent.type(amountInput, "-10");
      await userEvent.tab();

      expect(screen.getByText(/Amount must be greater than zero/)).toBeInTheDocument();
    });

    it("rejects amounts with too many decimal places", async () => {
      renderDefault();
      const amountInput = screen.getByLabelText(/Amount \(XLM\)/);
      await userEvent.type(amountInput, "10.12345678");
      await userEvent.tab();

      expect(
        screen.getByText(/Amount can have up to 7 decimal places/),
      ).toBeInTheDocument();
    });
  });
});
