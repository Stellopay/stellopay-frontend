import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorSummary } from "./error-summary";

describe("ErrorSummary", () => {
  it("renders nothing when there are no errors", () => {
    const { container } = render(<ErrorSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single error message", () => {
    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
        }}
      />,
    );

    expect(screen.getByText("There is 1 error")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Email") && content.includes("required")),
    ).toBeInTheDocument();
  });

  it("renders multiple error messages", () => {
    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
          password: { type: "minLength", message: "Password is too short" },
        }}
      />,
    );

    expect(screen.getByText("There are 2 errors")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Email") && content.includes("required")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Password") && content.includes("too short")),
    ).toBeInTheDocument();
  });

  it("filters out non-error entries (e.g. nested objects without messages)", () => {
    render(
      <ErrorSummary
        errors={
          {
            email: { type: "required", message: "Email is required" },
            someField: {}, // no message → should be filtered out
          } as any
        }
      />,
    );

    expect(screen.getByText("There is 1 error")).toBeInTheDocument();
  });

  it("renders anchor links for each error", () => {
    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
          password: { type: "minLength", message: "Password is too short" },
        }}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "#field-email");
    expect(links[1]).toHaveAttribute("href", "#field-password");
  });

  it("uses custom fieldIdMap when provided", () => {
    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
        }}
        fieldIdMap={{ email: "custom-email-input" }}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#custom-email-input");
  });

  it("moves focus to the element on link click", () => {
    // Set up a target element in the DOM
    const target = document.createElement("input");
    target.id = "field-email";
    target.focus = vi.fn();
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
        }}
      />,
    );

    const link = screen.getByRole("link");
    fireEvent.click(link);

    expect(target.focus).toHaveBeenCalled();
    expect(target.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(target);
  });

  it("has proper accessibility attributes", () => {
    render(
      <ErrorSummary
        errors={{
          email: { type: "required", message: "Email is required" },
        }}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("tabIndex", "-1");
    expect(alert).toHaveAttribute("data-testid", "error-summary");
  });
});
