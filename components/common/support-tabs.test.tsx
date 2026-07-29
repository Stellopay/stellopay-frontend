import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import SupportTabs from "@/components/common/support-tabs";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("SupportTabs Component - Real-time Validation", () => {
  beforeEach(() => {
    (usePathname as any).mockReturnValue("/help/support");
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders both tabs: Client FAQ and Contact Support", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      expect(screen.getByRole("button", { name: /Client FAQ/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Contact Support/i })).toBeInTheDocument();
    });

    it("displays Contact Support form when tab is active", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/We would like to hear from you/i)).toBeInTheDocument();
    });

    it("displays contact info on Contact Support tab", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      expect(screen.getByText(/support@stellopay.com/i)).toBeInTheDocument();
      expect(screen.getByText(/\+234 800 123 4567/i)).toBeInTheDocument();
    });
  });

  describe("Real-time Validation - onBlur", () => {
    it("shows error for first name when blur with empty value", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya");
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for last name when blur with empty value", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const lastNameInput = screen.getByPlaceholderText("Sullivan");
      fireEvent.blur(lastNameInput);

      await waitFor(() => {
        expect(screen.getByText(/Last name is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for email when blur with empty value", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const emailInput = screen.getByPlaceholderText("example@email.com");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for invalid email format on blur", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const emailInput = screen.getByPlaceholderText("example@email.com") as HTMLInputElement;
      await userEvent.type(emailInput, "invalid-email");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("shows error for textarea when blur with too short message", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const textareaInput = screen.getByPlaceholderText("Describe your issue in detail");
      await userEvent.type(textareaInput, "short");
      fireEvent.blur(textareaInput);

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it("shows error for first name exceeding max length", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      const longName = "a".repeat(51);
      await userEvent.type(firstNameInput, longName);
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText(/First name cannot exceed 50 characters/i)).toBeInTheDocument();
      });
    });

    it("clears error when valid value is entered on blur", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      // First trigger error
      fireEvent.blur(firstNameInput);
      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      });

      // Now enter valid value and blur again
      await userEvent.type(firstNameInput, "John");
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.queryByText(/First name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Clearing - onChange", () => {
    it("clears error when user starts typing in first name field", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      // Trigger error
      fireEvent.blur(firstNameInput);
      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      });

      // Start typing - error should clear
      await userEvent.type(firstNameInput, "J");

      await waitFor(() => {
        expect(screen.queryByText(/First name is required/i)).not.toBeInTheDocument();
      });
    });

    it("clears error when user starts typing in email field", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const emailInput = screen.getByPlaceholderText("example@email.com") as HTMLInputElement;
      await userEvent.type(emailInput, "invalid");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });

      // Clear and start typing again
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, "test@");

      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it("clears error when user starts typing in textarea field", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const textareaInput = screen.getByPlaceholderText(
        "Describe your issue in detail",
      ) as HTMLTextAreaElement;
      await userEvent.type(textareaInput, "short");
      fireEvent.blur(textareaInput);

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
      });

      // Continue typing
      await userEvent.type(textareaInput, " continued message");

      await waitFor(() => {
        expect(screen.queryByText(/Message must be at least 10 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility - aria-describedby and aria-invalid", () => {
    it("links error messages to inputs via aria-describedby", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        const errorElement = screen.getByText(/First name is required/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute("role", "alert");

        // Check aria-describedby references the error
        const describedByValue = firstNameInput.getAttribute("aria-describedby");
        expect(describedByValue).toContain(errorElement.id);
      });
    });

    it("sets aria-invalid to true when field has error", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const emailInput = screen.getByPlaceholderText("example@email.com") as HTMLInputElement;
      await userEvent.type(emailInput, "invalid-email");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("sets aria-invalid to false when error is cleared", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(firstNameInput).toHaveAttribute("aria-invalid", "true");
      });

      await userEvent.type(firstNameInput, "John");

      await waitFor(() => {
        expect(firstNameInput).toHaveAttribute("aria-invalid", "false");
      });
    });

    it("error messages have role=alert and aria-live=polite", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya");
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        const errorElement = screen.getByText(/First name is required/i);
        expect(errorElement).toHaveAttribute("role", "alert");
        expect(errorElement).toHaveAttribute("aria-live", "polite");
      });
    });

    it("form has status live region for submission feedback", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Submit Button State", () => {
    it("disables submit button when form is empty", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const submitButton = screen.getByRole("button", { name: /Send Message/i });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when all fields are filled", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      const lastNameInput = screen.getByPlaceholderText("Sullivan") as HTMLInputElement;
      const emailInput = screen.getByPlaceholderText("example@email.com") as HTMLInputElement;
      const textareaInput = screen.getByPlaceholderText(
        "Describe your issue in detail",
      ) as HTMLTextAreaElement;

      await userEvent.type(firstNameInput, "John");
      await userEvent.type(lastNameInput, "Doe");
      await userEvent.type(emailInput, "john@example.com");
      await userEvent.type(textareaInput, "This is a test message");

      const submitButton = screen.getByRole("button", { name: /Send Message/i });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Form Submission and Validation", () => {
    it("prevents submit when validation fails", async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const submitButton = screen.getByRole("button", { name: /Send Message/i });
      fireEvent.click(submitButton);

      // Fetch should not be called when validation fails
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles whitespace-only input as invalid", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      await userEvent.type(firstNameInput, "   ");
      fireEvent.blur(firstNameInput);

      await waitFor(() => {
        expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
      });
    });

    it("accepts valid email with special characters", async () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const emailInput = screen.getByPlaceholderText("example@email.com") as HTMLInputElement;
      await userEvent.type(emailInput, "john.doe+test@example.co.uk");
      fireEvent.blur(emailInput);

      await waitFor(() => {
        // Should not show error
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("WCAG 2.1 AA Compliance", () => {
    it("form labels are associated with inputs", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      const firstNameInput = screen.getByPlaceholderText("Maya") as HTMLInputElement;
      const firstNameLabel = screen.getByLabelText(/First Name/i);
      expect(firstNameLabel).toBeInTheDocument();
    });

    it("submit button text is descriptive", () => {
      render(
        <SupportTabs activeTab="Contact Support" setActiveTab={vi.fn()}>
          <div>FAQ Content</div>
        </SupportTabs>,
      );

      expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument();
    });
  });
});
