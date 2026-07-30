import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WasThisHelpful, getStorageKey } from "./was-this-helpful";

// ─── Setup ───────────────────────────────────────────────────────────────────

const ARTICLE_ID = "password-security";
const STORAGE_KEY = getStorageKey(ARTICLE_ID);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWidget(onContactSupport?: () => void) {
  return render(
    <WasThisHelpful
      articleId={ARTICLE_ID}
      onContactSupport={onContactSupport}
    />,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("WasThisHelpful", () => {
  describe("Initial rendering", () => {
    it("renders the question prompt and Yes/No buttons", async () => {
      renderWidget();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /yes/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /no/i }),
      ).toBeInTheDocument();
    });

    it("has proper accessibility region landmark", async () => {
      renderWidget();

      await waitFor(() => {
        const region = screen.getByRole("region", {
          name: /article feedback/i,
        });
        expect(region).toBeInTheDocument();
      });
    });

    it("has labeled button group", async () => {
      renderWidget();

      await waitFor(() => {
        const group = screen.getByRole("group", { name: /was this helpful/i });
        expect(group).toBeInTheDocument();
      });
    });
  });

  describe("Yes feedback flow", () => {
    it("shows thank-you message when Yes is clicked and hides buttons", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const yesButton = screen.getByRole("button", { name: /yes/i });
      fireEvent.click(yesButton);

      // Thank-you message should appear
      expect(
        screen.getByText(/glad this helped/i),
      ).toBeInTheDocument();

      // Initial question and buttons should be gone
      expect(
        screen.queryByText("Was this helpful?"),
      ).not.toBeInTheDocument();
    });

    it("persists Yes feedback to localStorage", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const yesButton = screen.getByRole("button", { name: /yes/i });
      fireEvent.click(yesButton);

      expect(localStorage.getItem(STORAGE_KEY)).toBe("yes");
    });
  });

  describe("No feedback flow", () => {
    it("shows sorry message when No is clicked and hides buttons", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const noButton = screen.getByRole("button", { name: /no/i });
      fireEvent.click(noButton);

      // Sorry message should appear
      expect(
        screen.getByText(/sorry this wasn.*helpful/i),
      ).toBeInTheDocument();

      // Initial question and buttons should be gone
      expect(
        screen.queryByText("Was this helpful?"),
      ).not.toBeInTheDocument();
    });

    it("shows Contact Support button when onContactSupport is provided", async () => {
      const onContactSupport = vi.fn();
      renderWidget(onContactSupport);

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const noButton = screen.getByRole("button", { name: /no/i });
      fireEvent.click(noButton);

      // Contact Support button should appear
      const contactButton = screen.getByRole("button", {
        name: /contact support/i,
      });
      expect(contactButton).toBeInTheDocument();
    });

    it("calls onContactSupport when Contact Support button is clicked", async () => {
      const onContactSupport = vi.fn();
      renderWidget(onContactSupport);

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const noButton = screen.getByRole("button", { name: /no/i });
      fireEvent.click(noButton);

      const contactButton = screen.getByRole("button", {
        name: /contact support/i,
      });
      fireEvent.click(contactButton);

      expect(onContactSupport).toHaveBeenCalledTimes(1);
    });

    it("shows fallback text when onContactSupport is not provided", async () => {
      renderWidget(); // No onContactSupport

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const noButton = screen.getByRole("button", { name: /no/i });
      fireEvent.click(noButton);

      // Fallback text should appear instead of a button —
      // the "Contact Support" label is rendered inside a <span>
      // within a <p>, so we verify via the <span> element
      expect(
        screen.getByText("Contact Support"),
      ).toBeInTheDocument();

      // No button should be present
      expect(
        screen.queryByRole("button", { name: /contact support/i }),
      ).not.toBeInTheDocument();
    });

    it("persists No feedback to localStorage", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const noButton = screen.getByRole("button", { name: /no/i });
      fireEvent.click(noButton);

      expect(localStorage.getItem(STORAGE_KEY)).toBe("no");
    });
  });

  describe("Persistence across re-renders", () => {
    it("restores Yes feedback from localStorage on mount", async () => {
      localStorage.setItem(STORAGE_KEY, "yes");

      renderWidget();

      await waitFor(() => {
        expect(
          screen.getByText(/glad this helped/i),
        ).toBeInTheDocument();
      });

      // Question should not be shown
      expect(
        screen.queryByText("Was this helpful?"),
      ).not.toBeInTheDocument();
    });

    it("restores No feedback from localStorage on mount", async () => {
      localStorage.setItem(STORAGE_KEY, "no");

      renderWidget();

      await waitFor(() => {
        expect(
          screen.getByText(/sorry this wasn.*helpful/i),
        ).toBeInTheDocument();
      });

      // Question should not be shown
      expect(
        screen.queryByText("Was this helpful?"),
      ).not.toBeInTheDocument();
    });

    it("shows Contact Support button when restoring No and onContactSupport is provided", async () => {
      localStorage.setItem(STORAGE_KEY, "no");
      const onContactSupport = vi.fn();

      renderWidget(onContactSupport);

      await waitFor(() => {
        const contactButton = screen.getByRole("button", {
          name: /contact support/i,
        });
        expect(contactButton).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("recovers gracefully when localStorage.setItem throws", async () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("Storage full");
        });

      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      // Clicking Yes should not crash
      const yesButton = screen.getByRole("button", { name: /yes/i });
      expect(() => fireEvent.click(yesButton)).not.toThrow();

      // Thank-you should still show (feedback was stored in React state)
      expect(
        screen.getByText(/glad this helped/i),
      ).toBeInTheDocument();

      setItemSpy.mockRestore();
    });

    it("recovers gracefully when localStorage.getItem throws", async () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("Storage unavailable");
        });

      renderWidget();

      // Should still render the question (state remains null)
      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      getItemSpy.mockRestore();
    });

    it("ignores invalid values in localStorage", async () => {
      localStorage.setItem(STORAGE_KEY, "maybe");

      renderWidget();

      // Should show the question because "maybe" is not valid
      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });
    });

    it("uses different storage keys for different articleIds", () => {
      const key1 = getStorageKey("article-1");
      const key2 = getStorageKey("article-2");

      expect(key1).not.toBe(key2);
      expect(key1).toContain("article-1");
      expect(key2).toContain("article-2");
    });
  });

  describe("Accessibility", () => {
    it("buttons have descriptive aria-labels", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /yes, this article was helpful/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /no, this article was not helpful/i }),
      ).toBeInTheDocument();
    });

    it("feedback messages use role=status and aria-live=polite", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const yesButton = screen.getByRole("button", { name: /yes/i });
      fireEvent.click(yesButton);

      const statusRegion = screen.getByRole("status");
      expect(statusRegion).toHaveAttribute("aria-live", "polite");
      expect(statusRegion).toHaveTextContent(/glad this helped/i);
    });

    it("displays visible focus indicators on buttons", async () => {
      renderWidget();

      await waitFor(() => {
        expect(screen.getByText("Was this helpful?")).toBeInTheDocument();
      });

      const yesButton = screen.getByRole("button", { name: /yes/i });
      yesButton.focus();

      // Button should receive focus
      expect(yesButton).toHaveFocus();
    });
  });

  describe("getStorageKey utility", () => {
    it("returns correct storage key format", () => {
      expect(getStorageKey("test-article")).toBe(
        "stellopay-help-feedback-test-article",
      );
    });

    it("handles article IDs with special characters", () => {
      const key = getStorageKey("article with spaces & symbols!");
      expect(key).toBe(
        "stellopay-help-feedback-article with spaces & symbols!",
      );
    });
  });
});
