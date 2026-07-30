import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import {
  Form,
  AuthFormField,
  FormFieldPassword,
} from "@/components/ui/form-field";

interface TestFormValues {
  username: string;
  email: string;
  password: string;
}

function TestComponent({
  onSubmit = vi.fn(),
  defaultValues = { username: "", email: "", password: "" },
  disabled = false,
}) {
  const form = useForm<TestFormValues>({ defaultValues });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthFormField
          control={form.control}
          name="username"
          type="text"
          label="Username"
          placeholder="Enter username"
          disabled={disabled}
        />
        <AuthFormField
          control={form.control}
          name="email"
          type="email"
          label="Email Address"
          placeholder="Enter email"
          autoComplete="email"
          inputMode="email"
          disabled={disabled}
        />
        <AuthFormField
          control={form.control}
          name="password"
          type="password"
          label="Password"
          placeholder="Enter password"
          autoComplete="current-password"
          disabled={disabled}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

function PasswordWithDescribedBy() {
  const form = useForm<TestFormValues>({
    defaultValues: { username: "", email: "", password: "" },
  });

  return (
    <Form {...form}>
      <p id="external-helper">External helper text</p>
      <FormFieldPassword
        control={form.control}
        name="password"
        label="Password"
        placeholder="Enter password"
        ariaDescribedBy="external-helper"
      />
    </Form>
  );
}

describe("AuthFormField Component", () => {
  it("renders text, email, and password fields correctly", () => {
    render(<TestComponent />);

    const usernameInput = screen.getByPlaceholderText("Enter username");
    const emailInput = screen.getByPlaceholderText("Enter email");
    const passwordInput = screen.getByPlaceholderText("Enter password");

    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute("type", "text");

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("autoComplete", "email");
    expect(emailInput).toHaveAttribute("inputmode", "email");

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
  });

  it("delegates type=password to FormFieldPassword with show/hide toggle", async () => {
    render(<TestComponent />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const toggleButton = screen.getByRole("button", { name: /Show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    const hideButton = screen.getByRole("button", { name: /Hide password/i });
    expect(hideButton).toBeInTheDocument();
    expect(hideButton).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(hideButton);

    expect(passwordInput).toHaveAttribute("type", "password");
    const showButton = screen.getByRole("button", { name: /Show password/i });
    expect(showButton).toBeInTheDocument();
    expect(showButton).toHaveAttribute("aria-pressed", "false");
  });

  it("handles user typing and react-hook-form value binding", async () => {
    const handleSubmit = vi.fn();
    render(<TestComponent onSubmit={handleSubmit} />);

    const usernameInput = screen.getByPlaceholderText("Enter username");
    const emailInput = screen.getByPlaceholderText("Enter email");
    const passwordInput = screen.getByPlaceholderText("Enter password");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    await userEvent.type(usernameInput, "stellouser");
    await userEvent.type(emailInput, "stello@example.com");
    await userEvent.type(passwordInput, "Secret123!");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        {
          username: "stellouser",
          email: "stello@example.com",
          password: "Secret123!",
        },
        expect.anything(),
      );
    });
  });

  it("respects disabled state across all input fields and toggles", () => {
    render(<TestComponent disabled={true} />);

    const usernameInput = screen.getByPlaceholderText("Enter username");
    const emailInput = screen.getByPlaceholderText("Enter email");
    const passwordInput = screen.getByPlaceholderText("Enter password");
    const toggleButton = screen.getByRole("button", { name: /Show password/i });

    expect(usernameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });

  it("FormFieldPassword merges ariaDescribedBy into aria-describedby", () => {
    render(<PasswordWithDescribedBy />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const describedBy = passwordInput.getAttribute("aria-describedby");

    expect(describedBy?.split(/\s+/)).toContain("external-helper");
  });
});
