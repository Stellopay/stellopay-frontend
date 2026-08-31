import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignUpForm } from "./sign-up-form";
import { SignUpEmailModal } from "./sign-up-email-modal";

// Mock ResizeObserver for Radix UI dialog / components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields with correct autoComplete and inputMode attributes", () => {
    render(<SignUpForm />);

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);

    expect(nameInput).toHaveAttribute("autoComplete", "name");
    expect(emailInput).toHaveAttribute("autoComplete", "email");
    expect(emailInput).toHaveAttribute("inputMode", "email");
    expect(passwordInput).toHaveAttribute("autoComplete", "new-password");
    expect(confirmPasswordInput).toHaveAttribute("autoComplete", "new-password");
  });

  it("password inputs default to type=password for security", () => {
    render(<SignUpForm />);

    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("shows password requirements checklist and strength meter when typing password", async () => {
    render(<SignUpForm />);

    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    await userEvent.type(passwordInput, "ValidPass123!");

    expect(screen.getByRole("region", { name: /Password requirements/i })).toBeInTheDocument();
    expect(screen.getByText(/Password is strong and secure/i)).toBeInTheDocument();
  });

  it("opens confirmation modal upon valid form submission", async () => {
    render(<SignUpForm />);

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const termsCheckbox = screen.getByRole("checkbox");
    const submitButton = screen.getByRole("button", { name: /Create Account/i });

    await userEvent.type(nameInput, "Jane Doe");
    await userEvent.type(emailInput, "jane@example.com");
    await userEvent.type(passwordInput, "StrongPass123!");
    await userEvent.type(confirmPasswordInput, "StrongPass123!");
    await userEvent.click(termsCheckbox);

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Check your email/i)).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });

  describe("focus-return-to-trigger", () => {
    /**
     * The form enforces a 3-second minimum submission time as an
     * anti-bot measure which makes form-submission-based tests
     * impractical with default userEvent timing. We test the focus-
     * return behavior directly on the SignUpEmailModal component:
     * the focus restoration logic lives inside the modal itself,
     * which captures document.activeElement before opening and
     * restores it on every close path.
     */

    function renderModal(isOpen: boolean) {
      return render(
        <SignUpEmailModal
          isOpen={isOpen}
          onClose={vi.fn()}
          onContinue={vi.fn()}
          onGoBack={vi.fn()}
          email="test@example.com"
        />,
      );
    }

    function renderModalInContainer(isOpen: boolean) {
      return render(
        <div>
          <button type="button" data-testid="trigger-btn">
            Open Modal
          </button>
          <SignUpEmailModal
            isOpen={isOpen}
            onClose={vi.fn()}
            onContinue={vi.fn()}
            onGoBack={vi.fn()}
            email="test@example.com"
          />
        </div>,
      );
    }

    it("restores focus to the previously focused element when modal closes via onClose", async () => {
      const { rerender } = renderModalInContainer(false);

      const triggerBtn = screen.getByTestId("trigger-btn");
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open the modal
      rerender(
        <div>
          <button type="button" data-testid="trigger-btn">
            Open Modal
          </button>
          <SignUpEmailModal
            isOpen={true}
            onClose={vi.fn()}
            onContinue={vi.fn()}
            onGoBack={vi.fn()}
            email="test@example.com"
          />
        </div>,
      );

      // Close the modal
      rerender(
        <div>
          <button type="button" data-testid="trigger-btn">
            Open Modal
          </button>
          <SignUpEmailModal
            isOpen={false}
            onClose={vi.fn()}
            onContinue={vi.fn()}
            onGoBack={vi.fn()}
            email="test@example.com"
          />
        </div>,
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(triggerBtn);
      });
    });

    it("does not throw when no element was focused before modal opened", () => {
      // Render modal open, close it — should not crash
      const { rerender } = renderModal(true);

      expect(() => {
        rerender(<SignUpEmailModal
          isOpen={false}
          onClose={vi.fn()}
          onContinue={vi.fn()}
          onGoBack={vi.fn()}
          email="test@example.com"
        />);
      }).not.toThrow();
    });
  });
});
