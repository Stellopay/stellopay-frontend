import {
  PERMISSION_MATRIX,
  PERMISSIONS,
  ROLES,
  type PendingInvite,
  type Permission,
  type PermissionActionState,
  type TeamMember,
  type TeamRole,
} from "@/types/team";
import { isValidEmail } from "@/utils/authUtils";

export { PERMISSION_MATRIX, PERMISSIONS, ROLES };
export type { Permission, PermissionActionState, TeamMember, TeamRole, PendingInvite };

const PERMISSION_LABELS: Readonly<Record<Permission, string>> = {
  [PERMISSIONS.TEAM_VIEW]: "view team members",
  [PERMISSIONS.TEAM_INVITE]: "invite team members",
  [PERMISSIONS.TEAM_CHANGE_ROLE]: "change member roles",
  [PERMISSIONS.TEAM_REMOVE_MEMBER]: "remove team members",
  [PERMISSIONS.TEAM_REVOKE_INVITE]: "revoke pending invitations",
  [PERMISSIONS.TEAM_RESEND_INVITE]: "resend pending invitations",
  [PERMISSIONS.PAYROLL_RUN]: "run payroll",
  [PERMISSIONS.PAYROLL_VIEW]: "view payroll activity",
  [PERMISSIONS.WALLETS_MANAGE]: "manage connected wallets",
  [PERMISSIONS.SETTINGS_MANAGE]: "modify workspace settings",
  [PERMISSIONS.SECURITY_MANAGE]: "modify workspace security controls",
  [PERMISSIONS.STATEMENTS_EXPORT]: "export financial statements",
};

/**
 * Checks whether a given role grants the requested permission.
 */
export function can(role: TeamRole, permission: Permission): boolean {
  const allowed = PERMISSION_MATRIX[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

/**
 * Returns a UI-ready action state with `enabled` and an explanatory `reason`
 * string when an action is forbidden for the given role (consistent with
 * WalletActionState.reason).
 */
export function getPermissionActionState(
  role: TeamRole,
  permission: Permission,
): PermissionActionState {
  if (can(role, permission)) {
    return {
      enabled: true,
      reason: `Your ${role} role permits this action.`,
    };
  }

  const label = PERMISSION_LABELS[permission] ?? permission;
  return {
    enabled: false,
    reason: `Your current role (${role}) cannot ${label}. Contact an Owner or Admin to request access.`,
  };
}

/**
 * Counts how many members currently hold the `Owner` role.
 */
export function countOwners(members: readonly Pick<TeamMember, "role">[]): number {
  return members.filter((m) => m.role === "Owner").length;
}

/**
 * Pure helper that determines whether the specified member is the last remaining
 * Owner in the workspace.
 */
export function isLastOwner(
  members: readonly Pick<TeamMember, "id" | "role">[],
  targetMemberId: string,
): boolean {
  const target = members.find((m) => m.id === targetMemberId);
  if (!target || target.role !== "Owner") {
    return false;
  }
  return countOwners(members) <= 1;
}

/**
 * Validates whether a member can be removed from the workspace.
 * Prevents removing the last Owner and checks role permissions.
 */
export function canRemoveMember(
  members: readonly Pick<TeamMember, "id" | "role">[],
  targetMemberId: string,
  actorRole: TeamRole = "Owner",
): PermissionActionState {
  const permState = getPermissionActionState(
    actorRole,
    PERMISSIONS.TEAM_REMOVE_MEMBER,
  );
  if (!permState.enabled) {
    return permState;
  }

  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    return {
      enabled: false,
      reason: "Member not found.",
    };
  }

  if (actorRole !== "Owner" && target.role === "Owner") {
    return {
      enabled: false,
      reason: "Only an Owner can remove another Owner.",
    };
  }

  if (isLastOwner(members, targetMemberId)) {
    return {
      enabled: false,
      reason:
        "Cannot remove the last Owner. Assign another member as Owner first.",
    };
  }

  return {
    enabled: true,
    reason: "Member can be removed.",
  };
}

/**
 * Validates whether a member's role can be changed to `nextRole`.
 * Prevents demoting the last Owner and checks role permissions.
 */
export function canChangeMemberRole(
  members: readonly Pick<TeamMember, "id" | "role">[],
  targetMemberId: string,
  nextRole: TeamRole,
  actorRole: TeamRole = "Owner",
): PermissionActionState {
  const permState = getPermissionActionState(
    actorRole,
    PERMISSIONS.TEAM_CHANGE_ROLE,
  );
  if (!permState.enabled) {
    return permState;
  }

  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    return {
      enabled: false,
      reason: "Member not found.",
    };
  }

  if (actorRole !== "Owner" && (target.role === "Owner" || nextRole === "Owner")) {
    return {
      enabled: false,
      reason: "Only an Owner can assign or modify the Owner role.",
    };
  }

  if (
    target.role === "Owner" &&
    nextRole !== "Owner" &&
    isLastOwner(members, targetMemberId)
  ) {
    return {
      enabled: false,
      reason:
        "Cannot demote the last Owner. Promote another member to Owner first.",
    };
  }

  return {
    enabled: true,
    reason: "Role change is permitted.",
  };
}

/**
 * Pure validation helper for inviting a new team member by email.
 * Checks email format and rejects duplicate active members or pending invites
 * (case-insensitive).
 */
export function validateInviteEmail(
  email: string,
  members: readonly Pick<TeamMember, "email">[],
  pendingInvites: readonly Pick<PendingInvite, "email">[],
): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email address is required.";
  }

  if (!isValidEmail(trimmed)) {
    return "Please enter a valid email address.";
  }

  const normalized = trimmed.toLowerCase();

  if (members.some((m) => m.email.trim().toLowerCase() === normalized)) {
    return "This email belongs to an existing team member.";
  }

  if (pendingInvites.some((inv) => inv.email.trim().toLowerCase() === normalized)) {
    return "An invitation is already pending for this email address.";
  }

  return null;
}
