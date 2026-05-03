import { adminFetch } from "./backend-client";

export type AdminRoleRecord = {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  permissions: Record<string, string[]>;
  permission: string[];
};

export async function listAdminRoles(accountId: string): Promise<AdminRoleRecord[]> {
  // El backend ya filtra por accountId autenticado; accountId se mantiene en firma por compatibilidad.
  void accountId;
  const rows = await adminFetch<any[]>("/admin/platform/roles");
  return rows.map((data) => ({
    id: String((data as any).id ?? "").trim(),
    accountId: String((data as any).accountId ?? "").trim() || undefined,
    name: String((data as any).name ?? ""),
    description: String((data as any).description ?? ""),
    permissions:
      (data as any).permissions && typeof (data as any).permissions === "object"
        ? ((data as any).permissions as Record<string, string[]>)
        : {},
    permission: Array.isArray((data as any).permission) ? (data as any).permission.map(String) : [],
  }));
}

