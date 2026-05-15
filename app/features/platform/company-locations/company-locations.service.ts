import { adminFetch } from "~/lib/backend-client";
import type { CompanyLocationInput, CompanyLocationRecord } from "./company-locations.types";

const BASE = "/admin/platform/company-locations";

export async function getCompanyLocations(companyId: string): Promise<CompanyLocationRecord[]> {
  const cid = String(companyId ?? "").trim();
  if (!cid) return [];
  return adminFetch<CompanyLocationRecord[]>(`${BASE}?companyId=${encodeURIComponent(cid)}`);
}

export async function createCompanyLocation(data: CompanyLocationInput): Promise<string> {
  const result = await adminFetch<{ ok: boolean; id: string }>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return String(result.id ?? "");
}

export async function updateCompanyLocation(id: string, data: Partial<CompanyLocationInput>): Promise<void> {
  const sid = String(id ?? "").trim();
  if (!sid) throw new Error("locationId_required");
  await adminFetch(`${BASE}/${encodeURIComponent(sid)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyLocation(id: string, companyId: string): Promise<void> {
  const sid = String(id ?? "").trim();
  const cid = String(companyId ?? "").trim();
  if (!sid) throw new Error("locationId_required");
  if (!cid) throw new Error("companyId_required");
  await adminFetch(`${BASE}/${encodeURIComponent(sid)}?companyId=${encodeURIComponent(cid)}`, {
    method: "DELETE",
  });
}
