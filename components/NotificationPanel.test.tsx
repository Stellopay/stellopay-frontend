import { render, screen } from "@testing-library/react";
import NotificationPanel from "./NotificationPanel";

describe("NotificationPanel", () => {
  it("renders a 'View all' link to the notifications page", () => {
    render(<NotificationPanel />);
    const link = screen.getByRole("link", { name: /view all/i });
    expect(link).toHaveAttribute("href", "/notifications");
  });
});