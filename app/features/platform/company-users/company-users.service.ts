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
    webRoleIds: Array.isArray(raw.webRoleIds) ? raw.webRoleIds.map((x) => String(x)) : [],
    webRoleNames: Array.isArray(raw.webRoleNames) ? raw.webRoleNames.map((x) => String(x)) : [],
    status,
    platform: Array.isArray(raw.platform) ? raw.platform.map((x) => String(x)) : [],
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
  webRoleIds: string[];
  webRoleNames: string[];
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
      "user" | "usersDocId" | "userEmail" | "userDisplayName" | "webRoleIds" | "webRoleNames" | "status"
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
