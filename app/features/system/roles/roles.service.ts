import type { RolePermissions, RoleRecord } from "./roles.types";
import { adminFetch } from "~/lib/backend-client";

type RoleDoc = {
  accountId?: string;
  name?: string;
  description?: string;
  permissions?: unknown;
  permission?: string[];
};

function normalizePermissions(raw: unknown): RolePermissions {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RolePermissions = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = value.filter((c): c is string => typeof c === "string");
  }
  return out;
}

function toRoleRecord(id: string, data: RoleDoc & { source?: unknown; readonly?: unknown }): RoleRecord {
  return {
    id,
    accountId: String(data.accountId ?? "").trim(),
    name: String(data.name ?? "").trim(),
    description: String(data.description ?? "").trim(),
    permissions: normalizePermissions(data.permissions),
    permission: Array.isArray(data.permission) ? data.permission : [],
    source: data.source === "custom" ? "custom" : "default",
    readonly: data.readonly === true,
  };
}

export async function listRoles(accountId: string): Promise<RoleRecord[]> {
  void accountId;
  const rows = await adminFetch<any[]>("/admin/platform/roles");
  return rows.map((d) => toRoleRecord(String(d.id), d as RoleDoc));
}

export async function getRoleById(id: string): Promise<RoleRecord | null> {
  try {
    const row = await adminFetch<any>(`/admin/platform/roles/${id}`);
    return toRoleRecord(String(row.id ?? id), row as RoleDoc);
  } catch {
    return null;
  }
}

export async function createRole(args: { accountId: string; name: string; description: string }): Promise<string> {
  const out = await adminFetch<{ ok: boolean; id: string }>("/admin/platform/roles", {
    method: "POST",
    body: JSON.stringify({
      accountId: args.accountId,
      name: args.name,
      description: args.description,
      permissions: {},
    } satisfies RoleDoc),
  });
  return out.id;
}

export async function updateRole(id: string, data: Partial<Omit<RoleRecord, "id">>): Promise<void> {
  await adminFetch(`/admin/platform/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateRolePermissions(id: string, permissions: RolePermissions): Promise<void> {
  await adminFetch(`/admin/platform/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

export async function deleteRole(id: string): Promise<void> {
  await adminFetch(`/admin/platform/roles/${id}`, { method: "DELETE" });
}

