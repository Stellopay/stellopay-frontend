import { describe, expect, it } from "vitest";
import {
  can,
  canChangeMemberRole,
  canRemoveMember,
  countOwners,
  getPermissionActionState,
  isLastOwner,
  PERMISSION_MATRIX,
  PERMISSIONS,
  ROLES,
  validateInviteEmail,
} from "./permissions";
import type { PendingInvite, TeamMember } from "@/types/team";

const sampleMembers: TeamMember[] = [
  {
    id: "m-owner-1",
    name: "Owner One",
    email: "owner1@example.com",
    role: "Owner",
    joinedAt: "2026-01-01",
  },
  {
    id: "m-admin-1",
    name: "Admin One",
    email: "admin1@example.com",
    role: "Admin",
    joinedAt: "2026-01-02",
  },
  {
    id: "m-finance-1",
    name: "Finance One",
    email: "finance1@example.com",
    role: "Finance",
    joinedAt: "2026-01-03",
  },
  {
    id: "m-viewer-1",
    name: "Viewer One",
    email: "viewer1@example.com",
    role: "Viewer",
    joinedAt: "2026-01-04",
  },
];

const samplePendingInvites: PendingInvite[] = [
  {
    id: "inv-1",
    email: "pending@example.com",
    role: "Finance",
    invitedAt: "2026-02-01",
    invitedBy: "owner1@example.com",
  },
];

describe("lib/permissions — role matrix & can()", () => {
  it("defines all four canonical roles", () => {
    expect(ROLES).toEqual(["Owner", "Admin", "Finance", "Viewer"]);
  });

  it("grants Owner every defined permission", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(can("Owner", permission)).toBe(true);
    }
  });

  it("grants Admin team management, payroll, wallet, and settings permissions, but not security:manage", () => {
    expect(can("Admin", PERMISSIONS.TEAM_VIEW)).toBe(true);
    expect(can("Admin", PERMISSIONS.TEAM_INVITE)).toBe(true);
    expect(can("Admin", PERMISSIONS.TEAM_CHANGE_ROLE)).toBe(true);
    expect(can("Admin", PERMISSIONS.TEAM_REMOVE_MEMBER)).toBe(true);
    expect(can("Admin", PERMISSIONS.TEAM_REVOKE_INVITE)).toBe(true);
    expect(can("Admin", PERMISSIONS.TEAM_RESEND_INVITE)).toBe(true);
    expect(can("Admin", PERMISSIONS.PAYROLL_RUN)).toBe(true);
    expect(can("Admin", PERMISSIONS.WALLETS_MANAGE)).toBe(true);
    expect(can("Admin", PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    expect(can("Admin", PERMISSIONS.SECURITY_MANAGE)).toBe(false);
  });

  it("grants Finance payroll, wallet, statement export, and team view permissions, but not team mutation", () => {
    expect(can("Finance", PERMISSIONS.TEAM_VIEW)).toBe(true);
    expect(can("Finance", PERMISSIONS.PAYROLL_RUN)).toBe(true);
    expect(can("Finance", PERMISSIONS.PAYROLL_VIEW)).toBe(true);
    expect(can("Finance", PERMISSIONS.WALLETS_MANAGE)).toBe(true);
    expect(can("Finance", PERMISSIONS.STATEMENTS_EXPORT)).toBe(true);

    expect(can("Finance", PERMISSIONS.TEAM_INVITE)).toBe(false);
    expect(can("Finance", PERMISSIONS.TEAM_CHANGE_ROLE)).toBe(false);
    expect(can("Finance", PERMISSIONS.TEAM_REMOVE_MEMBER)).toBe(false);
    expect(can("Finance", PERMISSIONS.TEAM_REVOKE_INVITE)).toBe(false);
    expect(can("Finance", PERMISSIONS.TEAM_RESEND_INVITE)).toBe(false);
  });

  it("grants Viewer read-only permissions only", () => {
    expect(can("Viewer", PERMISSIONS.TEAM_VIEW)).toBe(true);
    expect(can("Viewer", PERMISSIONS.PAYROLL_VIEW)).toBe(true);

    expect(can("Viewer", PERMISSIONS.TEAM_INVITE)).toBe(false);
    expect(can("Viewer", PERMISSIONS.TEAM_CHANGE_ROLE)).toBe(false);
    expect(can("Viewer", PERMISSIONS.TEAM_REMOVE_MEMBER)).toBe(false);
    expect(can("Viewer", PERMISSIONS.PAYROLL_RUN)).toBe(false);
    expect(can("Viewer", PERMISSIONS.WALLETS_MANAGE)).toBe(false);
    expect(can("Viewer", PERMISSIONS.STATEMENTS_EXPORT)).toBe(false);
  });

  it("keeps PERMISSION_MATRIX aligned with can() across all roles and permissions", () => {
    for (const role of ROLES) {
      for (const perm of Object.values(PERMISSIONS)) {
        expect(can(role, perm)).toBe(PERMISSION_MATRIX[role].includes(perm));
      }
    }
  });

  it("returns an explanatory reason when getPermissionActionState is forbidden", () => {
    const allowedState = getPermissionActionState(
      "Admin",
      PERMISSIONS.TEAM_INVITE,
    );
    expect(allowedState.enabled).toBe(true);

    const deniedState = getPermissionActionState(
      "Viewer",
      PERMISSIONS.TEAM_INVITE,
    );
    expect(deniedState.enabled).toBe(false);
    expect(deniedState.reason).toMatch(/Viewer/i);
    expect(deniedState.reason).toMatch(/invite team members/i);
  });
});

