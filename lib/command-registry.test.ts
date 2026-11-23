import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCommands,
  registerCommand,
  subscribeToCommands,
  unregisterCommand,
} from "./command-registry";

afterEach(() => {
  for (const command of getCommands()) unregisterCommand(command.id);
});

describe("command registry", () => {
  it("registers commands and exposes their typed metadata", () => {
    const run = vi.fn();
    const unregister = registerCommand({
      id: "test-home",
      title: "Go home",
      keywords: ["start"],
      group: "Navigation",
      run,
    });

    expect(getCommands()).toContainEqual({
      id: "test-home",
      title: "Go home",
      keywords: ["start"],
      group: "Navigation",
      run,
    });

    unregister();
    expect(getCommands()).toHaveLength(0);
  });

  it("notifies subscribers when commands change", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCommands(listener);
    const removeCommand = registerCommand({
      id: "test-action",
      title: "Run action",
      keywords: [],
      group: "Actions",
      run: () => {},
    });

    expect(listener).toHaveBeenCalledOnce();
    removeCommand();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("rejects duplicate command identifiers", () => {
    const command = {
      id: "duplicate",
      title: "One",
      keywords: [],
      group: "Test",
      run: () => {},
    };
    const removeCommand = registerCommand(command);

    expect(() => registerCommand({ ...command, title: "Two" })).toThrow(
      'A command with id "duplicate" is already registered.',
    );

    removeCommand();
  });
});
