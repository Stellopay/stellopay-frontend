import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Sort from "./sort";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe("Sort", () => {
  const push = jest.fn();
  const replace = jest.fn();

  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    window.localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({ push, replace });
    (usePathname as jest.Mock).mockReturnValue("/transactions");
  });

  it("pre-fills sort from localStorage when no URL param is present", () => {
    window.localStorage.setItem("transactions-sort-preference", "amount-asc");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));

    render(<Sort />);

    expect(replace).toHaveBeenCalledWith(
      "/transactions?sort=amount-asc",
      { scroll: false }
    );
  });

  it("leaves an existing URL sort param untouched", () => {
    window.localStorage.setItem("transactions-sort-preference", "amount-asc");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("sort=date-asc")
    );

    render(<Sort />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("saves the preference only when the user explicitly changes the sort", () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));

    render(<Sort />);
    expect(window.localStorage.getItem("transactions-sort-preference")).toBeNull();

    fireEvent.change(screen.getByLabelText(/sort transactions/i), {
      target: { value: "amount-desc" },
    });

    expect(window.localStorage.getItem("transactions-sort-preference")).toBe(
      "amount-desc"
    );
    expect(push).toHaveBeenCalledWith(
      "/transactions?sort=amount-desc",
      { scroll: false }
    );
  });
});