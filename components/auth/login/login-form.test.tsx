import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "./login-form";
import { login, AuthError } from "@/lib/api/auth";

// Mock the auth api adapter
vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

// Mock ResizeObserver which is needed by Radix UI
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the form with provided values and calls login adapter (rememberMe: true)", async () => {
    const mockLogin = vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const rememberMeCheckbox = screen.getByRole("checkbox", { name: /Remember me/i });
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "Password123!");
    await userEvent.click(rememberMeCheckbox);

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
        rememberMe: true,
      });
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("submits the form with provided values and calls login adapter (rememberMe: false)", async () => {
    const mockLogin = vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "Password123!");
    // Do not click remember me

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
        rememberMe: false,
      });
    });
  });

  it("shows an error message when login adapter throws AuthError (failure)", async () => {
    const errorMessage = "Invalid email or password. Please try again.";
    vi.mocked(login).mockRejectedValue(new AuthError(errorMessage));
    
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(emailInput, "wrong@example.com");
    await userEvent.type(passwordInput, "WrongPassword1!");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
    });
  });

  it("shows a generic error message when an unexpected network error occurs", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Network Error"));
    
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(emailInput, "wrong@example.com");
    await userEvent.type(passwordInput, "WrongPassword1!");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password. Please try again.");
    });
  });

  it("secures credentials by not logging them and retaining autoComplete properties", () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    expect(emailInput).toHaveAttribute("autoComplete", "email");
    expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
  });
});
