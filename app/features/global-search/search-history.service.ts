import type { HistoryEntry } from "./global-search.types";

function storageKey(userId: string, accountId: string): string {
  return `search-history:${userId}:${accountId}`;
}

interface StoredData {
  entries: HistoryEntry[];
}

function readStorage(key: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: StoredData = JSON.parse(raw);
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function writeStorage(key: string, entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ entries }));
  } catch {
  }
}

export function getSearchHistory(
  userId: string,
  accountId: string,
  effectivePermissions: string[]
): HistoryEntry[] {
  const key = storageKey(userId, accountId);
  const all = readStorage(key);

  if (effectivePermissions.includes("*")) return all;

  return all.filter((entry) => {
    if (!entry.permission) return true;
    const code = `${entry.permission.module}:${entry.permission.action}`;
    return effectivePermissions.some((p) => p.toLowerCase() === code.toLowerCase());
  });
}

export function addToSearchHistory(
  userId: string,
  accountId: string,
  entry: HistoryEntry
): void {
  const key = storageKey(userId, accountId);
  const entries = readStorage(key);

  const filtered = entries.filter((e) => e.id !== entry.id);
  filtered.unshift(entry);

  if (filtered.length > 10) {
    filtered.pop();
  }

  writeStorage(key, filtered);
}

export function removeFromSearchHistory(
  userId: string,
  accountId: string,
  entryId: string
): void {
  const key = storageKey(userId, accountId);
  const entries = readStorage(key).filter((e) => e.id !== entryId);
  writeStorage(key, entries);
}

export function clearSearchHistory(
  userId: string,
  accountId: string
): void {
  const key = storageKey(userId, accountId);
  try {
    localStorage.removeItem(key);
  } catch {
  }
}
