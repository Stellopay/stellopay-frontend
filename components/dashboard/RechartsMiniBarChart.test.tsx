import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RechartsMiniBarChart } from "./RechartsMiniBarChart";

const defaultData = [
  { value: 40 },
  { value: 70 },
  { value: 30 },
  { value: 60 },
];

describe("RechartsMiniBarChart", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("renders with basic data", () => {
    const { container } = render(
      <RechartsMiniBarChart data={defaultData} color="var(--chart-blue)" />,
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
        color="var(--chart-green)"
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
      <RechartsMiniBarChart data={[]} color="var(--chart-blue)" />,
    );

    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeInTheDocument();
  });

  it("renders with single data point", () => {
    render(
      <RechartsMiniBarChart
        data={[{ value: 100 }]}
        color="var(--chart-blue)"
      />,
    );

    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders with aria attributes for accessibility", () => {
    render(
      <RechartsMiniBarChart data={defaultData} color="var(--chart-blue)" />,
    );

    const chart = screen.getByRole("img");
    expect(chart).toHaveAttribute("aria-label", "Mini bar chart");
  });

  it("renders with css variable color and produces a responsive container", () => {
    const { container } = render(
      <RechartsMiniBarChart
        data={defaultData}
        color="var(--chart-amber)"
      />,
    );

    expect(
      container.querySelector(".recharts-responsive-container"),
    ).toBeInTheDocument();
  });

  it("renders with all three semantic chart color tokens", () => {
    const colors = [
      "var(--chart-blue)",
      "var(--chart-green)",
      "var(--chart-amber)",
    ];

    for (const color of colors) {
      const { container, unmount } = render(
        <RechartsMiniBarChart data={defaultData} color={color} />,
      );

      expect(
        container.querySelector(".recharts-responsive-container"),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("renders correctly in dark mode context", () => {
    document.documentElement.classList.add("dark");

    render(
      <RechartsMiniBarChart
        data={defaultData}
        color="var(--chart-blue)"
        ariaLabel="Dark mode chart"
      />,
    );

    const chart = screen.getByRole("img");
    expect(chart).toHaveAttribute("aria-label", "Dark mode chart");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });


});
