import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Can,
  PermissionsProvider,
  usePermission,
} from "./permissions-context";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

function HookInspector() {
  const { role, setRole, can, getActionState } = usePermission();
  const inviteState = getActionState(PERMISSIONS.TEAM_INVITE);

  return (
    <div>
      <span data-testid="current-role">{role}</span>
      <span data-testid="can-invite">
        {String(can(PERMISSIONS.TEAM_INVITE))}
      </span>
      <span data-testid="invite-reason">{inviteState.reason}</span>
      <button type="button" onClick={() => setRole("Viewer")}>
        Switch to Viewer
      </button>
      <button type="button" onClick={() => setRole("Admin")}>
        Switch to Admin
      </button>
    </div>
  );
}

describe("PermissionsContext and usePermission()", () => {
  afterEach(() => {
    cleanup();
  });

  it("provides the initial role and updates permissions when setRole is called", () => {
    render(
      <PermissionsProvider initialRole="Owner">
        <HookInspector />
      </PermissionsProvider>,
    );

    expect(screen.getByTestId("current-role")).toHaveTextContent("Owner");
    expect(screen.getByTestId("can-invite")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "Switch to Viewer" }));
    expect(screen.getByTestId("current-role")).toHaveTextContent("Viewer");
    expect(screen.getByTestId("can-invite")).toHaveTextContent("false");
    expect(screen.getByTestId("invite-reason")).toHaveTextContent(
      /cannot invite team members/i,
    );

    fireEvent.click(screen.getByRole("button", { name: "Switch to Admin" }));
    expect(screen.getByTestId("current-role")).toHaveTextContent("Admin");
    expect(screen.getByTestId("can-invite")).toHaveTextContent("true");
  });
});

describe("<Can permission=...>", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children when the current role has the required permission", () => {
    render(
      <PermissionsProvider initialRole="Admin">
        <Can permission={PERMISSIONS.TEAM_INVITE}>
          <Button>Invite member</Button>
        </Can>
      </PermissionsProvider>,
    );

    const btn = screen.getByRole("button", { name: "Invite member" });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });

  it("hides children by default (mode='hide') when the role lacks permission", () => {
    render(
      <PermissionsProvider initialRole="Viewer">
        <Can
          permission={PERMISSIONS.TEAM_INVITE}
          fallback={<span data-testid="fallback">Read only</span>}
        >
          <Button>Invite member</Button>
        </Can>
      </PermissionsProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Invite member" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("fallback")).toHaveTextContent("Read only");
  });

  it("disables the control and renders an explanatory reason when mode='disable'", () => {
    render(
      <PermissionsProvider initialRole="Finance">
        <Can permission={PERMISSIONS.TEAM_INVITE} mode="disable">
          <Button>Invite member</Button>
        </Can>
      </PermissionsProvider>,
    );

    const btn = screen.getByRole("button", { name: "Invite member" });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
    expect(screen.getByTestId("permission-denied-reason")).toHaveTextContent(
      /Your current role \(Finance\) cannot invite team members/i,
    );
  });

  it("supports a render-prop child receiving { allowed, disabled, reason }", () => {
    render(
      <PermissionsProvider initialRole="Viewer">
        <Can permission={PERMISSIONS.PAYROLL_RUN}>
          {({ allowed, disabled, reason }) => (
            <button type="button" disabled={disabled} title={reason}>
              {allowed ? "Run payroll" : `Locked: ${reason}`}
            </button>
          )}
        </Can>
      </PermissionsProvider>,
    );

    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/cannot run payroll/i);
  });
});
