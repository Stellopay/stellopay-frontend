"use client";

import React, {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  can as checkCan,
  getPermissionActionState,
} from "@/lib/permissions";
import type {
  Permission,
  PermissionActionState,
  TeamRole,
} from "@/types/team";

export interface PermissionsContextValue {
  role: TeamRole;
  setRole: (nextRole: TeamRole) => void;
  can: (permission: Permission) => boolean;
  getActionState: (permission: Permission) => PermissionActionState;
}

const DEFAULT_ROLE: TeamRole = "Owner";

const PermissionsContext = createContext<PermissionsContextValue | undefined>(
  undefined,
);

export interface PermissionsProviderProps {
  children: ReactNode;
  initialRole?: TeamRole;
  role?: TeamRole;
  onRoleChange?: (nextRole: TeamRole) => void;
}

export function PermissionsProvider({
  children,
  initialRole = DEFAULT_ROLE,
  role: controlledRole,
  onRoleChange,
}: PermissionsProviderProps) {
  const [internalRole, setInternalRole] = useState<TeamRole>(
    controlledRole ?? initialRole,
  );

  const activeRole = controlledRole ?? internalRole;

  const setRole = useCallback(
    (nextRole: TeamRole) => {
      if (controlledRole === undefined) {
        setInternalRole(nextRole);
      }
      onRoleChange?.(nextRole);
    },
    [controlledRole, onRoleChange],
  );

  const can = useCallback(
    (permission: Permission) => checkCan(activeRole, permission),
    [activeRole],
  );

  const getActionState = useCallback(
    (permission: Permission) => getPermissionActionState(activeRole, permission),
    [activeRole],
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({
      role: activeRole,
      setRole,
      can,
      getActionState,
    }),
    [activeRole, setRole, can, getActionState],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Access the current user's role and permission helpers.
 * Can optionally take a `permission` argument to also return `allowed` and `actionState`
 * for that specific permission, while always returning `{ role, setRole, can, getActionState }`.
 *
 * When rendered outside an explicit `<PermissionsProvider>`, falls back to a safe
 * default context (Owner role) so standalone section tests work seamlessly.
 */
export function usePermission(permission?: Permission): PermissionsContextValue & {
  allowed: boolean;
  reason: string;
  actionState: PermissionActionState;
} {
  const ctx = useContext(PermissionsContext);

  const fallbackRole: TeamRole = DEFAULT_ROLE;
  const activeRole = ctx?.role ?? fallbackRole;

  const fallbackSetRole = useCallback(() => {
    // no-op when outside provider
  }, []);

  const can = useCallback(
    (perm: Permission) => (ctx ? ctx.can(perm) : checkCan(activeRole, perm)),
    [ctx, activeRole],
  );

  const getActionState = useCallback(
    (perm: Permission) =>
      ctx
        ? ctx.getActionState(perm)
        : getPermissionActionState(activeRole, perm),
    [ctx, activeRole],
  );

  const specificState = useMemo<PermissionActionState>(() => {
    if (!permission) {
      return { enabled: true, reason: "" };
    }
    return getActionState(permission);
  }, [permission, getActionState]);

  return {
    role: activeRole,
    setRole: ctx?.setRole ?? fallbackSetRole,
    can,
    getActionState,
    allowed: specificState.enabled,
    reason: specificState.reason,
    actionState: specificState,
  };
}

export type CanMode = "hide" | "disable";

export interface CanProps {
  /** The required permission from `PERMISSIONS`. */
  permission: Permission;
  /**
   * How to handle unauthorized access:
   * - `"hide"` (default unless `disable` is true): renders `fallback` (or `null`)
   * - `"disable"`: disables child control(s) and displays an explanatory reason
   */
  mode?: CanMode;
  /** Shorthand for `mode="disable"`. */
  disable?: boolean;
  /** Optional override for the explanatory reason shown when disabled. */
  reason?: string;
  /** Whether to render the explanatory message inline below a disabled control. Defaults to true when disabled. */
  showReason?: boolean;
  /** Fallback content rendered when `mode="hide"` and permission is denied. */
  fallback?: ReactNode;
  /**
   * Either React nodes or a render-prop receiving `{ allowed, disabled, reason }`.
   */
  children:
    | ReactNode
    | ((state: {
        allowed: boolean;
        disabled: boolean;
        reason: string;
      }) => ReactNode);
}

/**
 * `<Can permission=...>` declarative helper for role-based UI affordances.
 *
 * - In `"hide"` mode (default), hides `children` and renders `fallback` (default `null`)
 *   when the current role lacks `permission`.
 * - In `"disable"` mode (or when `disable` prop is set), keeps primary actions visible
 *   but disables them with an explanatory message (`reason`), consistent with
 *   `WalletActionState.reason`.
 */
export function Can({
  permission,
  mode,
  disable = false,
  reason: customReason,
  showReason = true,
  fallback = null,
  children,
}: CanProps) {
  const { getActionState } = usePermission();
  const reasonId = useId();
  const actionState = getActionState(permission);
  const allowed = actionState.enabled;
  const resolvedMode: CanMode = disable ? "disable" : (mode ?? "hide");
  const explanation = customReason ?? actionState.reason;

  if (typeof children === "function") {
    return (
      <>
        {children({
          allowed,
          disabled: !allowed,
          reason: explanation,
        })}
      </>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (resolvedMode === "hide") {
    return <>{fallback}</>;
  }

  // resolvedMode === "disable"
  const disabledChild = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          disabled?: boolean;
          "aria-disabled"?: boolean;
          "aria-describedby"?: string;
          title?: string;
        }>,
        {
          disabled: true,
          "aria-disabled": true,
          "aria-describedby": showReason ? reasonId : undefined,
          title: explanation,
        },
      )
    : children;

  return (
    <div
      className="inline-flex flex-col items-start gap-1"
      data-testid={`can-disabled-${permission}`}
    >
      {disabledChild}
      {showReason && explanation ? (
        <p
          id={reasonId}
          data-testid="permission-denied-reason"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {explanation}
        </p>
      ) : null}
    </div>
  );
}
