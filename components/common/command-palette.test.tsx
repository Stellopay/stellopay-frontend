import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./command-palette";
import {
  getCommands,
  registerCommand,
  unregisterCommand,
} from "@/lib/command-registry";
import { axe } from "vitest-axe";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/hooks/useTransactions", () => ({
  useTransactions: () => ({ data: null, isLoading: false, error: null }),
}));

afterEach(() => {
  cleanup();
  for (const command of getCommands()) {
    if (command.id.startsWith("palette-test-")) {
      unregisterCommand(command.id);
    }
  }
  vi.clearAllMocks();
});

describe("CommandPalette", () => {
  it("opens with Ctrl+K, searches commands, and runs the active result", async () => {
    const run = vi.fn();
    registerCommand({
      id: "palette-test-dashboard",
      title: "Go to Dashboard",
      keywords: ["home"],
      group: "Navigation",
      run,
    });
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    const input = await screen.findByRole("combobox", {
      name: "Search commands",
    });
    await userEvent.type(input, "dash");
    expect(
      screen.getByRole("option", { name: /go to dashboard/i }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(/1 result found/);

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(run).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not capture Ctrl+K while an editable field is focused", () => {
    render(<CommandPalette />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    input.remove();
  });

  it("closes on Escape and restores focus to the previously focused element", async () => {
    render(<CommandPalette />);
    const trigger = document.createElement("button");
    trigger.textContent = "Trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await screen.findByRole("combobox", { name: "Search commands" });
    await userEvent.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("is accessible while open", async () => {
    const { container } = render(<CommandPalette open />);
    expect(container).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
