import { adminFetch } from "~/lib/backend-client";
import type { ResetPeriod, SequenceAddInput, SequenceEditInput, SequenceRecord } from "./sequences.types";

const BASE = "/admin/system/admin-sequences";

function parseResetPeriod(value: unknown): ResetPeriod {
  const v = String(value ?? "").trim();
  return v === "never" || v === "yearly" || v === "monthly" || v === "daily" ? v : "yearly";
}

function toRecord(data: Record<string, unknown>): SequenceRecord {
  return {
    id: String(data.id ?? ""),
    accountId: String(data.accountId ?? "").trim() || undefined,
    entity: String(data.entity ?? "").trim(),
    prefix: String(data.prefix ?? "").trim(),
    digits: Number(data.digits) || 6,
    format: String(data.format ?? "{prefix}-{number}").trim() || "{prefix}-{number}",
    resetPeriod: parseResetPeriod(data.resetPeriod),
    allowManualOverride: data.allowManualOverride === true,
    preventGaps: data.preventGaps === true,
    active: data.active !== false,
    source: data.source === "custom" ? "custom" : "default",
    readonly: data.readonly === true,
  };
}

export async function getSequences(): Promise<SequenceRecord[]> {
  const rows = await adminFetch<Record<string, unknown>[]>(BASE);
  return rows.map(toRecord).sort((a, b) => a.entity.localeCompare(b.entity));
}

export async function getSequenceById(id: string): Promise<SequenceRecord | null> {
  try {
    const row = await adminFetch<Record<string, unknown>>(`${BASE}/${encodeURIComponent(id)}`);
    return toRecord(row);
  } catch {
    return null;
  }
}

export async function addSequence(data: SequenceAddInput): Promise<string> {
  const res = await adminFetch<{ ok: boolean; id: string }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.id;
}

export async function updateSequence(id: string, data: SequenceEditInput): Promise<void> {
  await adminFetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSequence(id: string): Promise<void> {
  await adminFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getActiveSequenceByEntity(entity: string): Promise<SequenceRecord | null> {
  const normalized = String(entity ?? "").trim();
  if (!normalized) return null;
  const items = await getSequences();
  return items.find((s) => s.entity === normalized && s.active !== false) ?? null;
}

export async function generateSequenceCode(currentCode: string, entity: string): Promise<string> {
  const res = await adminFetch<{ code: string }>(`${BASE}/generate-code`, {
    method: "POST",
    body: JSON.stringify({
      currentCode: String(currentCode ?? ""),
      entity: String(entity ?? "").trim(),
    }),
  });
  if (typeof res.code !== "string" || !res.code.trim()) {
    throw new Error("No se recibió un código válido del servidor.");
  }
  return res.code.trim();
}
