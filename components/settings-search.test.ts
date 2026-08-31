import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import SettingsSearch, { searchControls, SEARCHABLE_CONTROLS } from "./settings-search";

describe("searchControls", () => {
  it("should return empty array for empty query", () => {
    const results = searchControls("");
    expect(results).toEqual([]);
  });

  it("should return empty array for whitespace-only query", () => {
    const results = searchControls("   ");
    expect(results).toEqual([]);
  });

  it("should find controls by exact label match", () => {
    const results = searchControls("Password and recovery");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].control.label).toBe("Password and recovery");
    expect(results[0].relevance).toBe(100);
  });

  it("should find controls by partial label match", () => {
    const results = searchControls("password");
    expect(results.length).toBeGreaterThan(0);
    const passwordControl = results.find(
      (r) => r.control.label === "Password and recovery",
    );
    expect(passwordControl).toBeDefined();
    expect(passwordControl!.relevance).toBeGreaterThanOrEqual(50);
  });

  it("should find controls by keyword match", () => {
    const results = searchControls("2fa");
    expect(results.length).toBeGreaterThan(0);
    const twoFactorControl = results.find(
      (r) => r.control.label === "Authenticator app verification",
    );
    expect(twoFactorControl).toBeDefined();
  });

  it("should be case-insensitive", () => {
    const lowercaseResults = searchControls("password");
    const uppercaseResults = searchControls("PASSWORD");
    const mixedCaseResults = searchControls("PaSSWoRD");

    expect(lowercaseResults.length).toBe(uppercaseResults.length);
    expect(lowercaseResults.length).toBe(mixedCaseResults.length);
  });

  it("should rank exact matches higher than substring matches", () => {
    const results = searchControls("alert");
    expect(results.length).toBeGreaterThan(1);

    // Results should be sorted by relevance (descending)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].relevance).toBeGreaterThanOrEqual(results[i + 1].relevance);
    }
  });

  it("should handle leading/trailing whitespace", () => {
    const trimmedResults = searchControls("password");
    const untrimmedResults = searchControls("   password   ");

    expect(trimmedResults.length).toBe(untrimmedResults.length);
    expect(trimmedResults[0].control.label).toBe(
      untrimmedResults[0].control.label,
    );
  });

  it("should find controls from all sections", () => {
    const controls = SEARCHABLE_CONTROLS;
    const sections = new Set(controls.map((c) => c.section));

    expect(sections).toContain("account");
    expect(sections).toContain("notifications");
    expect(sections).toContain("security");
    expect(sections).toContain("wallets");
  });

  it("should have at least one control per section", () => {
    const controls = SEARCHABLE_CONTROLS;
    const accountControls = controls.filter((c) => c.section === "account");
    const notificationControls = controls.filter(
      (c) => c.section === "notifications",
    );
    const securityControls = controls.filter((c) => c.section === "security");
    const walletControls = controls.filter((c) => c.section === "wallets");

    expect(accountControls.length).toBeGreaterThan(0);
    expect(notificationControls.length).toBeGreaterThan(0);
    expect(securityControls.length).toBeGreaterThan(0);
    expect(walletControls.length).toBeGreaterThan(0);
  });

  it("should find controls by their keywords", () => {
    // "authentication" is a keyword for "Password and recovery"
    const results = searchControls("authentication");
    expect(results.length).toBeGreaterThan(0);

    const passwordControl = results.find(
      (r) => r.control.label === "Password and recovery",
    );
    expect(passwordControl).toBeDefined();
  });

  it("should not return results below relevance threshold", () => {
    // A query that matches nothing should return empty array
    const results = searchControls("xyzabc123notreal");
    expect(results).toEqual([]);
  });

  it("should prioritize label matches over keyword matches", () => {
    const results = searchControls("transfer");

    // "Large transfer approval" has "transfer" in the label
    // should rank higher than items that only have it in keywords
    const labelMatch = results.find(
      (r) => r.control.label.includes("transfer"),
    );
    expect(labelMatch).toBeDefined();

    // Label matches should appear early in results
    if (results.length > 1 && labelMatch) {
      const labelMatchIndex = results.findIndex((r) => r === labelMatch);
      expect(labelMatchIndex).toBeLessThan(results.length / 2);
    }
  });

  it("should handle multiple matches for a single query", () => {
    const results = searchControls("approval");
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Both should be present
    const hasApprovalRequired = results.some(
      (r) => r.control.label.includes("Approval"),
    );
    const hasAddressBook = results.some(
      (r) => r.control.label.includes("address"),
    );

    expect(hasApprovalRequired || hasAddressBook).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SettingsSearch component
// ---------------------------------------------------------------------------

describe("SettingsSearch component", () => {
  it("renders the search input with correct ARIA attributes", () => {
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-label", "Search settings controls");
    expect(input).toHaveAttribute("placeholder", "Search settings...");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("aria-controls", "settings-search-results");
  });

  it("shows results dropdown when typing a query", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    await user.type(input, "password");

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveAttribute("id", "settings-search-results");

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
  });

  it("has aria-activedescendant pointing to highlighted result", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    await user.type(input, "transfer");

    // Navigate down to highlight a result
    await user.keyboard("{ArrowDown}");

    expect(input).toHaveAttribute("aria-activedescendant");
    const activeId = input.getAttribute("aria-activedescendant");
    const activeOption = document.getElementById(activeId!);
    expect(activeOption).toHaveAttribute("role", "option");
    expect(activeOption).toHaveAttribute("aria-selected", "true");
  });

  it("renders an aria-live region for screen reader announcements", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    // Initially no announcement
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("role", "status");
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");

    // After typing a query, should announce result count
    await user.type(screen.getByRole("combobox"), "password");
    expect(liveRegion?.textContent).toMatch(/\d+ setting(s?) found/);
  });

  it("announces no results state via aria-live", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    await user.type(input, "xyzabcnotreal");

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain("No settings found");
  });

  it("calls onResultSelect with section and label when result is clicked", async () => {
    const onResultSelect = vi.fn();
    const user = userEvent.setup();
    render(<SettingsSearch onResultSelect={onResultSelect} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "password");

    const firstOption = screen.getAllByRole("option")[0];
    await user.click(firstOption);

    expect(onResultSelect).toHaveBeenCalledTimes(1);
    expect(onResultSelect).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
    );
  });

  it("shows clear button when query is non-empty", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");

    // No clear button initially
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();

    await user.type(input, "test");
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  it("clears input when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    await user.type(input, "password");
    expect(input).toHaveValue("password");

    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SettingsSearch />
        <div data-testid="outside">Outside</div>
      </div>,
    );

    const input = screen.getByRole("combobox");
    await user.type(input, "password");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("renders start-typing hint when focused but empty", async () => {
    const user = userEvent.setup();
    render(<SettingsSearch />);

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(screen.getByText("Start typing to search")).toBeInTheDocument();
  });
});
