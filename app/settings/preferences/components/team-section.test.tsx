import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PermissionsProvider } from "@/context/permissions-context";
import { DEMO_PENDING_INVITES, DEMO_TEAM_MEMBERS } from "@/lib/demo-data";
import { searchControls } from "@/components/settings-search";
import TeamSection from "./team-section";

function renderTeamSection(
  initialRole: "Owner" | "Admin" | "Finance" | "Viewer" = "Owner",
) {
  return render(
    <PermissionsProvider initialRole={initialRole}>
      <TeamSection
        initialMembers={DEMO_TEAM_MEMBERS}
        initialPendingInvites={DEMO_PENDING_INVITES}
      />
    </PermissionsProvider>,
  );
}

describe("TeamSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders demo team members and pending invitations flagged as Demo Data", () => {
    renderTeamSection("Owner");

    expect(screen.getByTestId("team-placeholder-badge")).toHaveTextContent(
      "Demo Data",
    );
    expect(screen.getByText("Demo Owner (Placeholder)")).toBeInTheDocument();
    expect(screen.getByText("Demo Admin (Placeholder)")).toBeInTheDocument();
    expect(
      screen.getByText("pending.payroll.demo@example.com"),
    ).toBeInTheDocument();
  });

  it("validates email and rejects duplicates when inviting a member", async () => {
    renderTeamSection("Admin");

    fireEvent.click(screen.getByRole("button", { name: /invite member/i }));

    const dialog = screen.getByRole("dialog");
    const emailInput = within(dialog).getByLabelText(/invitee email address/i);
    const sendBtn = within(dialog).getByRole("button", {
      name: /send invite/i,
    });

    // 1. Invalid email format
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(sendBtn);
    expect(
      within(dialog).getByText(/please enter a valid email address/i),
    ).toBeInTheDocument();

    // 2. Duplicate active member email
    fireEvent.change(emailInput, {
      target: { value: "ADMIN.DEMO@EXAMPLE.COM" },
    });
    fireEvent.click(sendBtn);
    expect(
      within(dialog).getByText(/belongs to an existing team member/i),
    ).toBeInTheDocument();

    // 3. Duplicate pending invite email
    fireEvent.change(emailInput, {
      target: { value: "pending.payroll.demo@example.com" },
    });
    fireEvent.click(sendBtn);
    expect(
      within(dialog).getByText(/invitation is already pending/i),
    ).toBeInTheDocument();

    // 4. Valid new email succeeds and adds to pending invitations
    fireEvent.change(emailInput, {
      target: { value: "new.teammate@example.com" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^role$/i), {
      target: { value: "Finance" },
    });
    fireEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("new.teammate@example.com")).toBeInTheDocument();
  });

  it("supports resending and revoking pending invitations", () => {
    renderTeamSection("Admin");

    const resendBtn = screen.getByRole("button", {
      name: /resend invite to pending\.payroll\.demo@example\.com/i,
    });
    fireEvent.click(resendBtn);
    expect(screen.getByText(/\(Resent just now\)/i)).toBeInTheDocument();

    const revokeBtn = screen.getByRole("button", {
      name: /revoke invite for pending\.payroll\.demo@example\.com/i,
    });
    fireEvent.click(revokeBtn);
    expect(
      screen.queryByText("pending.payroll.demo@example.com"),
    ).not.toBeInTheDocument();
  });

  it("requires confirmation before changing a member's role", () => {
    renderTeamSection("Owner");

    const roleSelect = screen.getByLabelText(
      /role for demo finance lead \(placeholder\)/i,
    );
    expect(roleSelect).toHaveValue("Finance");

    fireEvent.change(roleSelect, { target: { value: "Admin" } });

    const confirmDialog = screen.getByRole("dialog");
    expect(
      within(confirmDialog).getByRole("heading", {
        name: /confirm role change/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(confirmDialog).getByRole("button", {
        name: /confirm role change/i,
      }),
    );

    expect(roleSelect).toHaveValue("Admin");
  });

  it("prevents removing or demoting the last Owner", () => {
    renderTeamSection("Owner");

    const ownerRoleSelect = screen.getByLabelText(
      /role for demo owner \(placeholder\)/i,
    );
    expect(ownerRoleSelect).toBeDisabled();

    const removeOwnerBtn = screen.getByRole("button", {
      name: /remove demo owner \(placeholder\)/i,
    });
    expect(removeOwnerBtn).toBeDisabled();
    expect(
      screen.getByTestId("remove-disabled-reason-member-owner-1"),
    ).toHaveTextContent(/cannot remove the last owner/i);
  });

  it("removes a non-Owner member via DestructiveActionDialog", async () => {
    renderTeamSection("Owner");

    const removeAdminBtn = screen.getByRole("button", {
      name: /remove demo admin \(placeholder\)/i,
    });
    fireEvent.click(removeAdminBtn);

    const dialog = screen.getByRole("dialog");
    const confirmInput = within(dialog).getByPlaceholderText("REMOVE");
    fireEvent.change(confirmInput, { target: { value: "REMOVE" } });

    const confirmBtn = within(dialog).getByRole("button", {
      name: /confirm removal/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() =>
      expect(
        screen.queryByTestId("member-row-member-admin-1"),
      ).not.toBeInTheDocument(),
    );
  });

  it("disables primary actions with an explanatory reason when viewing as Viewer or Finance", () => {
    renderTeamSection("Viewer");

    const inviteBtn = screen.getByRole("button", { name: /invite member/i });
    expect(inviteBtn).toBeDisabled();
    expect(screen.getByTestId("permission-denied-reason")).toHaveTextContent(
      /Your current role \(Viewer\) cannot invite team members/i,
    );
  });

  it("indexes Team section controls in SettingsSearch", () => {
    const inviteResults = searchControls("invite member");
    expect(inviteResults.length).toBeGreaterThan(0);
    expect(inviteResults[0].control.section).toBe("team");

    const roleResults = searchControls("role permissions");
    expect(roleResults.some((r) => r.control.section === "team")).toBe(true);
  });

  it("has no axe accessibility violations", async () => {
    const { container } = renderTeamSection("Owner");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
