import type { DpTableDefColumn, DpTableDefColumnType } from "~/components/ui";
import type { StatusOption } from "~/components/ui";

interface ModulePermission {
  code: string;
  label: string;
  description: string;
}

interface ModuleColumn {
  order: number;
  name: string;
  header: string;
  filter: boolean;
  format?: string;
}

interface ModuleRecord {
  id: string;
  description: string;
  permissions: ModulePermission[];
  columns: ModuleColumn[];
}

const CRUD_PERMISSIONS: ModulePermission[] = [
  { code: "view", label: "Ver", description: "Permite consultar registros." },
  { code: "create", label: "Crear", description: "Permite crear registros." },
  { code: "edit", label: "Editar", description: "Permite editar registros." },
  { code: "delete", label: "Eliminar", description: "Permite eliminar registros." },
];

function withPermissions(
  id: string,
  description: string,
  columns: ModuleRecord["columns"],
  permissions: ModulePermission[] = CRUD_PERMISSIONS
): ModuleRecord {
  return { id, description, columns, permissions };
}

export const SYSTEM_MODULES_CATALOG: ModuleRecord[] = [
  withPermissions("admin-user", "Usuarios admin", [
    { order: 1, name: "id", header: "UID", filter: true },
    { order: 2, name: "email", header: "Email", filter: true },
    { order: 3, name: "displayName", header: "Nombre", filter: true },
    { order: 4, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("role", "Roles", [
    { order: 1, name: "name", header: "Nombre", filter: true },
    { order: 2, name: "description", header: "Descripción", filter: true },
  ]),
  withPermissions("role-permission", "Permisos de rol", [
    { order: 1, name: "moduleId", header: "Módulo", filter: true },
    { order: 2, name: "permissions", header: "Permisos", filter: true },
  ]),
  withPermissions("sequence", "Secuencias", [
    { order: 1, name: "entity", header: "Entidad", filter: true },
    { order: 2, name: "prefix", header: "Prefijo", filter: true },
    { order: 3, name: "digits", header: "Dígitos", filter: true },
    { order: 4, name: "format", header: "Formato", filter: true },
    { order: 5, name: "resetPeriod", header: "Reinicio", filter: true, format: "status" },
    { order: 6, name: "source", header: "Origen", filter: true, format: "status" },
  ]),
  withPermissions("company", "Empresas", [
    { order: 1, name: "name", header: "Nombre", filter: true },
    { order: 2, name: "status", header: "Estado", filter: true, format: "status" },
    { order: 3, name: "code", header: "Código", filter: true },
    { order: 4, name: "taxId", header: "RUC / Tax ID", filter: true },
    { order: 5, name: "companyUsers", header: "Miembros", filter: false },
    { order: 6, name: "companyLocations", header: "Sedes", filter: false },
  ]),
  withPermissions("company-user", "Miembros por empresa", [
    { order: 1, name: "emailLabel", header: "Usuario", filter: true },
    { order: 2, name: "rolesLabel", header: "Roles", filter: true },
    { order: 3, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("company-location", "Sedes de empresa", [
    { order: 1, name: "name", header: "Nombre", filter: true },
    { order: 2, name: "city", header: "Ciudad", filter: true },
    { order: 3, name: "district", header: "Distrito", filter: true },
    { order: 4, name: "address", header: "Dirección", filter: true },
  ]),
  withPermissions("company-role", "Roles por empresa", [
    { order: 1, name: "name", header: "Nombre", filter: true },
    { order: 2, name: "description", header: "Descripción", filter: true },
  ]),
  withPermissions("company-role-permission", "Permisos de rol por empresa", [
    { order: 1, name: "moduleId", header: "Módulo", filter: true },
    { order: 2, name: "permissions", header: "Permisos", filter: true },
  ]),
  withPermissions("web-user", "Usuarios web", [
    { order: 1, name: "id", header: "ID", filter: true },
    { order: 2, name: "email", header: "Email", filter: true },
    { order: 3, name: "displayName", header: "Nombre", filter: true },
    { order: 4, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("platform-company-user", "Company users (platform)", [
    { order: 1, name: "id", header: "ID", filter: true },
    { order: 2, name: "companyId", header: "Company ID", filter: true },
    { order: 3, name: "userId", header: "User ID", filter: true },
    { order: 4, name: "userDisplay", header: "Usuario", filter: true },
    { order: 5, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("counter", "Contadores", [
    { order: 1, name: "sequenceId", header: "Sequence ID", filter: true },
    { order: 2, name: "counter", header: "Contador", filter: true },
    { order: 3, name: "description", header: "Descripción", filter: true },
  ]),
  withPermissions("plan", "Planes", [
    { order: 1, name: "id", header: "ID", filter: true },
    { order: 2, name: "planId", header: "Plan ID", filter: true },
    { order: 3, name: "name", header: "Nombre", filter: true },
    { order: 4, name: "active", header: "Activo", filter: true, format: "status" },
  ]),
  withPermissions("subscription", "Suscripciones", [
    { order: 1, name: "id", header: "ID", filter: true },
    { order: 2, name: "planId", header: "Plan ID", filter: true },
    { order: 3, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("account-user", "Usuarios de cuenta", [
    { order: 1, name: "email", header: "Email", filter: true },
    { order: 2, name: "displayName", header: "Nombre", filter: true },
    { order: 3, name: "status", header: "Estado", filter: true, format: "status" },
  ]),
  withPermissions("metric-definition", "Definiciones de métrica", [
    { order: 1, name: "metricKey", header: "Metric Key", filter: true },
    { order: 2, name: "label", header: "Label", filter: true },
    { order: 3, name: "type", header: "Tipo", filter: true },
    { order: 4, name: "measureType", header: "Medición", filter: true },
    { order: 5, name: "target", header: "Target", filter: true, format: "status" },
    { order: 6, name: "source", header: "Source", filter: true, format: "status" },
    { order: 7, name: "readonly", header: "Readonly", filter: true, format: "status" },
  ]),
  withPermissions("card-definition", "Definiciones de card", [
    { order: 1, name: "cardKey", header: "Card Key", filter: true },
    { order: 2, name: "title", header: "Título", filter: true },
    { order: 3, name: "metricKey", header: "Metric Key", filter: true },
    { order: 4, name: "target", header: "Target", filter: true },
    { order: 5, name: "order", header: "Orden", filter: true },
    { order: 6, name: "visible", header: "Visible", filter: true, format: "status" },
    { order: 7, name: "source", header: "Source", filter: true, format: "status" },
    { order: 8, name: "readonly", header: "Readonly", filter: true, format: "status" },
  ]),
  withPermissions("chart-definition", "Definiciones de chart", [
    { order: 1, name: "chartKey", header: "Chart Key", filter: true },
    { order: 2, name: "title", header: "Título", filter: true },
    { order: 3, name: "chartType", header: "Tipo", filter: true },
    { order: 4, name: "target", header: "Target", filter: true },
    { order: 5, name: "source", header: "Source", filter: true, format: "status" },
    { order: 6, name: "readonly", header: "Readonly", filter: true, format: "status" },
  ]),
  withPermissions("card-override", "Overrides de card", [
    { order: 1, name: "title", header: "Título", filter: true },
    { order: 2, name: "visible", header: "Visible", filter: true },
  ]),
  withPermissions("chart-override", "Overrides de chart", [
    { order: 1, name: "title", header: "Título", filter: true },
    { order: 2, name: "visible", header: "Visible", filter: true },
  ]),
];

export function getSystemModuleById(id: string): ModuleRecord | null {
  const match = SYSTEM_MODULES_CATALOG.find((m) => m.id === id);
  return match ? { ...match, permissions: [...match.permissions], columns: [...match.columns] } : null;
}

export function getSystemModules(): ModuleRecord[] {
  return SYSTEM_MODULES_CATALOG
    .map((m) => ({ ...m, permissions: [...m.permissions], columns: [...m.columns] }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

const FORMAT_TO_TYPE: Record<string, DpTableDefColumnType> = {
  status: "status",
  label: "label",
  bool: "bool",
  date: "date",
  datetime: "datetime",
};

export function moduleTableDef(
  moduleId: string,
  typeOptions?: Record<string, Record<string, string | StatusOption>>
): DpTableDefColumn[] {
  const mod = getSystemModuleById(moduleId);
  if (!mod) return [];
  return mod.columns.map((col) => ({
    header: col.header,
    column: col.name,
    order: col.order,
    display: true,
    filter: col.filter,
    type: col.format ? FORMAT_TO_TYPE[col.format] : undefined,
    typeOptions: typeOptions?.[col.name],
  }));
}
