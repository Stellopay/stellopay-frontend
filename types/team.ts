/**
 * @file team.ts
 * @description Types, roles, permissions, and permission matrix for team access control.
 */

export const ROLES = ["Owner", "Admin", "Finance", "Viewer"] as const;

export type TeamRole = (typeof ROLES)[number];

/**
 * Typed const map of permissions so TypeScript catches typos at compile time.
 */
export const PERMISSIONS = {
  TEAM_VIEW: "team:view",
  TEAM_INVITE: "team:invite",
  TEAM_CHANGE_ROLE: "team:change_role",
  TEAM_REMOVE_MEMBER: "team:remove_member",
  TEAM_REVOKE_INVITE: "team:revoke_invite",
  TEAM_RESEND_INVITE: "team:resend_invite",
  PAYROLL_RUN: "payroll:run",
  PAYROLL_VIEW: "payroll:view",
  WALLETS_MANAGE: "wallets:manage",
  SETTINGS_MANAGE: "settings:manage",
  SECURITY_MANAGE: "security:manage",
  STATEMENTS_EXPORT: "statements:export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Single-source-of-truth permission matrix mapping each role to its granted permissions.
 */
export const PERMISSION_MATRIX: Readonly<Record<TeamRole, readonly Permission[]>> = {
  Owner: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.TEAM_CHANGE_ROLE,
    PERMISSIONS.TEAM_REMOVE_MEMBER,
    PERMISSIONS.TEAM_REVOKE_INVITE,
    PERMISSIONS.TEAM_RESEND_INVITE,
    PERMISSIONS.PAYROLL_RUN,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.WALLETS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.SECURITY_MANAGE,
    PERMISSIONS.STATEMENTS_EXPORT,
  ],
  Admin: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.TEAM_CHANGE_ROLE,
    PERMISSIONS.TEAM_REMOVE_MEMBER,
    PERMISSIONS.TEAM_REVOKE_INVITE,
    PERMISSIONS.TEAM_RESEND_INVITE,
    PERMISSIONS.PAYROLL_RUN,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.WALLETS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.STATEMENTS_EXPORT,
  ],
  Finance: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PAYROLL_RUN,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.WALLETS_MANAGE,
    PERMISSIONS.STATEMENTS_EXPORT,
  ],
  Viewer: [
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PAYROLL_VIEW,
  ],
} as const;

export const ROLE_DESCRIPTIONS: Readonly<Record<TeamRole, string>> = {
  Owner: "Full workspace control, billing, security, and team administration.",
  Admin: "Manage team members, roles, wallets, payroll runs, and general settings.",
  Finance: "Run payroll, manage connected wallets, and export statements.",
  Viewer: "Read-only access to team members and payroll activity.",
} as const;

/**
 * Consistent with WalletActionState.reason: describes whether an action is
 * allowed and provides a clear explanation when disabled.
 */
export interface PermissionActionState {
  enabled: boolean;
  reason: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  isCurrentUser?: boolean;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedAt: string;
  invitedBy: string;
  lastSentAt?: string;
}
