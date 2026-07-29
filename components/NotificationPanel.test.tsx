import { render, screen, fireEvent } from "@testing-library/react";
import NotificationPanel from "./NotificationPanel";

describe("NotificationPanel", () => {
  it("renders a 'View all' link to the notifications page", () => {
    render(<NotificationPanel />);
    // Open the panel by clicking the notification button
    const button = screen.getByRole("button", { name: /notifications/i });
    fireEvent.click(button);
    const link = screen.getByRole("link", { name: /view all/i });
    expect(link).toHaveAttribute("href", "/notifications");
  });

  it("renders all notifications below the virtualization threshold", () => {
    render(<NotificationPanel />);
    const button = screen.getByRole("button", { name: /notifications/i });
    fireEvent.click(button);
    // 3 mock notifications should render as individual list items with titles
    expect(screen.getByText("Payment received")).toBeInTheDocument();
    expect(screen.getByText("Payroll processed")).toBeInTheDocument();
    expect(screen.getByText("Security alert")).toBeInTheDocument();
  });

  it("shows the unread count badge", () => {
    render(<NotificationPanel />);
    // 2 of 3 mock notifications are unread
    const badge = screen.getByText("2");
    expect(badge).toBeInTheDocument();
  });
});