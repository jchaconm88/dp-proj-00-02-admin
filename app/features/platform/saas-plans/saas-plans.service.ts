import { adminFetch } from "~/lib/backend-client";
import type { SaasPlanRecord } from "./saas-plans.types";

const BASE = "/admin/platform/plans";

export async function getPlans(): Promise<SaasPlanRecord[]> {
  return adminFetch<SaasPlanRecord[]>(BASE);
}

export async function createPlan(
  data: Omit<SaasPlanRecord, "id"> & { id?: string }
): Promise<SaasPlanRecord> {
  return adminFetch<SaasPlanRecord>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlan(
  id: string,
  data: Partial<Omit<SaasPlanRecord, "id">>
): Promise<SaasPlanRecord> {
  return adminFetch<SaasPlanRecord>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePlan(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
