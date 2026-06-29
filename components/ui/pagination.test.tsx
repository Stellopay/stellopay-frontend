import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "./pagination";

describe("Pagination", () => {
  it("renders a navigation landmark with an accessible name", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const nav = screen.getByRole("navigation", { name: "pagination" });
    expect(nav).toBeInTheDocument();
  });

  it("marks the current page with aria-current=page", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2">2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const activeLink = screen.getByText("1").closest("a");
    expect(activeLink).toHaveAttribute("aria-current", "page");

    const inactiveLink = screen.getByText("2").closest("a");
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });

  it("renders prev/next controls with accessible labels", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/2" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const prev = screen.getByRole("link", { name: /go to previous page/i });
    expect(prev).toBeInTheDocument();

    const next = screen.getByRole("link", { name: /go to next page/i });
    expect(next).toBeInTheDocument();
  });

  it("disables prev control at the first page via aria-disabled", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" aria-disabled="true" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const prev = screen.getByRole("link", { name: /go to previous page/i });
    expect(prev).toHaveAttribute("aria-disabled", "true");
  });

  it("disables next control at the last page via aria-disabled", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/1" aria-disabled="true" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const next = screen.getByRole("link", { name: /go to next page/i });
    expect(next).toHaveAttribute("aria-disabled", "true");
  });

  it("renders an ellipsis with hidden decorative icon and sr-only text", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const ellipsis = screen.getByText("More pages");
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis).toHaveClass("sr-only");
  });

  it("passes axe accessibility audit", async () => {
    const { container } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" aria-disabled="true" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/2">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/3">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("makes controls keyboard-focusable", async () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/page/1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/page/1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive href="/page/2">
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/page/3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const user = userEvent.setup();
    const links = screen.getAllByRole("link");

    await user.tab();
    expect(links[0]).toHaveFocus();

    await user.tab();
    expect(links[1]).toHaveFocus();

    await user.tab();
    expect(links[2]).toHaveFocus();

    await user.tab();
    expect(links[3]).toHaveFocus();
  });

  it("renders a single page without prev/next", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: /go to previous page/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /go to next page/i })).not.toBeInTheDocument();
  });

  it("applies custom className to the nav element", () => {
    render(
      <Pagination className="my-custom-class">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="/page/1">
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("my-custom-class");
  });
});
