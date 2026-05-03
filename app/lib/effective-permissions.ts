import { collectPermissionCodes } from "~/lib/permission-codes";
import type { AdminRoleRecord } from "./admin-roles.service";

/**
 * Une códigos de permisos a partir de roles del usuario.
 * Modelo igual que Web/Functions: permisos efectivos salen de `roles.permissions`.
 */
export function getEffectivePermissions(args: {
  roleIds: string[];
  roleNames: string[];
  roles: AdminRoleRecord[];
}): string[] {
  const { roleIds, roleNames, roles } = args;
  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const byName = new Map(roles.map((r) => [r.name.toLowerCase(), r]));
  let hasWildcard = false;
  const set = new Set<string>();

  for (const rid of roleIds ?? []) {
    const role = roleMap.get(String(rid)) ?? byName.get(String(rid).toLowerCase());
    const perms = role ? collectPermissionCodes(role) : [];
    if (perms.includes("*")) hasWildcard = true;
    perms.forEach((p) => set.add(p));
  }
  for (const roleName of roleNames ?? []) {
    const role = byName.get(String(roleName).toLowerCase());
    const perms = role ? collectPermissionCodes(role) : [];
    if (perms.includes("*")) hasWildcard = true;
    perms.forEach((p) => set.add(p));
  }

  if (hasWildcard) return ["*"];
  return Array.from(set);
}

