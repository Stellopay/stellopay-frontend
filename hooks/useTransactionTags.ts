"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tag } from "@/types/transaction";
import { safeStorage } from "@/utils/safeStorage";

const TAGS_STORAGE_KEY = "stellopay_transaction_tags";
const ASSIGNMENTS_STORAGE_KEY = "stellopay_tag_assignments";

const DEFAULT_COLORS = [
  "#34D399",
  "#60A5FA",
  "#F472B6",
  "#FBBF24",
  "#A78BFA",
  "#FB923C",
  "#2DD4BF",
  "#F87171",
];

let colorIndex = 0;
function nextColor(): string {
  const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];
  colorIndex++;
  return color;
}

interface TagAssignment {
  [txId: string]: string[];
}

function loadTags(): Tag[] {
  try {
    const raw = safeStorage.getItem(TAGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Tag[];
  } catch {
    return [];
  }
}

function saveTags(tags: Tag[]): void {
  safeStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
}

function loadAssignments(): TagAssignment {
  try {
    const raw = safeStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TagAssignment;
  } catch {
    return {};
  }
}

function saveAssignments(assignments: TagAssignment): void {
  safeStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
}

export function useTransactionTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [assignments, setAssignments] = useState<TagAssignment>({});

  useEffect(() => {
    setTags(loadTags());
    setAssignments(loadAssignments());
  }, []);

  const persistTags = useCallback((newTags: Tag[]) => {
    setTags(newTags);
    saveTags(newTags);
  }, []);

  const persistAssignments = useCallback((newAssignments: TagAssignment) => {
    setAssignments(newAssignments);
    saveAssignments(newAssignments);
  }, []);

  const addTag = useCallback(
    (name: string): Tag => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Tag name cannot be empty");
      const existing = tags.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (existing) return existing;
      const newTag: Tag = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: trimmed,
        color: nextColor(),
      };
      persistTags([...tags, newTag]);
      return newTag;
    },
    [tags, persistTags],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      persistTags(tags.filter((t) => t.id !== tagId));
      const newAssignments: TagAssignment = {};
      for (const [txId, tagIds] of Object.entries(assignments)) {
        const filtered = tagIds.filter((id) => id !== tagId);
        if (filtered.length > 0) {
          newAssignments[txId] = filtered;
        }
      }
      persistAssignments(newAssignments);
    },
    [tags, assignments, persistTags, persistAssignments],
  );

  const renameTag = useCallback(
    (tagId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      persistTags(
        tags.map((t) => (t.id === tagId ? { ...t, name: trimmed } : t)),
      );
    },
    [tags, persistTags],
  );

  const getTagsForTransaction = useCallback(
    (txId: string): Tag[] => {
      const assignedIds = assignments[txId] ?? [];
      return assignedIds
        .map((id) => tags.find((t) => t.id === id))
        .filter(Boolean) as Tag[];
    },
    [tags, assignments],
  );

  const assignTag = useCallback(
    (txId: string, tagId: string) => {
      const current = assignments[txId] ?? [];
      if (current.includes(tagId)) return;
      persistAssignments({ ...assignments, [txId]: [...current, tagId] });
    },
    [assignments, persistAssignments],
  );

  const unassignTag = useCallback(
    (txId: string, tagId: string) => {
      const current = assignments[txId] ?? [];
      const filtered = current.filter((id) => id !== tagId);
      if (filtered.length === current.length) return;
      const newAssignments = { ...assignments };
      if (filtered.length > 0) {
        newAssignments[txId] = filtered;
      } else {
        delete newAssignments[txId];
      }
      persistAssignments(newAssignments);
    },
    [assignments, persistAssignments],
  );

  const getTagNamesForTransaction = useCallback(
    (txId: string): string[] => {
      return getTagsForTransaction(txId).map((t) => t.name);
    },
    [getTagsForTransaction],
  );

  const allTags = tags;

  return {
    allTags,
    assignments,
    addTag,
    removeTag,
    renameTag,
    assignTag,
    unassignTag,
    getTagsForTransaction,
    getTagNamesForTransaction,
  };
}
