import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuditLogTab from "./audit-log-tab";
import { AuditEvent } from "@/types/audit";
import * as auditLogModule from "@/lib/audit-log";
import { safeStorage } from "@/utils/safeStorage";

describe("AuditLogTab component", () => {
  beforeEach(() => {
    safeStorage.removeItem(auditLogModule.AUDIT_LOG_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleEvents: AuditEvent[] = [
    {
      id: "evt-1",
      timestamp: "2026-11-24T10:00:00.000Z",
      type: "wallet_connected",
      summary: "Connected wallet GA4GYK...ABH4GJ",
      details: { address: "GA4GYK...ABH4GJ", network: "testnet" },
    },
    {
      id: "evt-2",
      timestamp: "2026-11-24T11:00:00.000Z",
      type: "password_changed",
      summary: "Account password changed successfully",
    },
    {
      id: "evt-3",
      timestamp: "2026-11-24T12:00:00.000Z",
      type: "two_factor_enabled",
      summary: "Two-factor authentication enabled",
    },
    {
      id: "evt-4",
      timestamp: "2026-11-24T13:00:00.000Z",
      type: "api_key_created",
      summary: 'Created API key "Reporting Service"',
      details: { keyName: "Reporting Service" },
    },
  ];

  it("renders the empty state when no events are recorded", () => {
    render(<AuditLogTab initialEvents={[]} />);

    expect(screen.getByText(/no audit events recorded/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Security-sensitive actions like wallet connections/i),
    ).toBeInTheDocument();
  });

  it("renders a list of audit events with badges and summaries", () => {
    render(<AuditLogTab initialEvents={sampleEvents} />);

    expect(screen.getByText("Connected wallet GA4GYK...ABH4GJ")).toBeInTheDocument();
    expect(screen.getByText("Account password changed successfully")).toBeInTheDocument();
    expect(screen.getByText("Two-factor authentication enabled")).toBeInTheDocument();
    expect(screen.getByText('Created API key "Reporting Service"')).toBeInTheDocument();

    expect(screen.getByText("Wallet Connected")).toBeInTheDocument();
    expect(screen.getByText("Password Changed")).toBeInTheDocument();
    expect(screen.getByText("2FA Enabled")).toBeInTheDocument();
    expect(screen.getByText("API Key Created")).toBeInTheDocument();
  });

  it("filters events by search query", async () => {
    const user = userEvent.setup();
    render(<AuditLogTab initialEvents={sampleEvents} />);

    const searchInput = screen.getByLabelText(/filter audit events by keyword/i);
    await user.type(searchInput, "Reporting");

    expect(screen.getByText('Created API key "Reporting Service"')).toBeInTheDocument();
    expect(screen.queryByText("Account password changed successfully")).not.toBeInTheDocument();
  });

  it("filters events by event type select dropdown", async () => {
    render(<AuditLogTab initialEvents={sampleEvents} />);

    const typeSelect = screen.getByLabelText(/filter by event type/i);
    fireEvent.change(typeSelect, { target: { value: "password_changed" } });

    expect(screen.getByText("Account password changed successfully")).toBeInTheDocument();
    expect(screen.queryByText("Wallet Connected")).not.toBeInTheDocument();
  });

  it("paginates events when there are more than 10 events", () => {
    const manyEvents: AuditEvent[] = Array.from({ length: 25 }, (_, i) => ({
      id: `evt-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      type: "wallet_connected",
      summary: `Wallet event ${i + 1}`,
    }));

    render(<AuditLogTab initialEvents={manyEvents} />);

    // First page should show 10 events
    expect(screen.getByText("Wallet event 1")).toBeInTheDocument();
    expect(screen.getByText("Wallet event 10")).toBeInTheDocument();
    expect(screen.queryByText("Wallet event 11")).not.toBeInTheDocument();

    // Click next page
    const nextBtn = screen.getByLabelText(/go to next page/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText("Wallet event 11")).toBeInTheDocument();
    expect(screen.queryByText("Wallet event 1")).not.toBeInTheDocument();
  });

  it("handles CSV export button click", () => {
    const downloadSpy = vi
      .spyOn(auditLogModule, "downloadAuditEventsCsv")
      .mockImplementation(() => {});

    render(<AuditLogTab initialEvents={sampleEvents} />);

    const exportBtn = screen.getByLabelText(/export audit log to csv/i);
    fireEvent.click(exportBtn);

    expect(downloadSpy).toHaveBeenCalledWith(sampleEvents);
    expect(
      screen.getByText(/Audit log CSV exported successfully/i),
    ).toBeInTheDocument();
  });

  it("recovers gracefully from corrupt storage on mount", () => {
    safeStorage.setItem(auditLogModule.AUDIT_LOG_STORAGE_KEY, "corrupt{{json");

    expect(() => render(<AuditLogTab />)).not.toThrow();
    expect(screen.getByText(/no audit events recorded/i)).toBeInTheDocument();
  });
});
