import React from "react";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, test, describe, vi } from "vitest";
import { axe } from "vitest-axe";
import ClientAnalyticsView from "./client-analytics-view";

vi.mock("next/dynamic", () => {
  return {
    default: () => {
      const DynamicComponent = () => <div data-testid="analytics-view-mock">Analytics View</div>;
      return DynamicComponent;
    },
  };
});

describe("ClientAnalyticsView", () => {
  test("isMounted=false initial render matches the skeleton snapshot", () => {
    // renderToString simulates the initial SSR pass where useEffect hasn't fired
    const html = renderToString(<ClientAnalyticsView isLoading={false} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatchSnapshot();
  });

  test("renders skeleton when isLoading is true independent of mount state", () => {
    render(<ClientAnalyticsView isLoading={true} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    expect(screen.getByText("Loading analytics views chart...")).toBeInTheDocument();
    expect(screen.queryByTestId("analytics-view-mock")).not.toBeInTheDocument();
  });

  test("renders skeleton with notifications layout when isLoading=true and showNotifications=true", () => {
    render(<ClientAnalyticsView isLoading={true} showNotifications={true} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument();
  });

  test("renders actual component when isLoading is false and component is mounted", () => {
    render(<ClientAnalyticsView isLoading={false} />);
    // In @testing-library/react, useEffect runs synchronously so isMounted flips to true
    expect(screen.getByTestId("analytics-view-mock")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("is accessible when loading", async () => {
    const { container } = render(<ClientAnalyticsView isLoading={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("is accessible when mounted", async () => {
    const { container } = render(<ClientAnalyticsView isLoading={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
