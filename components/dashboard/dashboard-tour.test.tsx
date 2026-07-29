import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSetItem = vi.fn();
const mockGetItem = vi.fn();
vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: vi.fn(),
  },
}));

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

import { DashboardTour } from "@/components/dashboard/dashboard-tour";

function makeRef() {
  return { current: null };
}

function setupEl(ref: ReturnType<typeof makeRef>, w = 400, h = 100) {
  const el = document.createElement("div");
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: 100, left: 200, right: 200 + w, bottom: 100 + h,
        width: w, height: h, x: 200, y: 100, toJSON: () => {},
      }) as DOMRect,
  );
  ref.current = el;
  return el;
}

describe("DashboardTour", () => {
  beforeEach(() => {
    mockGetItem.mockReturnValue(null);
    mockSetItem.mockClear();
  });

  it("is not rendered when tour already completed", () => {
    mockGetItem.mockReturnValue("true");
    const { container } = render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("is not rendered when tour is not yet open and has not been auto-triggered", () => {
    const { container } = render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("appears after auto-trigger delay", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows welcome step on open", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows correct step count", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Step 1 of 5")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("navigates forward on Next click", async () => {
    setupEl(makeRef());
    setupEl(makeRef());

    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(
      () => expect(screen.getByText("Account Summary")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("navigates backward on Back click", async () => {
    setupEl(makeRef());
    setupEl(makeRef());

    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(
      () => expect(screen.getByText("Account Summary")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /back/i }));

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("hides Back button on first step", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("dismisses on skip button click", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("dismisses on Escape key", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    fireEvent.keyDown(document, { key: "Escape" });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has correct ARIA modal and label", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAttribute(
          "aria-label",
          expect.stringContaining("step 1 of 5"),
        );
      },
      { timeout: 2000 },
    );
  });

  it("renders 5 step indicator dots", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => {
        const dots = document.querySelectorAll("[aria-label^='Go to step']");
        expect(dots.length).toBe(5);
      },
      { timeout: 2000 },
    );
  });

  it("navigates via step indicator dots", async () => {
    setupEl(makeRef());
    setupEl(makeRef());
    setupEl(makeRef());
    setupEl(makeRef());

    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    const dot3 = screen.getByLabelText("Go to step 3: Analytics & Insights");
    fireEvent.click(dot3);

    await waitFor(
      () => expect(screen.getByText("Analytics & Insights")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("highlights target element with blue ring when target exists", async () => {
    setupEl(makeRef());

    render(
      <DashboardTour
        accountSummaryRef={makeRef()}
        quickActionsRef={makeRef()}
        analyticsInsightsRef={makeRef()}
        clientAnalyticsRef={makeRef()}
      />,
    );

    await waitFor(
      () => expect(screen.getByRole("dialog")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    const highlight = document.querySelector(".rounded-2xl.border-2");
    expect(highlight).toBeInTheDocument();
  });
});
