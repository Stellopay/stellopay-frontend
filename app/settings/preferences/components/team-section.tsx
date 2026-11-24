"use client";

import React, { useState } from "react";
import { Mail, RefreshCw, Shield, UserPlus, Users, XCircle } from "lucide-react";
import EmailInput from "@/components/common/email-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Can, usePermission } from "@/context/permissions-context";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { DEMO_PENDING_INVITES, DEMO_TEAM_MEMBERS } from "@/lib/demo-data";
import {
  canChangeMemberRole,
  canRemoveMember,
  PERMISSIONS,
  ROLES,
  validateInviteEmail,
} from "@/lib/permissions";
import {
  ROLE_DESCRIPTIONS,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from "@/types/team";
import DestructiveActionDialog from "./destructive-action-dialog";

export interface TeamSectionProps {
  initialMembers?: readonly TeamMember[];
  initialPendingInvites?: readonly PendingInvite[];
  onMembersChange?: (members: TeamMember[]) => void;
  onPendingInvitesChange?: (invites: PendingInvite[]) => void;
  highlightedSearchLabel?: string | null;
}

interface PendingRoleChange {
  member: TeamMember;
  nextRole: TeamRole;
}

export default function TeamSection({
  initialMembers = DEMO_TEAM_MEMBERS,
  initialPendingInvites = DEMO_PENDING_INVITES,
  onMembersChange,
  onPendingInvitesChange,
  highlightedSearchLabel,
}: TeamSectionProps) {
  useSearchHighlight(highlightedSearchLabel ?? null);
  const { role: currentUserRole, setRole: setCurrentUserRole, getActionState } =
    usePermission();

  const [members, setMembers] = useState<TeamMember[]>(() => [
    ...initialMembers,
  ]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(() => [
    ...initialPendingInvites,
  ]);

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("Finance");
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Role change confirmation dialog state
  const [pendingRoleChange, setPendingRoleChange] =
    useState<PendingRoleChange | null>(null);

  // Status banner state for feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const updateMembers = (next: TeamMember[]) => {
    setMembers(next);
    onMembersChange?.(next);
  };

  const updatePendingInvites = (next: PendingInvite[]) => {
    setPendingInvites(next);
    onPendingInvitesChange?.(next);
  };

  const handleOpenInvite = () => {
    setInviteEmail("");
    setInviteRole("Finance");
    setInviteError(null);
    setIsInviteOpen(true);
  };

  const handleInviteSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateInviteEmail(
      inviteEmail,
      members,
      pendingInvites,
    );
    if (validationError) {
      setInviteError(validationError);
      return;
    }

    const trimmedEmail = inviteEmail.trim();
    const newInvite: PendingInvite = {
      id: `invite-${Date.now()}`,
      email: trimmedEmail,
      role: inviteRole,
      invitedAt: "Just now",
      invitedBy:
        members.find((m) => m.isCurrentUser)?.email ?? "owner.demo@example.com",
    };

    const nextInvites = [newInvite, ...pendingInvites];
    updatePendingInvites(nextInvites);
    setIsInviteOpen(false);
    setInviteEmail("");
    setInviteError(null);
    setStatusMessage(`Invitation sent to ${trimmedEmail} as ${inviteRole}.`);
  };

  const handleSelectRoleChange = (member: TeamMember, nextRole: TeamRole) => {
    if (member.role === nextRole) return;
    const check = canChangeMemberRole(
      members,
      member.id,
      nextRole,
      currentUserRole,
    );
    if (!check.enabled) {
      setStatusMessage(check.reason);
      return;
    }
    setPendingRoleChange({ member, nextRole });
  };

  const handleConfirmRoleChange = () => {
    if (!pendingRoleChange) return;
    const { member, nextRole } = pendingRoleChange;

    const check = canChangeMemberRole(
      members,
      member.id,
      nextRole,
      currentUserRole,
    );
    if (!check.enabled) {
      setStatusMessage(check.reason);
      setPendingRoleChange(null);
      return;
    }

    const nextMembers = members.map((m) =>
      m.id === member.id ? { ...m, role: nextRole } : m,
    );
    updateMembers(nextMembers);
    setPendingRoleChange(null);
    setStatusMessage(`Updated ${member.name}'s role to ${nextRole}.`);
  };

  const handleRemoveMember = (member: TeamMember) => {
    const check = canRemoveMember(members, member.id, currentUserRole);
    if (!check.enabled) {
      setStatusMessage(check.reason);
      return;
    }
    const nextMembers = members.filter((m) => m.id !== member.id);
    updateMembers(nextMembers);
    setStatusMessage(`Removed ${member.name} from the team.`);
  };

  const handleResendInvite = (invite: PendingInvite) => {
    const perm = getActionState(PERMISSIONS.TEAM_RESEND_INVITE);
    if (!perm.enabled) {
      setStatusMessage(perm.reason);
      return;
    }
    const nextInvites = pendingInvites.map((item) =>
      item.id === invite.id ? { ...item, lastSentAt: "Resent just now" } : item,
    );
    updatePendingInvites(nextInvites);
    setStatusMessage(`Resent invitation to ${invite.email}.`);
  };

  const handleRevokeInvite = (invite: PendingInvite) => {
    const perm = getActionState(PERMISSIONS.TEAM_REVOKE_INVITE);
    if (!perm.enabled) {
      setStatusMessage(perm.reason);
      return;
    }
    const nextInvites = pendingInvites.filter((item) => item.id !== invite.id);
    updatePendingInvites(nextInvites);
    setStatusMessage(`Revoked invitation for ${invite.email}.`);
  };

  const roleChangePermState = getActionState(PERMISSIONS.TEAM_CHANGE_ROLE);

  return (
    <div className="space-y-6" data-testid="team-section">
      {/* Header & Role Preview Switcher */}
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader className="border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1" data-search-label="Team members">
              <CardTitle className="flex flex-wrap items-center gap-3 font-general text-2xl text-zinc-950 dark:text-white">
                Team & permissions
                <span
                  data-testid="team-placeholder-badge"
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                >
                  Demo Data
                </span>
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                Invite team members, assign payroll and treasury roles, and
                review workspace access. UI role checks are advisory until
                backend enforcement is connected.
              </CardDescription>
            </div>

            <div data-search-label="Invite member">
              <Can permission={PERMISSIONS.TEAM_INVITE} mode="disable">
                <Button
                  type="button"
                  onClick={handleOpenInvite}
                  className="gap-2"
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Invite member
                </Button>
              </Can>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Role Simulator Bar so users/tests can verify how UI affordances adapt */}
          <div
            data-search-label="Role permissions"
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <Shield className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Viewing as role:{" "}
                  <span className="font-semibold">{currentUserRole}</span>
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {ROLE_DESCRIPTIONS[currentUserRole]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor="current-role-selector"
                className="text-xs font-medium whitespace-nowrap text-zinc-700 dark:text-zinc-300"
              >
                Preview role
              </Label>
              <select
                id="current-role-selector"
                aria-label="Preview role"
                value={currentUserRole}
                onChange={(e) =>
                  setCurrentUserRole(e.target.value as TeamRole)
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {statusMessage ? (
            <div
              role="status"
              aria-live="polite"
              data-testid="team-status-message"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
            >
              {statusMessage}
            </div>
          ) : null}

          {/* Active Members Table */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Active members ({members.length})
            </h3>

            <Table aria-label="Team members">
              <TableCaption>
                Workspace members and their assigned payroll permissions role.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Member</TableHead>
                  <TableHead scope="col">Role</TableHead>
                  <TableHead scope="col">Joined</TableHead>
                  <TableHead scope="col" className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const removeCheck = canRemoveMember(
                    members,
                    member.id,
                    currentUserRole,
                  );
                  const isSoleOwner =
                    member.role === "Owner" &&
                    members.filter((m) => m.role === "Owner").length <= 1;

                  const canEditThisMemberRole =
                    roleChangePermState.enabled &&
                    !(currentUserRole !== "Owner" && member.role === "Owner") &&
                    !isSoleOwner;

                  const roleDisabledReason = !roleChangePermState.enabled
                    ? roleChangePermState.reason
                    : isSoleOwner
                      ? "Cannot demote the last Owner. Promote another member to Owner first."
                      : currentUserRole !== "Owner" && member.role === "Owner"
                        ? "Only an Owner can assign or modify the Owner role."
                        : "";

                  return (
                    <TableRow
                      key={member.id}
                      data-testid={`member-row-${member.id}`}
                    >
                      <TableCell>
                        <div className="font-medium text-zinc-950 dark:text-white">
                          {member.name}
                          {member.isCurrentUser ? (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {member.email}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <select
                            aria-label={`Role for ${member.name}`}
                            value={member.role}
                            disabled={!canEditThisMemberRole}
                            title={
                              !canEditThisMemberRole
                                ? roleDisabledReason
                                : undefined
                            }
                            onChange={(e) =>
                              handleSelectRoleChange(
                                member,
                                e.target.value as TeamRole,
                              )
                            }
                            className="h-9 w-36 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:text-white"
                          >
                            {ROLES.map((r) => (
                              <option
                                key={r}
                                value={r}
                                disabled={
                                  currentUserRole !== "Owner" && r === "Owner"
                                }
                              >
                                {r}
                              </option>
                            ))}
                          </select>
                          {!canEditThisMemberRole && roleDisabledReason ? (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {roleDisabledReason}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-zinc-600 dark:text-zinc-300">
                        {member.joinedAt}
                      </TableCell>

                      <TableCell className="text-right">
                        {removeCheck.enabled ? (
                          <DestructiveActionDialog
                            triggerLabel={`Remove ${member.name}`}
                            title={`Remove ${member.name}?`}
                            description={`This immediately revokes ${member.email}'s access to this StelloPay workspace.`}
                            impactItems={[
                              `${member.name} (${member.role}) will lose access to payroll runs and settings.`,
                              "Any pending approvals assigned to this member must be reassigned.",
                            ]}
                            confirmationToken="REMOVE"
                            confirmationLabel={`Confirm removing ${member.name}`}
                            confirmLabel="Confirm removal"
                            onConfirm={() => handleRemoveMember(member)}
                          />
                        ) : (
                          <div className="inline-flex flex-col items-end gap-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled
                              aria-disabled="true"
                              title={removeCheck.reason}
                            >
                              Remove {member.name}
                            </Button>
                            <span
                              data-testid={`remove-disabled-reason-${member.id}`}
                              className="max-w-xs text-right text-[11px] text-zinc-500 dark:text-zinc-400"
                            >
                              {removeCheck.reason}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations Card */}
      <Card className="border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
        <CardHeader
          className="border-b border-zinc-200/80 dark:border-white/10"
          data-search-label="Pending invitations"
        >
          <CardTitle className="flex items-center gap-2 font-general text-xl text-zinc-950 dark:text-white">
            <Mail className="size-5" aria-hidden="true" />
            Pending invitations ({pendingInvites.length})
          </CardTitle>
          <CardDescription className="text-zinc-600 dark:text-zinc-400">
            Invitations that have not been accepted yet. You can resend or
            revoke pending links at any time.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {pendingInvites.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No pending invitations.
            </p>
          ) : (
            <Table aria-label="Pending invitations">
              <TableCaption>
                Outstanding email invitations waiting for recipient acceptance.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Email</TableHead>
                  <TableHead scope="col">Assigned role</TableHead>
                  <TableHead scope="col">Invited</TableHead>
                  <TableHead scope="col" className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow
                    key={invite.id}
                    data-testid={`pending-invite-row-${invite.id}`}
                  >
                    <TableCell className="font-medium text-zinc-950 dark:text-white">
                      {invite.email}
                      {invite.lastSentAt ? (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                          ({invite.lastSentAt})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600 dark:text-zinc-300">
                      {invite.invitedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Can
                          permission={PERMISSIONS.TEAM_RESEND_INVITE}
                          mode="disable"
                          showReason={false}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvite(invite)}
                            aria-label={`Resend invite to ${invite.email}`}
                            className="gap-1.5"
                          >
                            <RefreshCw className="size-3.5" aria-hidden="true" />
                            Resend
                          </Button>
                        </Can>

                        <Can
                          permission={PERMISSIONS.TEAM_REVOKE_INVITE}
                          mode="disable"
                          showReason={false}
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite)}
                            aria-label={`Revoke invite for ${invite.email}`}
                            className="gap-1.5"
                          >
                            <XCircle className="size-3.5" aria-hidden="true" />
                            Revoke
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog
        open={isInviteOpen}
        onOpenChange={(open) => {
          setIsInviteOpen(open);
          if (!open) {
            setInviteError(null);
          }
        }}
      >
        <DialogContent className="border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" aria-hidden="true" />
              Invite team member
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              Send an invitation by email and choose the role they will receive
              when they join.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4" noValidate>
            <EmailInput
              label="Invitee email address"
              value={inviteEmail}
              onChange={(val) => {
                setInviteEmail(val);
                if (inviteError) setInviteError(null);
              }}
              error={Boolean(inviteError)}
              helperText={
                inviteError ??
                "We will verify the address is not already a member or pending invite."
              }
              required
              placeholder="colleague@company.com"
            />

            <div className="space-y-2">
              <Label htmlFor="invite-role-select">Role</Label>
              <select
                id="invite-role-select"
                aria-label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                className="h-11 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-white"
              >
                {ROLES.map((r) => (
                  <option
                    key={r}
                    value={r}
                    disabled={currentUserRole !== "Owner" && r === "Owner"}
                  >
                    {r} — {ROLE_DESCRIPTIONS[r]}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog
        open={pendingRoleChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRoleChange(null);
        }}
      >
        <DialogContent className="border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-[#09090B] dark:text-white">
          <DialogHeader>
            <DialogTitle>Confirm role change</DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              {pendingRoleChange
                ? `Change ${pendingRoleChange.member.name}'s role from ${pendingRoleChange.member.role} to ${pendingRoleChange.nextRole}?`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {pendingRoleChange ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <p className="font-medium text-zinc-900 dark:text-white">
                {pendingRoleChange.nextRole} permissions:
              </p>
              <p className="mt-1">
                {ROLE_DESCRIPTIONS[pendingRoleChange.nextRole]}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRoleChange(null)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmRoleChange}>
              Confirm role change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
