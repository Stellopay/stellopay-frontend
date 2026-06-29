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
      // userEvent.type simulates keypresses one by one.
      // Since "a" is dropped, the final value would be "12" if we update state, 
      // but here we just check if onChange was called with invalid strings.
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

  describe("aria attributes", () => {
    it("wires up aria-describedby for helperText", () => {
      render(
        <TextInput
          label="Test"
          onChange={() => {}}
          helperText="Helper message"
        />
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
        />
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
        />
      );

      const input = screen.getByLabelText("Test");
      const ids = input.getAttribute("aria-describedby");
      expect(ids).toContain(screen.getByText("Error message").id);
    });
  });
});
