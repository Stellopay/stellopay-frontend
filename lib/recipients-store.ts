"use client";

import { z } from "zod";
import { isValidStellarAddress } from "@/utils/stellarAddress";
import { safeStorage } from "@/utils/safeStorage";
import { createAccountScope } from "@/lib/realtime-registry";
import { useWallet } from "@/context/wallet-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { escapeCsvField } from "@/utils/csvUtils";

export interface Recipient {
  id: string;
  name: string;
  address: string;
  memo?: string;
  email?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
}

export const recipientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required"),
  address: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine(isValidStellarAddress, {
      message:
        "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.",
    }),
  memo: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      {
        message: "Enter a valid email address",
      },
    ),
  tags: z.array(z.string().trim()).optional().default([]),
});

export type RecipientInput = z.infer<typeof recipientSchema>;

export interface RecipientsStoreData {
  version: 1;
  items: Recipient[];
}

export const RECIPIENTS_STORAGE_KEY_PREFIX = "stellopay_recipients_";

export function getRecipientsStorageKey(accountScope: string | null): string {
  return accountScope
    ? `${RECIPIENTS_STORAGE_KEY_PREFIX}${accountScope}`
    : `${RECIPIENTS_STORAGE_KEY_PREFIX}default`;
}

export function loadRecipients(scope: string | null): Recipient[] {
  try {
    const raw = safeStorage.getItem(getRecipientsStorageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.items)) {
      return parsed.items as Recipient[];
    }
    if (Array.isArray(parsed)) {
      return parsed as Recipient[];
    }
    return [];
  } catch {
    return [];
  }
}

export function saveRecipients(
  scope: string | null,
  items: Recipient[],
): boolean {
  const data: RecipientsStoreData = {
    version: 1,
    items,
  };
  return safeStorage.setItem(
    getRecipientsStorageKey(scope),
    JSON.stringify(data),
  );
}

export function addRecipient(
  scope: string | null,
  input: Omit<Recipient, "id" | "createdAt"> & { id?: string },
): Recipient {
  const validated = recipientSchema.parse(input);
  const existing = loadRecipients(scope);

  const normalizedAddress = validated.address.toUpperCase();
  const duplicate = existing.find(
    (r) => r.address.toUpperCase() === normalizedAddress,
  );
  if (duplicate) {
    throw new Error(
      `Recipient with Stellar address ${validated.address} already exists`,
    );
  }

  const newRecipient: Recipient = {
    id: validated.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    name: validated.name,
    address: validated.address,
    memo: validated.memo || undefined,
    email: validated.email || undefined,
    tags: validated.tags || [],
    createdAt: new Date().toISOString(),
  };

  saveRecipients(scope, [...existing, newRecipient]);
  return newRecipient;
}

export function updateRecipient(
  scope: string | null,
  id: string,
  input: Partial<RecipientInput>,
): Recipient {
  const existing = loadRecipients(scope);
  const index = existing.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error("Recipient not found");
  }

  const current = existing[index];
  const candidate = {
    name: input.name !== undefined ? input.name : current.name,
    address: input.address !== undefined ? input.address : current.address,
    memo: input.memo !== undefined ? input.memo : current.memo,
    email: input.email !== undefined ? input.email : current.email,
    tags: input.tags !== undefined ? input.tags : current.tags,
  };

  const validated = recipientSchema.parse(candidate);

  const normalizedAddress = validated.address.toUpperCase();
  const duplicate = existing.find(
    (r) => r.id !== id && r.address.toUpperCase() === normalizedAddress,
  );
  if (duplicate) {
    throw new Error(
      `Recipient with Stellar address ${validated.address} already exists`,
    );
  }

  const updated: Recipient = {
    ...current,
    name: validated.name,
    address: validated.address,
    memo: validated.memo || undefined,
    email: validated.email || undefined,
    tags: validated.tags || [],
    updatedAt: new Date().toISOString(),
  };

  const nextItems = [...existing];
  nextItems[index] = updated;
  saveRecipients(scope, nextItems);
  return updated;
}

export function deleteRecipient(scope: string | null, id: string): boolean {
  const existing = loadRecipients(scope);
  const filtered = existing.filter((r) => r.id !== id);
  if (filtered.length === existing.length) {
    return false;
  }
  return saveRecipients(scope, filtered);
}

export function markRecipientUsed(
  scope: string | null,
  addressOrId: string,
): void {
  const existing = loadRecipients(scope);
  const normalized = addressOrId.toUpperCase();
  const index = existing.findIndex(
    (r) => r.id === addressOrId || r.address.toUpperCase() === normalized,
  );
  if (index === -1) return;

  const updated: Recipient = {
    ...existing[index],
    lastUsedAt: new Date().toISOString(),
  };
  const nextItems = [...existing];
  nextItems[index] = updated;
  saveRecipients(scope, nextItems);
}

