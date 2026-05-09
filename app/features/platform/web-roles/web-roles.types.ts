import type { RolePermissions } from "~/features/system/roles/roles.types";

export type WebRoleSource = "default" | "custom";

/** Rol merge (catálogo + doc en colección `roles` del proyecto Web). */
export type WebCompanyRoleRecord = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  permission?: string[];
  accountId?: string;
  source?: WebRoleSource;
  readonly?: boolean;
  platform: string[]; // ["web"] o ["admin"] o ["admin", "web"]
};
