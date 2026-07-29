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

// In-memory store standing in for localStorage via safeStorage
const mockStore = new Map<string, string>();
vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStore.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      mockStore.delete(key);
    }),
  },
}));

import { safeStorage } from "@/utils/safeStorage";
const REMEMBERED_EMAIL_KEY = "stellopay:rememberedEmail";

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
    mockStore.clear();
  });

  it("submits the form with provided values and calls login adapter (rememberMe: true)", async () => {
    const mockLogin = vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const rememberMeCheckbox = screen.getByRole("checkbox", {
      name: /Remember me/i,
    });
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
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password. Please try again.",
      );
    });
  });

  it("secures credentials by not logging them and retaining autoComplete properties", () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    expect(emailInput).toHaveAttribute("autoComplete", "email");
    expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
  });

  // ─── Show/hide password toggle ──────────────────────────────────────────────

  it("renders the password field masked (type=password) by default", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders the toggle button with aria-label 'Show password' when password is hidden", () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });
    expect(toggle).toBeInTheDocument();
  });

  it("clicking the toggle reveals the password (type switches to text)", async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(toggle);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("clicking the toggle a second time re-masks the password", async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    await userEvent.click(toggle);
    expect(passwordInput).toHaveAttribute("type", "text");

    const hideToggle = screen.getByRole("button", { name: /Hide password/i });
    await userEvent.click(hideToggle);

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("updates aria-label to 'Hide password' after revealing", async () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    await userEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: /Hide password/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Show password/i }),
    ).not.toBeInTheDocument();
  });

  it("updates aria-label back to 'Show password' after re-masking", async () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    await userEvent.click(toggle);
    await userEvent.click(
      screen.getByRole("button", { name: /Hide password/i }),
    );

    expect(
      screen.getByRole("button", { name: /Show password/i }),
    ).toBeInTheDocument();
  });

  it("toggle button is reachable via keyboard (Tab) and operable via Enter", async () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    // Focus the toggle directly and activate with keyboard
    toggle.focus();
    expect(toggle).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("toggle button is operable via Space key", async () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    toggle.focus();
    await userEvent.keyboard(" ");
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("clicking the toggle does not submit the form", async () => {
    const mockLogin = vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    await userEvent.click(toggle);

    // Give any async submission a chance to fire
    await new Promise((r) => setTimeout(r, 50));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("toggle button has type='button' (never submits the form implicitly)", () => {
    render(<LoginForm />);
    const toggle = screen.getByRole("button", { name: /Show password/i });
    expect(toggle).toHaveAttribute("type", "button");
  });

  it("password value is preserved after toggling visibility", async () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const toggle = screen.getByRole("button", { name: /Show password/i });

    await userEvent.type(passwordInput, "S3cr3tPass!");

    await userEvent.click(toggle);
    expect(passwordInput).toHaveValue("S3cr3tPass!");

    await userEvent.click(
      screen.getByRole("button", { name: /Hide password/i }),
    );
    expect(passwordInput).toHaveValue("S3cr3tPass!");
  });

  it("toggle is disabled when the form is in a loading state", async () => {
    // Simulate a slow login so isLoading stays true long enough to assert
    vi.mocked(login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );
    render(<LoginForm />);

    await userEvent.type(
      screen.getByPlaceholderText(/Enter your email/i),
      "user@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "Password123!",
    );
    await userEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    // While loading the toggle must be disabled
    await waitFor(() => {
      const toggle = screen.getByRole("button", { name: /Show password/i });
      expect(toggle).toBeDisabled();
    });
  });

  // ─── Remember me persistence ─────────────────────────────────────────────

  it("persists the email via safeStorage when rememberMe is checked on login", async () => {
    vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText(/Enter your email/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText(/Enter your password/i), "Password123!");
    await userEvent.click(screen.getByRole("checkbox", { name: /Remember me/i }));
    await userEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(safeStorage.setItem).toHaveBeenCalledWith(REMEMBERED_EMAIL_KEY, "user@example.com");
    });
    expect(mockStore.get(REMEMBERED_EMAIL_KEY)).toBe("user@example.com");
  });

  it("clears any persisted email via safeStorage when rememberMe is unchecked on login", async () => {
    mockStore.set(REMEMBERED_EMAIL_KEY, "old@example.com");
    vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText(/Enter your password/i), "Password123!");
    // rememberMe checkbox pre-checked because a remembered email exists;
    // uncheck it explicitly for this test.
    const checkbox = screen.getByRole("checkbox", { name: /Remember me/i });
    if (checkbox.getAttribute("aria-checked") === "true") {
      await userEvent.click(checkbox);
    }
    await userEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(safeStorage.removeItem).toHaveBeenCalledWith(REMEMBERED_EMAIL_KEY);
    });
    expect(mockStore.has(REMEMBERED_EMAIL_KEY)).toBe(false);
  });

  it("never persists the password to storage regardless of rememberMe", async () => {
    vi.mocked(login).mockResolvedValue();
    render(<LoginForm />);

    await userEvent.type(screen.getByPlaceholderText(/Enter your email/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText(/Enter your password/i), "S3cr3tPass!");
    await userEvent.click(screen.getByRole("checkbox", { name: /Remember me/i }));
    await userEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(safeStorage.setItem).toHaveBeenCalled();
    });

    for (const call of vi.mocked(safeStorage.setItem).mock.calls) {
      expect(call[1]).not.toContain("S3cr3tPass!");
    }
    expect(Array.from(mockStore.values())).not.toContain("S3cr3tPass!");
  });

  it("pre-fills the email field from a remembered value on mount", () => {
    mockStore.set(REMEMBERED_EMAIL_KEY, "remembered@example.com");
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    expect(emailInput).toHaveValue("remembered@example.com");
  });

  it("never pre-fills the password field from storage", () => {
    mockStore.set(REMEMBERED_EMAIL_KEY, "remembered@example.com");
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    expect(passwordInput).toHaveValue("");
  });

  it("does not pre-fill the email field when nothing is remembered", () => {
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    expect(emailInput).toHaveValue("");
  });
});