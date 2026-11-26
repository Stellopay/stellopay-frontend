"use client";

import { useState, useEffect, useCallback } from "react";
import { safeStorage } from "utils/safeStorage";

const ARCHIVED_STORAGE_PREFIX = "stellopay_archived_transactions";

function getStorageKey(address?: string | null): string {
  if (!address) return `${ARCHIVED_STORAGE_PREFIX}_default`;
  return `${ARCHIVED_STORAGE_PREFIX}_${address}`;
}

function loadArchivedIds(address?: string | null): Set<string> {
  try {
    const raw = safeStorage.getItem(getStorageKey(address));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function saveArchivedIds(address: string | null | undefined, ids: Set<string>): void {
  safeStorage.setItem(getStorageKey(address), JSON.stringify(Array.from(ids)));
}

export function useArchivedTransactions(address?: string | null) {
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => loadArchivedIds(address));
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setArchivedIds(loadArchivedIds(address));
  }, [address]);

  const persist = useCallback(
    (next: Set<string>) => {
      setArchivedIds(next);
      saveArchivedIds(address, next);
    },
    [address],
  );

  const archiveTransactions = useCallback(
    (ids: string[]) => {
      const next = new Set(archivedIds);
      for (const id of ids) {
        next.add(id);
      }
      persist(next);
    },
    [archivedIds, persist],
  );

  const unarchiveTransactions = useCallback(
    (ids: string[]) => {
      const next = new Set(archivedIds);
      for (const id of ids) {
        next.delete(id);
      }
      persist(next);
    },
    [archivedIds, persist],
  );

  const isArchived = useCallback(
    (id: string) => archivedIds.has(id),
    [archivedIds],
  );

  return {
    archivedIds,
    showArchived,
    setShowArchived,
    archiveTransactions,
    unarchiveTransactions,
    isArchived,
  };
}
