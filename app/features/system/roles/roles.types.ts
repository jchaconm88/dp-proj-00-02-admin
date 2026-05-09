/** Por cada módulo (id), lista de códigos de permiso asignados al rol. */
export type RolePermissions = Record<string, string[]>;

export type AdminRoleSource = "default" | "custom";

export type RoleRecord = {
  id: string;
  accountId: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  /** Campo legacy para compatibilidad (no se usa en Admin). */
  permission?: string[];
  source?: AdminRoleSource;
  readonly?: boolean;
  platform: string[]; // ["admin"] o ["web"] o ["admin", "web"]
};

