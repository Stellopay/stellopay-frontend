"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { isTextInputFocused } from "@/hooks/useGlobalShortcuts";
import {
  getCommands,
  subscribeToCommands,
  type Command,
} from "@/lib/command-registry";
import { fuzzySearch } from "@/utils/fuzzy";
import type { Transaction } from "@/types/transaction";
import { useTransactions } from "@/hooks/useTransactions";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface RankedCommand {
  command: Command;
  score: number;
}

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [transactionCommands, setTransactionCommands] = useState<Command[]>([]);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const registeredCommands = useSyncExternalStore(
    subscribeToCommands,
    getCommands,
    getCommands,
  );
  const pushRoute = useCallback(
    (href: string) => router.push(href),
    [router.push],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey) ||
        event.altKey ||
        event.defaultPrevented ||
        isTextInputFocused()
      ) {
        return;
      }

      event.preventDefault();
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      setTransactionCommands([]);
      setTransactionError(null);
      setExecutionError(null);
    }
  }, [open]);

  const commands = useMemo(
    () => [...registeredCommands, ...transactionCommands],
    [registeredCommands, transactionCommands],
  );
  const normalizedQuery = query.trim();
  const results: RankedCommand[] = useMemo(() => {
    if (!normalizedQuery) {
      return commands.map((command) => ({ command, score: 0 }));
    }

    return fuzzySearch(normalizedQuery, commands, (command) =>
      [command.title, command.group, ...command.keywords].join(" "),
    ).map(({ item, score }) => ({ command: item, score }));
  }, [commands, normalizedQuery]);

  useEffect(() => {
    setActiveIndex((index) =>
      results.length === 0 ? 0 : Math.min(index, results.length - 1),
    );
  }, [results.length]);

  const handleSelect = async (command: Command) => {
    setExecutionError(null);
    try {
      await command.run();
      setOpen(false);
    } catch (error) {
      setExecutionError(
        error instanceof Error ? error.message : "Unable to run this command.",
      );
    }
  };

  const resultAnnouncement =
    normalizedQuery.length === 0
      ? `${results.length} commands available`
      : `${results.length} result${results.length === 1 ? "" : "s"} found for ${query}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          returnFocusRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }
        setOpen(nextOpen);
      }}
    >
      {open && normalizedQuery.length >= 2 && (
        <TransactionResults
          query={normalizedQuery}
          routerPush={pushRoute}
          onCommandsChange={setTransactionCommands}
          onErrorChange={setTransactionError}
        />
      )}
      <DialogContent
        className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:top-[18%]"
        showCloseButton={false}
        disableAnimations={prefersReducedMotion}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          if (target?.isConnected) target.focus();
          else document.getElementById("main-content")?.focus();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search navigation, actions, settings, and recent transactions.
        </DialogDescription>
        <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Search
            aria-hidden="true"
            className="mr-3 size-5 shrink-0 text-zinc-500"
          />
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            role="combobox"
            aria-label="Search commands"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-activedescendant={
              results.length > 0 ? `command-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            placeholder="Search pages, actions, settings..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setExecutionError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && results.length > 0) {
                event.preventDefault();
                setActiveIndex((index) => (index + 1) % results.length);
              } else if (event.key === "ArrowUp" && results.length > 0) {
                event.preventDefault();
                setActiveIndex(
                  (index) => (index - 1 + results.length) % results.length,
                );
              } else if (event.key === "Enter" && results[activeIndex]) {
                event.preventDefault();
                void handleSelect(results[activeIndex].command);
              }
            }}
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-500 sm:inline dark:border-zinc-700">
            ESC
          </kbd>
        </div>
        <ul
          id="command-palette-results"
          role="listbox"
          aria-label="Command results"
          className="max-h-[min(60vh,28rem)] overflow-y-auto p-2"
        >
          {results.map(({ command }, index) => (
            <li
              id={`command-option-${index}`}
              key={command.id}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void handleSelect(command)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 text-sm ${
                index === activeIndex
                  ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span className="min-w-0 truncate">{command.title}</span>
              <span className="shrink-0 text-xs text-zinc-500">
                {command.group}
              </span>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-zinc-500">
              {normalizedQuery
                ? "No matching commands."
                : "No commands available."}
            </li>
          )}
        </ul>
        {transactionError && (
          <p className="border-t border-zinc-200 px-4 py-2 text-sm text-red-600 dark:border-zinc-800 dark:text-red-400">
            Recent transactions could not be loaded: {transactionError}
          </p>
        )}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {executionError ?? resultAnnouncement}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionResults({
  query,
  routerPush,
  onCommandsChange,
  onErrorChange,
}: {
  query: string;
  routerPush: (href: string) => void;
  onCommandsChange: (commands: Command[]) => void;
  onErrorChange: (error: string | null) => void;
}) {
  const { data, error } = useTransactions({
    filters: { searchQuery: query },
    pageSize: 10,
  });

  useEffect(() => {
    onErrorChange(error);
    onCommandsChange(
      (data?.data ?? []).map((transaction: Transaction) => ({
        id: `transaction-${transaction.id}`,
        title: `${transaction.type} ${transaction.token} ${transaction.amount} ${transaction.status} ${transaction.txId}`,
        keywords: [
          transaction.txId,
          transaction.address,
          transaction.date,
          transaction.memo ?? "",
        ],
        group: "Recent transactions",
        run: () =>
          routerPush(
            `/transactions?q=${encodeURIComponent(transaction.txId || transaction.id)}`,
          ),
      })),
    );
  }, [data, error, onCommandsChange, onErrorChange, routerPush]);

  useEffect(
    () => () => {
      onCommandsChange([]);
      onErrorChange(null);
    },
    [onCommandsChange, onErrorChange],
  );

  return null;
}
