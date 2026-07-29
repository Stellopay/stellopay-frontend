import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignUpForm } from "./sign-up-form";

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
});
