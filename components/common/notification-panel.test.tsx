import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotificationPanel from "@/components/common/notification-panel";
import { NotificationItem } from "@/types/notification-item";

const notifications: NotificationItem[] = [
  {
    id: "payment-received",
    title: "Payment received",
    message: "Your USDC payment arrived.",
    read: false,
  },
  {
    id: "transfer-complete",
    title: "Transfer complete",
    message: "Your XLM transfer is complete.",
    read: true,
  },
];

describe("NotificationPanel", () => {
  it("renders an accessible empty state when there are no notifications", () => {
    render(<NotificationPanel notifications={[]} />);

    expect(
      screen.getByRole("button", { name: /open notifications/i }),
    ).toBeInTheDocument();

    const region = screen.getByRole("region", {
      name: /notifications list/i,
    });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(
      screen.getByText(/new transaction notifications will appear here/i),
    ).toBeInTheDocument();
  });

  it("uses notification ids for stable rendered items across reorders", () => {
    const { rerender } = render(
      <NotificationPanel notifications={notifications} />,
    );

    expect(screen.getByTestId("notification-payment-received")).toHaveTextContent(
      "Payment received",
    );
    expect(screen.getByTestId("notification-transfer-complete")).toHaveTextContent(
      "Transfer complete",
    );

    rerender(<NotificationPanel notifications={[...notifications].reverse()} />);

    expect(screen.getByTestId("notification-payment-received")).toHaveTextContent(
      "Payment received",
    );
    expect(screen.getByTestId("notification-transfer-complete")).toHaveTextContent(
      "Transfer complete",
    );
  });

  it("keeps loading skeletons separate from the empty state", () => {
    render(<NotificationPanel notifications={[]} isLoading />);

    expect(screen.queryByText("You're all caught up")).not.toBeInTheDocument();
  });
});
