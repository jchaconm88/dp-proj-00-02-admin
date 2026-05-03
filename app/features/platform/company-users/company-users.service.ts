import { adminFetch } from "~/lib/backend-client";
import type { CompanyUserRecord } from "./company-users.types";
export type { CompanyUserRecord } from "./company-users.types";

const BASE = "/admin/platform/company-users";

function normalizeCompanyUser(id: string, raw: Record<string, unknown>): CompanyUserRecord {
  const status = String(raw.status ?? "active").trim() === "inactive" ? "inactive" : "active";
  return {
    id,
    companyId: String(raw.companyId ?? ""),
    accountId: raw.accountId != null ? String(raw.accountId) : undefined,
    userId: String(raw.userId ?? ""),
    user: raw.user != null ? String(raw.user) : undefined,
    usersDocId: raw.usersDocId != null ? String(raw.usersDocId) : undefined,
    userEmail: raw.userEmail != null ? String(raw.userEmail) : undefined,
    userDisplayName: raw.userDisplayName != null ? String(raw.userDisplayName) : undefined,
    roleIds: Array.isArray(raw.roleIds) ? raw.roleIds.map((x) => String(x)) : [],
    roleNames: Array.isArray(raw.roleNames) ? raw.roleNames.map((x) => String(x)) : [],
    status,
  };
}

export async function getCompanyUsers(): Promise<CompanyUserRecord[]> {
  const rows = await adminFetch<Record<string, unknown>[]>(BASE);
  return rows.map((d) => normalizeCompanyUser(String(d.id ?? ""), d));
}

export async function getCompanyUsersByCompanyId(companyId: string): Promise<CompanyUserRecord[]> {
  const cid = String(companyId ?? "").trim();
  if (!cid) return [];
  const q = `?companyId=${encodeURIComponent(cid)}`;
  const rows = await adminFetch<Record<string, unknown>[]>(`${BASE}${q}`);
  return rows.map((d) => normalizeCompanyUser(String(d.id ?? ""), d));
}

export async function createCompanyUser(data: {
  companyId: string;
  userId: string;
  user?: string;
  usersDocId?: string;
  userEmail?: string;
  userDisplayName?: string;
  roleIds: string[];
  roleNames: string[];
  status: "active" | "inactive";
}): Promise<string> {
  const res = await adminFetch<{ id?: string }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return String(res?.id ?? `${data.companyId}_${data.userId}`);
}

export async function updateCompanyUser(
  id: string,
  data: Partial<
    Pick<
      CompanyUserRecord,
      "user" | "usersDocId" | "userEmail" | "userDisplayName" | "roleIds" | "roleNames" | "status"
    >
  >
): Promise<void> {
  await adminFetch<void>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyUser(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
