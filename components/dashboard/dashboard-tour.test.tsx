import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockSetItem = vi.fn();
const mockGetItem = vi.fn();
vi.mock("@/utils/safeStorage", () => ({
  safeStorage: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: vi.fn(),
    isDashboardTourCompleted: () => mockGetItem("stellopay_dashboard_tour_completed") === "true",
    setDashboardTourCompleted: () => mockSetItem("stellopay_dashboard_tour_completed", "true"),
  },
  STORAGE_KEYS: {
    DASHBOARD_TOUR_COMPLETED: "stellopay_dashboard_tour_completed",
  },
}));

vi.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

import { DashboardTour } from "@/components/dashboard/dashboard-tour";

function makeRefWithElement(w = 400, h = 100) {
  const el = document.createElement("div");
  el.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: 100,
        left: 200,
        right: 200 + w,
        bottom: 100 + h,
        width: w,
        height: h,
        x: 200,
        y: 100,
        toJSON: () => {},
      }) as DOMRect,
  );
  el.scrollIntoView = vi.fn();
  return { current: el };
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
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("is not rendered immediately before auto-trigger delay", () => {
    mockGetItem.mockReturnValue(null);
    const { container } = render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("appears after auto-trigger delay", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows welcome step on open with step counter 1 of 5", async () => {
    mockGetItem.mockReturnValue(null);
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    });
  });

  it("navigates forward through all 5 steps on Next click and completes on Get Started", async () => {
    const accountRef = makeRefWithElement();
    const quickRef = makeRefWithElement();
    const analyticsRef = makeRefWithElement();
    const clientRef = makeRefWithElement();

    render(
      <DashboardTour
        accountSummaryRef={accountRef}
        quickActionsRef={quickRef}
        analyticsInsightsRef={analyticsRef}
        clientAnalyticsRef={clientRef}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
    });

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Account Summary")).toBeInTheDocument();
    });
    expect(accountRef.current.scrollIntoView).toHaveBeenCalled();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });
    expect(quickRef.current.scrollIntoView).toHaveBeenCalled();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Analytics & Insights")).toBeInTheDocument();
    });
    expect(analyticsRef.current.scrollIntoView).toHaveBeenCalled();

    // Step 4 -> Step 5
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Detailed Analytics")).toBeInTheDocument();
    });
    expect(clientRef.current.scrollIntoView).toHaveBeenCalled();

    // Step 5 -> Finish
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(mockSetItem).toHaveBeenCalledWith("stellopay_dashboard_tour_completed", "true");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("navigates backward on Back click and hides Back button on step 1", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText("Account Summary")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("dismisses on skip button click and marks completed in safeStorage", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));

    expect(mockSetItem).toHaveBeenCalledWith("stellopay_dashboard_tour_completed", "true");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("dismisses on Escape key and marks completed in safeStorage", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockSetItem).toHaveBeenCalledWith("stellopay_dashboard_tour_completed", "true");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("has correct ARIA attributes linking dialog to step title and description", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "tour-title-welcome");
      expect(dialog).toHaveAttribute("aria-describedby", "tour-description-welcome");
    });
  });

  it("renders 5 step indicator dots with correct aria-labels and aria-current", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      const dots = document.querySelectorAll("[aria-label^='Go to step']");
      expect(dots.length).toBe(5);
      expect(dots[0]).toHaveAttribute("aria-current", "step");
      expect(dots[1]).not.toHaveAttribute("aria-current");
    });
  });

  it("navigates directly via step indicator dots", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
    });

    const dot4 = screen.getByLabelText("Go to step 4: Analytics & Insights");
    fireEvent.click(dot4);

    await waitFor(() => {
      expect(screen.getByText("Analytics & Insights")).toBeInTheDocument();
      expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();
    });
  });

  it("highlights target element when target ref is present", async () => {
    const accountRef = makeRefWithElement();
    render(
      <DashboardTour
        accountSummaryRef={accountRef}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome to Stellopay")).toBeInTheDocument();
    });

    // Go to step 2 (account summary)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      const highlightBox = document.querySelector(".rounded-2xl.border-2");
      expect(highlightBox).toBeInTheDocument();
    });
  });

  it("traps focus inside the dialog when Tab is pressed", async () => {
    render(
      <DashboardTour
        accountSummaryRef={makeRefWithElement()}
        quickActionsRef={makeRefWithElement()}
        analyticsInsightsRef={makeRefWithElement()}
        clientAnalyticsRef={makeRefWithElement()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole("button", { name: /next/i });
    const skipBtn = screen.getByRole("button", { name: /skip tour/i });

    // Focus last element (nextBtn)
    nextBtn.focus();
    expect(document.activeElement).toBe(nextBtn);

    // Tab from last element loops to first element (skipBtn)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(skipBtn);

    // Shift+Tab from first element loops to last element (nextBtn)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(nextBtn);
  });
});
