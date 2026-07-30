import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HighlightText } from "@/components/common/highlight-text";

describe("HighlightText", () => {
  it("renders plain text when query is empty", () => {
    const { container } = render(<HighlightText text="Hello World" query="" />);
    expect(container.textContent).toBe("Hello World");
    expect(container.querySelector("mark")).not.toBeInTheDocument();
  });

  it("renders plain text when query does not match", () => {
    const { container } = render(
      <HighlightText text="Hello World" query="xyz" />,
    );
    expect(container.textContent).toBe("Hello World");
    expect(container.querySelector("mark")).not.toBeInTheDocument();
  });

  it("highlights matching text", () => {
    render(<HighlightText text="Hello World" query="World" />);
    const marks = screen.getAllByRole("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("World");
  });

  it("highlights case-insensitive matches", () => {
    render(<HighlightText text="Hello World" query="world" />);
    const marks = screen.getAllByRole("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("World");
  });

  it("highlights multiple occurrences", () => {
    render(<HighlightText text="test test test" query="test" />);
    const marks = screen.getAllByRole("mark");
    expect(marks).toHaveLength(3);
  });

  it("highlights partial word matches", () => {
    render(<HighlightText text="password reset" query="pass" />);
    const marks = screen.getAllByRole("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("pass");
  });

  it("handles special regex characters in query", () => {
    render(<HighlightText text="price is $10.00" query="$10.00" />);
    const marks = screen.getAllByRole("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("$10.00");
  });

  it("renders non-matching parts unchanged", () => {
    const { container } = render(
      <HighlightText text="Hello World" query="World" />,
    );
    expect(container.textContent).toBe("Hello World");
  });
});
