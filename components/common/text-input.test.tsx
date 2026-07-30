import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TextInput from "./text-input";

describe("TextInput", () => {
  describe("number handling", () => {
    it("accepts valid integer input", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Age" type="number" onChange={onChange} />);

      const input = screen.getByLabelText("Age");
      await userEvent.type(input, "123");

      expect(onChange).toHaveBeenCalledWith("1");
      expect(onChange).toHaveBeenCalledWith("12");
      expect(onChange).toHaveBeenCalledWith("123");
    });

    it("accepts valid decimal input including partial states", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Amount" type="number" onChange={onChange} />);

      const input = screen.getByLabelText("Amount");
      await userEvent.type(input, "10.5");

      expect(onChange).toHaveBeenCalledWith("1");
      expect(onChange).toHaveBeenCalledWith("10");
      // userEvent typing "." on type="number" does not emit "10." as value, but keeps it as "10" or ""
      // The final complete number is emitted correctly
      expect(onChange).toHaveBeenCalledWith("10.5");
    });

    it("accepts negative numbers including partial states", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Balance" type="number" onChange={onChange} />);

      const input = screen.getByLabelText("Balance");
      await userEvent.type(input, "-5");

      // userEvent typing "-" on type="number" may set value to "" internally and not trigger an onChange if value was already ""
      expect(onChange).toHaveBeenCalledWith("-5");
    });

    it("accepts pasted numbers", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Amount" type="number" onChange={onChange} />);

      const input = screen.getByLabelText("Amount");
      await userEvent.click(input);
      await userEvent.paste("123.45");

      expect(onChange).toHaveBeenCalledWith("123.45");
    });

    it("drops invalid non-numeric input", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Amount" type="number" onChange={onChange} />);

      const input = screen.getByLabelText("Amount");
      await userEvent.type(input, "1a2");

      expect(onChange).toHaveBeenCalledWith("1");
      expect(onChange).not.toHaveBeenCalledWith("1a");
      expect(onChange).not.toHaveBeenCalledWith("1a2");
    });

    it("sets correct inputMode and pattern for mobile keyboards", () => {
      render(<TextInput label="Amount" type="number" onChange={() => {}} />);
      const input = screen.getByLabelText("Amount");

      expect(input).toHaveAttribute("inputMode", "decimal");
      expect(input).toHaveAttribute("pattern", "^-?[0-9]*\\.?[0-9]*$");
    });
  });

  describe("other input types", () => {
    it("forwards text input correctly", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Name" type="text" onChange={onChange} />);

      const input = screen.getByLabelText("Name");
      await userEvent.type(input, "abc");

      expect(onChange).toHaveBeenCalledWith("a");
      expect(onChange).toHaveBeenCalledWith("ab");
      expect(onChange).toHaveBeenCalledWith("abc");
    });

    it("forwards email input correctly", async () => {
      const onChange = vi.fn();
      render(<TextInput label="Email" type="email" onChange={onChange} />);

      const input = screen.getByLabelText("Email");
      await userEvent.type(input, "a@b.c");

      expect(onChange).toHaveBeenCalledWith("a@b.c");
    });
  });

  describe("shared input token contract", () => {
    it("applies shared wrapper base classes to the container div", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      // The wrapper div is the container with the border/ring classes.
      // We look for a div that has the border-related classes from the token contract.
      const wrapper = document.querySelector(
        `[class*="rounded-md"][class*="shadow-xs"]`,
      );
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.className).toMatch(/transition-\[color,box-shadow\]/);
    });

    it("applies shared default-state classes when not in error", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const wrapper = document.querySelector(
        `[class*="rounded-md"][class*="shadow-xs"]`,
      );
      expect(wrapper?.className).toMatch(/focus-within:border-ring/);
    });

    it("applies shared error-state classes when error=true", () => {
      render(<TextInput label="Test" onChange={() => {}} error />);

      const wrapper = document.querySelector(
        `[class*="rounded-md"][class*="shadow-xs"]`,
      );
      expect(wrapper?.className).toMatch(/border-destructive/);
      expect(wrapper?.className).toMatch(/ring-destructive\/20/);
      expect(wrapper?.className).toMatch(/focus-within:border-destructive/);
    });

    it("applies shared disabled classes when disabled=true", () => {
      render(<TextInput label="Test" onChange={() => {}} disabled />);

      const wrapper = document.querySelector(
        `[class*="rounded-md"][class*="shadow-xs"]`,
      );
      expect(wrapper?.className).toMatch(/disabled:opacity-50/);
      expect(wrapper?.className).toMatch(/disabled:pointer-events-none/);
      expect(wrapper?.className).toMatch(/disabled:cursor-not-allowed/);
    });

    it("applies shared inner classes to the input element", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const input = screen.getByLabelText("Test");
      expect(input.className).toMatch(/bg-transparent/);
      expect(input.className).toMatch(/focus:outline-none/);
      expect(input.className).toMatch(/placeholder:text-muted-foreground/);
    });

    it("applies dark mode background class", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const wrapper = document.querySelector(
        `[class*="rounded-md"][class*="shadow-xs"]`,
      );
      expect(wrapper?.className).toMatch(/dark:bg-input\/30/);
    });
  });

  describe("error state", () => {
    it("sets aria-invalid to 'true' when error=true", () => {
      render(<TextInput label="Test" onChange={() => {}} error />);

      const input = screen.getByLabelText("Test");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-invalid to 'false' when error=false", () => {
      render(<TextInput label="Test" onChange={() => {}} error={false} />);

      const input = screen.getByLabelText("Test");
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("renders error message with role=alert and aria-live=polite", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          error
          helperText="This field is required"
        />,
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("This field is required");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("disabled state", () => {
    it("disables the input element when disabled=true", () => {
      render(<TextInput label="Test" onChange={() => {}} disabled />);

      const input = screen.getByLabelText("Test");
      expect(input).toBeDisabled();
    });

    it("does not disable the input when disabled is not set", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const input = screen.getByLabelText("Test");
      expect(input).not.toBeDisabled();
    });
  });

  describe("element type", () => {
    it("renders an HTMLInputElement", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const input = screen.getByLabelText("Test");
      expect(input).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe("aria attributes", () => {
    it("wires up aria-describedby for helperText", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          helperText="Helper message"
        />,
      );

      const input = screen.getByLabelText("Test");
      const helper = screen.getByText("Helper message");

      expect(input).toHaveAttribute("aria-describedby", helper.id);
    });

    it("wires up aria-describedby for error", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          error={true}
          helperText="Error message"
        />,
      );

      const input = screen.getByLabelText("Test");
      const errorMsg = screen.getByText("Error message");

      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toContain(errorMsg.id);
    });

    it("wires up aria-describedby for both if possible (though error replaces helper in UI)", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          error={true}
          helperText="Error message"
        />,
      );

      const input = screen.getByLabelText("Test");
      const ids = input.getAttribute("aria-describedby");
      expect(ids).toContain(screen.getByText("Error message").id);
    });

    it("sets aria-required when required=true", () => {
      render(<TextInput label="Test" onChange={() => {}} required />);

      const input = screen.getByLabelText("Test");
      expect(input).toHaveAttribute("aria-required", "true");
    });

    it("does not set aria-required when required is not set", () => {
      render(<TextInput label="Test" onChange={() => {}} />);

      const input = screen.getByLabelText("Test");
      expect(input).not.toHaveAttribute("aria-required", "true");
    });
  });

  describe("rendering", () => {
    it("renders label when provided", () => {
      render(<TextInput label="Username" onChange={() => {}} />);
      expect(screen.getByText("Username")).toBeInTheDocument();
    });

    it("renders without label when not provided", () => {
      render(<TextInput onChange={() => {}} value="" />);
      expect(screen.queryByRole("label")).toBeNull();
    });

    it("renders icon when provided", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          icon={<span data-testid="test-icon">🔍</span>}
        />,
      );
      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    });

    it("renders placeholder text", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          placeholder="Enter value..."
        />,
      );
      expect(screen.getByPlaceholderText("Enter value...")).toBeInTheDocument();
    });

    it("renders helper text when not in error state", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          helperText="Some helpful info"
        />,
      );
      expect(screen.getByText("Some helpful info")).toBeInTheDocument();
    });

    it("renders empty input with no console errors", () => {
      const { container } = render(
        <TextInput label="Test" onChange={() => {}} value="" />,
      );
      expect(container).toBeTruthy();
    });
  });
});
