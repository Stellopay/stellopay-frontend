import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EmailInput from "./email-input";

const EmailInputWrapper = ({
  initialValue = "",
  error,
  helperText,
  onBlur,
  required,
}: {
  initialValue?: string;
  error?: boolean;
  helperText?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
}) => {
  const [value, setValue] = React.useState(initialValue);
  return (
    <EmailInput
      value={value}
      onChange={setValue}
      error={error}
      helperText={helperText}
      onBlur={onBlur}
      required={required}
    />
  );
};

describe("EmailInput validation on blur", () => {
  it("should not show any error message while the user is actively typing", async () => {
    render(<EmailInputWrapper />);
    const input = screen.getByLabelText("Email address");

    await userEvent.type(input, "invalid-email");

    expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("should show accessible error when input loses focus with a malformed email", async () => {
    const onBlurMock = vi.fn();
    render(<EmailInputWrapper onBlur={onBlurMock} />);
    const input = screen.getByLabelText("Email address");

    await userEvent.type(input, "invalid-email");
    await userEvent.click(document.body);

    expect(onBlurMock).toHaveBeenCalledTimes(1);

    const errorMsg = screen.getByText("Please enter a valid email address");
    expect(errorMsg).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toContain(errorMsg.id);
  });

  it("should clear the error message immediately once the value is corrected to a valid format", async () => {
    render(<EmailInputWrapper />);
    const input = screen.getByLabelText("Email address");

    await userEvent.type(input, "invalid-email");
    await userEvent.click(document.body);

    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");

    await userEvent.type(input, "@example.com");

    expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("should clear the error message immediately when the input is emptied", async () => {
    render(<EmailInputWrapper />);
    const input = screen.getByLabelText("Email address");

    await userEvent.type(input, "invalid-email");
    await userEvent.click(document.body);

    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();

    await userEvent.clear(input);

    expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("should concatenate the error ID with other description IDs in aria-describedby when helperText is present", async () => {
    render(
      <EmailInputWrapper
        helperText="We will never share your email"
      />
    );
    const input = screen.getByLabelText("Email address");
    const helperMsg = screen.getByText("We will never share your email");

    expect(input.getAttribute("aria-describedby")).toBe(helperMsg.id);

    await userEvent.type(input, "invalid-email");
    await userEvent.click(document.body);

    const errorMsg = screen.getByText("Please enter a valid email address");
    const describedBy = input.getAttribute("aria-describedby");

    expect(describedBy).toContain(helperMsg.id);
    expect(describedBy).toContain(errorMsg.id);
    expect(describedBy).toBe(`${helperMsg.id} ${errorMsg.id}`);
  });

  it("should display authoritative error when the error prop is true", () => {
    render(
      <EmailInput
        value="invalid-email"
        onChange={() => {}}
        error={true}
        helperText="Custom submit error message"
      />
    );

    const input = screen.getByLabelText("Email address");
    const errorMsg = screen.getByText("Custom submit error message");

    expect(errorMsg).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(errorMsg.id);
  });
});
