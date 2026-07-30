"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import type { Tag } from "@/types/transaction";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { X, Plus, Check } from "lucide-react";

interface TagChipProps {
  assignedTags: Tag[];
  allTags: Tag[];
  onAssign: (tagId: string) => void;
  onUnassign: (tagId: string) => void;
  onCreateTag: (name: string) => Tag;
  transactionId: string;
}

function TagBadge({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium truncate max-w-[100px] group"
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        borderColor: `${tag.color}40`,
        borderWidth: 1,
      }}
    >
      <span className="truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ color: tag.color }}
          aria-label={`Remove tag ${tag.name}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}

export function TagChip({
  assignedTags,
  allTags,
  onAssign,
  onUnassign,
  onCreateTag,
  transactionId,
}: TagChipProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const unassignedTags = allTags.filter(
    (t) => !assignedTags.some((at) => at.id === t.id),
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setInputValue("");
      }
    },
    [],
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleCreateAndAssign = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        const tag = onCreateTag(trimmed);
        onAssign(tag.id);
        setInputValue("");
      } catch {
        // Tag name was empty, ignored
      }
    },
    [onCreateTag, onAssign],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        if (editingTagId) {
          handleCreateAndAssign(editValue);
          setEditingTagId(null);
          return;
        }

        const match = unassignedTags.find(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (match) {
          onAssign(match.id);
          setInputValue("");
        } else {
          handleCreateAndAssign(trimmed);
        }
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [inputValue, editValue, editingTagId, unassignedTags, onAssign, handleCreateAndAssign],
  );

  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
      {assignedTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onRemove={() => onUnassign(tag.id)}
        />
      ))}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-dashed border-zinc-600 px-1.5 py-0.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Add tag to transaction ${transactionId}`}
          >
            <Plus size={12} />
            <span className="sr-only md:not-sr-only ml-0.5">Tag</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-3 bg-[#191919] border-[#2D2D2D] text-white"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="space-y-2">
            <label
              id={`tag-input-label-${transactionId}`}
              className="text-xs font-medium text-zinc-400"
            >
              {editingTagId ? "Rename tag" : "Add tag"}
            </label>
            <Input
              ref={inputRef}
              value={editingTagId ? editValue : inputValue}
              onChange={(e) =>
                editingTagId
                  ? setEditValue(e.target.value)
                  : setInputValue(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={
                editingTagId
                  ? "New name..."
                  : unassignedTags.length > 0
                    ? "Select or type new..."
                    : "Type new tag name..."
              }
              aria-labelledby={`tag-input-label-${transactionId}`}
              className="bg-[#2D2D2D] border-[#3E3E3E] text-white placeholder-zinc-500 text-sm h-8"
            />
            {!editingTagId && unassignedTags.length > 0 && (
              <div
                className="max-h-32 overflow-y-auto space-y-0.5"
                role="listbox"
                aria-label="Available tags"
              >
                {unassignedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    role="option"
                    aria-selected={assignedTags.some((at) => at.id === tag.id)}
                    onClick={() => {
                      onAssign(tag.id);
                      setInputValue("");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left"
                  >
                    <span
                      className="inline-block size-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate flex-1">{tag.name}</span>
                    {assignedTags.some((at) => at.id === tag.id) && (
                      <Check size={14} className="text-[#34D399] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-zinc-500">
              Press Enter to {editingTagId ? "rename" : "create or assign"}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
