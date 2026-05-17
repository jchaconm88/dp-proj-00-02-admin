import { adminFetch } from "~/lib/backend-client";
import type { CounterAddInput, CounterEditInput, CounterRecord } from "./counters.types";

const BASE = "/admin/system/counters";

function toRecord(data: Record<string, unknown>): CounterRecord {
  return {
    id: String(data.id ?? ""),
    sequenceId: String(data.sequenceId ?? ""),
    counter: Number(data.counter) || 0,
    description: data.description ? String(data.description) : undefined,
    createdAt: data.createdAt ? String(data.createdAt) : undefined,
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
  };
}

export async function getCounters(sequenceId?: string): Promise<CounterRecord[]> {
  const params = sequenceId ? `?sequenceId=${encodeURIComponent(sequenceId)}` : "";
  const res = await adminFetch<{ items: Record<string, unknown>[] }>(`${BASE}${params}`);
  return (res.items ?? []).map(toRecord).sort((a, b) => a.sequenceId.localeCompare(b.sequenceId));
}

export async function getCounterById(id: string): Promise<CounterRecord | null> {
  try {
    const row = await adminFetch<Record<string, unknown>>(`${BASE}/${encodeURIComponent(id)}`);
    return toRecord(row);
  } catch {
    return null;
  }
}

export async function addCounter(data: CounterAddInput): Promise<string> {
  const res = await adminFetch<{ ok: boolean; id: string }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.id;
}

export async function updateCounter(id: string, data: CounterEditInput): Promise<void> {
  await adminFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCounter(id: string): Promise<void> {
  await adminFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
