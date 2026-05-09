import type { RolePermissions } from "~/features/system/roles/roles.types";
import { adminFetch } from "~/lib/backend-client";
import type { WebCompanyRoleRecord } from "./web-roles.types";

const BASE = "/admin/platform/web-roles";

function withCompanyQuery(path: string, companyId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}companyId=${encodeURIComponent(companyId.trim())}`;
}

function normalize(id: string, data: Record<string, unknown>): WebCompanyRoleRecord {
  return {
    id,
    companyId: String(data.companyId ?? "").trim(),
    name: String(data.name ?? "").trim(),
    description: String(data.description ?? "").trim(),
    permissions:
      data.permissions && typeof data.permissions === "object"
        ? (data.permissions as RolePermissions)
        : {},
    permission: Array.isArray(data.permission) ? (data.permission as string[]) : undefined,
    accountId: String(data.accountId ?? "").trim() || undefined,
    source: data.source === "custom" ? "custom" : "default",
    readonly: data.readonly === true,
    platform: Array.isArray(data.platform) ? data.platform.map((x) => String(x)) : [],
  };
}

export async function listWebCompanyRoles(companyId: string): Promise<WebCompanyRoleRecord[]> {
  const q = `?companyId=${encodeURIComponent(companyId.trim())}`;
  const rows = await adminFetch<Record<string, unknown>[]>(`${BASE}${q}`);
  return rows.map((d) => normalize(String(d.id), d));
}

export async function getWebCompanyRoleById(id: string, companyId?: string | null): Promise<WebCompanyRoleRecord | null> {
  try {
    const cid = String(companyId ?? "").trim();
    const path = cid ? withCompanyQuery(`${BASE}/${encodeURIComponent(id)}`, cid) : `${BASE}/${encodeURIComponent(id)}`;
    const row = await adminFetch<Record<string, unknown>>(path);
    return normalize(String(row.id ?? id), row);
  } catch {
    return null;
  }
}

export async function createWebCompanyRole(args: {
  companyId: string;
  name: string;
  description: string;
  permissions?: RolePermissions;
  permission?: string[];
  platform?: string[];
}): Promise<string> {
  const res = await adminFetch<{ ok: boolean; id: string }>(BASE, {
    method: "POST",
    body: JSON.stringify({
      companyId: args.companyId.trim(),
      name: args.name.trim(),
      description: args.description.trim(),
      permissions: args.permissions ?? {},
      permission: args.permission ?? [],
      platform: args.platform ?? [],
    }),
  });
  return res.id;
}

export async function updateWebCompanyRole(
  id: string,
  data: Partial<Pick<WebCompanyRoleRecord, "name" | "description" | "permissions" | "permission" | "platform">>,
  companyId?: string | null
): Promise<void> {
  const cid = String(companyId ?? "").trim();
  const path = cid ? withCompanyQuery(`${BASE}/${encodeURIComponent(id)}`, cid) : `${BASE}/${encodeURIComponent(id)}`;
  await adminFetch(path, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWebCompanyRole(id: string, companyId?: string | null): Promise<void> {
  const cid = String(companyId ?? "").trim();
  const path = cid ? withCompanyQuery(`${BASE}/${encodeURIComponent(id)}`, cid) : `${BASE}/${encodeURIComponent(id)}`;
  await adminFetch(path, { method: "DELETE" });
}
