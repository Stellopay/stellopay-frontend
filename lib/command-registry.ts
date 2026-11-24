export interface Command {
  id: string;
  title: string;
  keywords: string[];
  group: string;
  run: () => void | Promise<void>;
}

type Listener = () => void;

let commands: Command[] = [];
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function registerCommand(command: Command): () => void {
  if (commands.some((registered) => registered.id === command.id)) {
    throw new Error(`A command with id "${command.id}" is already registered.`);
  }

  commands = [...commands, command];
  emitChange();

  return () => {
    if (commands.some((registered) => registered === command)) {
      unregisterCommand(command.id);
    }
  };
}

export function unregisterCommand(id: string): void {
  const nextCommands = commands.filter((command) => command.id !== id);
  if (nextCommands.length === commands.length) return;
  commands = nextCommands;
  emitChange();
}

export function getCommands(): readonly Command[] {
  return commands;
}

export function subscribeToCommands(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
