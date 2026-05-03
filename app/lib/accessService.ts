import { getModule } from "~/features/system/admin-modules";
import { hasPermissionCode } from "~/lib/permission-codes";

export function isGranted(effectivePermissions: string[], action: string, moduleName: string): boolean {
  return hasPermissionCode(effectivePermissions, action, moduleName);
}

/**
 * Para navegación de menú: basta con cualquier permiso dentro del módulo.
 * Deriva acciones del catálogo `admin-modules` del backend.
 */
export async function canNavigateToModuleAsync(effectivePermissions: string[], moduleName: string): Promise<boolean> {
  if (effectivePermissions.includes("*")) return true;
  const mod = await getModule(moduleName);
  const actions = mod?.permissions?.map((p) => p.code).filter(Boolean) ?? ["view", "edit", "create", "delete"];
  for (const action of actions) {
    if (hasPermissionCode(effectivePermissions, action, moduleName)) return true;
  }
  return false;
}

export function canNavigateToModule(effectivePermissions: string[], moduleName: string): boolean {
  if (effectivePermissions.includes("*")) return true;
  const actions = ["view", "edit", "create", "delete"];
  for (const action of actions) {
    if (hasPermissionCode(effectivePermissions, action, moduleName)) return true;
  }
  return false;
}