export function getRecentRecipients(
  scope: string | null,
  limit = 5,
): Array<{ address: string; label?: string }> {
  const items = loadRecipients(scope);
  return [...items]
    .sort((a, b) => {
      const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit)
    .map((r) => ({ address: r.address, label: r.name }));
}

export function exportRecipientsToCsv(recipients: Recipient[]): string {
  const headers = ["Name", "Stellar Address", "Memo", "Email", "Tags"];
  const rows = [headers.map(escapeCsvField).join(",")];
  for (const r of recipients) {
    const row = [
      escapeCsvField(r.name),
      escapeCsvField(r.address),
      escapeCsvField(r.memo || ""),
      escapeCsvField(r.email || ""),
      escapeCsvField((r.tags || []).join(";")),
    ];
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let field = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else {
        field += char;
      }
    }
    row.push(field);
    rows.push(
      row.map((val) => {
        let unescaped = val.trim();
        if (unescaped.startsWith("'") && /^[=+\-@]/.test(unescaped.slice(1))) {
          unescaped = unescaped.slice(1);
        }
        return unescaped;
      }),
    );
  }
  return rows;
}

export function importRecipientsFromCsv(
  scope: string | null,
  csvText: string,
): {
  imported: Recipient[];
  errors: Array<{ line: number; error: string }>;
} {
  const rawRows = parseCsvRows(csvText);
  if (rawRows.length === 0) {
    return { imported: [], errors: [{ line: 0, error: "Empty CSV file" }] };
  }

  // Detect header row
  let startIndex = 0;
  const firstRow = rawRows[0].map((c) => c.toLowerCase());
  if (
    firstRow.some((c) => c.includes("name") || c.includes("address"))
  ) {
    startIndex = 1;
  }

  const existing = loadRecipients(scope);
  const seenAddresses = new Set(existing.map((r) => r.address.toUpperCase()));
  const newRecipients: Recipient[] = [];
  const errors: Array<{ line: number; error: string }> = [];

  for (let i = startIndex; i < rawRows.length; i++) {
    const lineNumber = i + 1;
    const cols = rawRows[i];
    const name = cols[0] || "";
    const address = cols[1] || "";
    const memo = cols[2] || undefined;
    const email = cols[3] || undefined;
    const tagsStr = cols[4] || "";
    const tags = tagsStr
      ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean)
      : [];

    const result = recipientSchema.safeParse({
      name,
      address,
      memo: memo || undefined,
      email: email || undefined,
      tags,
    });

    if (!result.success) {
      const issue = result.error.issues[0]?.message || "Validation failed";
      errors.push({ line: lineNumber, error: issue });
      continue;
    }

    const normalizedAddress = result.data.address.toUpperCase();
    if (seenAddresses.has(normalizedAddress)) {
      errors.push({
        line: lineNumber,
        error: `Duplicate address ${result.data.address}`,
      });
      continue;
    }

    seenAddresses.add(normalizedAddress);
    const recipient: Recipient = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: result.data.name,
      address: result.data.address,
      memo: result.data.memo || undefined,
      email: result.data.email || undefined,
      tags: result.data.tags || [],
      createdAt: new Date().toISOString(),
    };
    newRecipients.push(recipient);
  }

  if (newRecipients.length > 0) {
    saveRecipients(scope, [...existing, ...newRecipients]);
  }

  return { imported: newRecipients, errors };
}

export function useRecipients(scopeOverride?: string | null) {
  let walletScope: string | null = null;
  try {
    const wallet = useWallet();
    if (wallet && wallet.network) {
      walletScope = createAccountScope(wallet.network.id, wallet.address);
    }
  } catch {
    walletScope = null;
  }

  const effectiveScope =
    scopeOverride !== undefined ? scopeOverride : walletScope;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setRecipients(loadRecipients(effectiveScope));
  }, [effectiveScope]);

  useEffect(() => {
    setRecipients(loadRecipients(effectiveScope));
    setIsLoading(false);
  }, [effectiveScope]);

  const recentRecipients = useMemo<
    Array<{ address: string; label?: string }>
  >(() => {
    return [...recipients]
      .sort((a, b) => {
        const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5)
      .map((r) => ({ address: r.address, label: r.name }));
  }, [recipients]);

  const add = useCallback(
    (input: RecipientInput) => {
      const created = addRecipient(effectiveScope, input);
      setRecipients(loadRecipients(effectiveScope));
      return created;
    },
    [effectiveScope],
  );

  const update = useCallback(
    (id: string, input: Partial<RecipientInput>) => {
      const updated = updateRecipient(effectiveScope, id, input);
      setRecipients(loadRecipients(effectiveScope));
      return updated;
    },
    [effectiveScope],
  );

  const remove = useCallback(
    (id: string) => {
      const res = deleteRecipient(effectiveScope, id);
      setRecipients(loadRecipients(effectiveScope));
      return res;
    },
    [effectiveScope],
  );

  const markUsed = useCallback(
    (addressOrId: string) => {
      markRecipientUsed(effectiveScope, addressOrId);
      setRecipients(loadRecipients(effectiveScope));
    },
    [effectiveScope],
  );

  const importCsv = useCallback(
    (csvText: string) => {
      const res = importRecipientsFromCsv(effectiveScope, csvText);
      setRecipients(loadRecipients(effectiveScope));
      return res;
    },
    [effectiveScope],
  );

  return {
    recipients,
    recentRecipients,
    isLoading,
    addRecipient: add,
    updateRecipient: update,
    deleteRecipient: remove,
    markRecipientUsed: markUsed,
    importRecipientsFromCsv: importCsv,
    refresh,
    scope: effectiveScope,
  };
}
