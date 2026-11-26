import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from "@/components/ui/form";

interface TestFormValues {
  email: string;
}

function TestFormHarness({
  onSubmit = vi.fn(),
  defaultEmail = "",
  required = true,
  customMessageChildren,
}: {
  onSubmit?: (data: TestFormValues) => void;
  defaultEmail?: string;
  required?: boolean;
  customMessageChildren?: React.ReactNode;
}) {
  const form = useForm<TestFormValues>({
    defaultValues: { email: defaultEmail },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField
          control={form.control}
          name="email"
          rules={required ? { required: "Email is required" } : undefined}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>Enter your work email.</FormDescription>
              <FormMessage>{customMessageChildren}</FormMessage>
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe("Form primitives (components/ui/form)", () => {
  it("wires label htmlFor, input id, aria-describedby, and aria-invalid when valid", () => {
    render(<TestFormHarness />);

    const label = screen.getByText("Email");
    const input = screen.getByPlaceholderText("you@example.com");
    const description = screen.getByText("Enter your work email.");

    expect(input).toHaveAttribute("id");
    const inputId = input.getAttribute("id")!;
    expect(label).toHaveAttribute("for", inputId);
    expect(label).toHaveAttribute("data-error", "false");

    expect(description).toHaveAttribute("id");
    const descriptionId = description.getAttribute("id")!;

    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAttribute("aria-describedby", descriptionId);
    expect(screen.queryByText("Email is required")).not.toBeInTheDocument();
  });

  it("renders error message and updates aria-invalid and aria-describedby on validation error", async () => {
    const onSubmit = vi.fn();
    render(<TestFormHarness onSubmit={onSubmit} />);

    const label = screen.getByText("Email");
    const input = screen.getByPlaceholderText("you@example.com");
    const description = screen.getByText("Enter your work email.");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    await userEvent.click(submitButton);

    const errorMessage = await screen.findByText("Email is required");
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute("id");

    const descriptionId = description.getAttribute("id")!;
    const messageId = errorMessage.getAttribute("id")!;

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      `${descriptionId} ${messageId}`,
    );
    expect(label).toHaveAttribute("data-error", "true");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(input, "user@example.com");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { email: "user@example.com" },
        expect.anything(),
      );
    });
  });

  it("renders FormMessage children when there is no validation error and returns null when empty", () => {
    const { rerender } = render(
      <TestFormHarness
        required={false}
        customMessageChildren="Optional hint message"
      />,
    );

    expect(screen.getByText("Optional hint message")).toBeInTheDocument();

    rerender(<TestFormHarness required={false} />);
    expect(screen.queryByText("Optional hint message")).not.toBeInTheDocument();
  });

  it("throws when useFormField is called outside a <FormField> provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function OrphanFieldConsumer() {
      const form = useForm<TestFormValues>({ defaultValues: { email: "" } });
      return (
        <Form {...form}>
          <FormLabel>Orphan Label</FormLabel>
        </Form>
      );
    }

    expect(() => render(<OrphanFieldConsumer />)).toThrow(
      "useFormField should be used within <FormField>",
    );

    spy.mockRestore();
  });
});
