import { adminFetch } from "~/lib/backend-client";
import type { ModuleRecord } from "./admin-modules.types";

export async function getModules(): Promise<{ items: ModuleRecord[] }> {
  const items = await adminFetch<ModuleRecord[]>("/admin/platform/admin-modules");
  return { items };
}

export async function getModule(id: string): Promise<ModuleRecord | null> {
  try {
    return await adminFetch<ModuleRecord>(`/admin/platform/admin-modules/${id}`);
  } catch {
    return null;
  }
}
