import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RechartsMiniBarChart } from "./RechartsMiniBarChart";

const defaultData = [{ value: 40 }, { value: 70 }, { value: 30 }, { value: 60 }];

describe("RechartsMiniBarChart", () => {
  it("renders with basic data", () => {
    const { container } = render(
      <RechartsMiniBarChart data={defaultData} color="#3B82F6" />,
    );

    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "Mini bar chart",
    );
  });

  it("renders with custom aria label and height", () => {
    render(
      <RechartsMiniBarChart
        data={defaultData}
        color="#10B981"
        height="5rem"
        ariaLabel="Revenue mini chart"
      />,
    );

    const chart = screen.getByRole("img");
    expect(chart).toHaveAttribute("aria-label", "Revenue mini chart");
    expect(chart).toHaveStyle("height: 5rem");
  });

  it("renders with empty data without crashing", () => {
    const { container } = render(
      <RechartsMiniBarChart data={[]} color="#3B82F6" />,
    );

    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeInTheDocument();
  });

  it("renders with single data point", () => {
    render(
      <RechartsMiniBarChart data={[{ value: 100 }]} color="#3B82F6" />,
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders with aria attributes for accessibility", () => {
    render(
      <RechartsMiniBarChart data={defaultData} color="#3B82F6" />,
    );

    const chart = screen.getByRole("img");
    expect(chart).toHaveAttribute("aria-label", "Mini bar chart");
  });
});
