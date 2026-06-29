import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Filter from "./filter";

describe("Filter", () => {
  it("debounces filter updates from the controlled input", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    render(<Filter value="" onChange={onChange} debounceMs={250} />);

    fireEvent.change(screen.getByLabelText("Filter transactions"), {
      target: { value: "failed" },
    });

    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith("failed");

    vi.useRealTimers();
  });

  it("marks the filter icon decorative and clears a populated value", () => {
    const onChange = vi.fn();

    render(<Filter value="pending" onChange={onChange} debounceMs={0} />);

    expect(screen.getByTestId("transactions-filter-icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Clear transaction filter" }),
    );

    expect(onChange).toHaveBeenCalledWith("");
  });
});
