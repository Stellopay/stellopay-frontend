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

  it("applies min and max amount filters correctly for a valid range", () => {
    vi.useFakeTimers();
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <Filter
        value=""
        onChange={vi.fn()}
        onMinAmountChange={onMinChange}
        onMaxAmountChange={onMaxChange}
        debounceMs={250}
      />
    );

    fireEvent.change(screen.getByLabelText("Min amount"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Max amount"), {
      target: { value: "100" },
    });

    vi.advanceTimersByTime(250);

    expect(onMinChange).toHaveBeenCalledWith(10);
    expect(onMaxChange).toHaveBeenCalledWith(100);
    expect(screen.queryByText("Min > Max")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it("shows an error and does not apply filter for an inverted range", () => {
    vi.useFakeTimers();
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <Filter
        value=""
        onChange={vi.fn()}
        onMinAmountChange={onMinChange}
        onMaxAmountChange={onMaxChange}
        debounceMs={250}
      />
    );

    fireEvent.change(screen.getByLabelText("Min amount"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByLabelText("Max amount"), {
      target: { value: "50" },
    });

    vi.advanceTimersByTime(250);

    expect(screen.getByText("Min > Max")).toBeInTheDocument();
    expect(onMinChange).not.toHaveBeenCalled();
    expect(onMaxChange).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("handles no-range (unchanged) cases properly", () => {
    vi.useFakeTimers();
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <Filter
        value=""
        onChange={vi.fn()}
        onMinAmountChange={onMinChange}
        onMaxAmountChange={onMaxChange}
        debounceMs={250}
      />
    );

    fireEvent.change(screen.getByLabelText("Min amount"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Max amount"), {
      target: { value: "" },
    });

    vi.advanceTimersByTime(250);

    // Initial state is undefined, clearing an empty input means it remains unchanged
    expect(onMinChange).not.toHaveBeenCalled();
    expect(onMaxChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Min > Max")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