describe("lib/permissions — last-Owner protection", () => {
  it("counts Owners and detects the last Owner accurately", () => {
    expect(countOwners(sampleMembers)).toBe(1);
    expect(isLastOwner(sampleMembers, "m-owner-1")).toBe(true);
    expect(isLastOwner(sampleMembers, "m-admin-1")).toBe(false);

    const twoOwners: TeamMember[] = [
      ...sampleMembers,
      {
        id: "m-owner-2",
        name: "Owner Two",
        email: "owner2@example.com",
        role: "Owner",
        joinedAt: "2026-01-05",
      },
    ];
    expect(countOwners(twoOwners)).toBe(2);
    expect(isLastOwner(twoOwners, "m-owner-1")).toBe(false);
    expect(isLastOwner(twoOwners, "m-owner-2")).toBe(false);
  });

  it("prevents removing the last Owner", () => {
    const result = canRemoveMember(sampleMembers, "m-owner-1", "Owner");
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/last Owner/i);
  });

  it("allows removing an Owner when another Owner exists", () => {
    const twoOwners: TeamMember[] = [
      ...sampleMembers,
      {
        id: "m-owner-2",
        name: "Owner Two",
        email: "owner2@example.com",
        role: "Owner",
        joinedAt: "2026-01-05",
      },
    ];
    const result = canRemoveMember(twoOwners, "m-owner-1", "Owner");
    expect(result.enabled).toBe(true);
  });

  it("prevents a non-Owner (e.g. Admin) from removing an Owner even if multiple Owners exist", () => {
    const twoOwners: TeamMember[] = [
      ...sampleMembers,
      {
        id: "m-owner-2",
        name: "Owner Two",
        email: "owner2@example.com",
        role: "Owner",
        joinedAt: "2026-01-05",
      },
    ];
    const result = canRemoveMember(twoOwners, "m-owner-1", "Admin");
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/Only an Owner/i);
  });

  it("prevents roles without TEAM_REMOVE_MEMBER from removing anyone", () => {
    const result = canRemoveMember(sampleMembers, "m-viewer-1", "Finance");
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/Finance/i);
  });

  it("prevents demoting the last Owner", () => {
    const result = canChangeMemberRole(
      sampleMembers,
      "m-owner-1",
      "Admin",
      "Owner",
    );
    expect(result.enabled).toBe(false);
    expect(result.reason).toMatch(/demote the last Owner/i);
  });

  it("allows demoting an Owner when another Owner exists", () => {
    const twoOwners: TeamMember[] = [
      ...sampleMembers,
      {
        id: "m-owner-2",
        name: "Owner Two",
        email: "owner2@example.com",
        role: "Owner",
        joinedAt: "2026-01-05",
      },
    ];
    const result = canChangeMemberRole(
      twoOwners,
      "m-owner-1",
      "Admin",
      "Owner",
    );
    expect(result.enabled).toBe(true);
  });

  it("allows changing non-Owner roles when actor has permission", () => {
    const result = canChangeMemberRole(
      sampleMembers,
      "m-finance-1",
      "Admin",
      "Admin",
    );
    expect(result.enabled).toBe(true);
  });
});

describe("lib/permissions — validateInviteEmail()", () => {
  it("rejects empty or malformed email addresses", () => {
    expect(
      validateInviteEmail("   ", sampleMembers, samplePendingInvites),
    ).toMatch(/required/i);
    expect(
      validateInviteEmail("not-an-email", sampleMembers, samplePendingInvites),
    ).toMatch(/valid email/i);
  });

  it("rejects duplicate emails matching an existing member (case-insensitive)", () => {
    expect(
      validateInviteEmail(
        "ADMIN1@EXAMPLE.COM",
        sampleMembers,
        samplePendingInvites,
      ),
    ).toMatch(/existing team member/i);
  });

  it("rejects duplicate emails matching a pending invitation (case-insensitive)", () => {
    expect(
      validateInviteEmail(
        "  Pending@Example.com ",
        sampleMembers,
        samplePendingInvites,
      ),
    ).toMatch(/already pending/i);
  });

  it("accepts a valid new email address", () => {
    expect(
      validateInviteEmail(
        "new.hire@example.com",
        sampleMembers,
        samplePendingInvites,
      ),
    ).toBeNull();
  });
});
