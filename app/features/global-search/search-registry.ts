import menuData from "~/data/menu.json";
import type { SearchEntry, EntitySearchConfig, SearchRegistry } from "./global-search.types";

interface MenuItem {
  title?: string;
  icon?: string;
  link?: string;
  permission?: string[];
  group?: boolean;
  children?: MenuItem[];
}

function flattenMenu(items: MenuItem[], parentCategory?: string): SearchEntry[] {
  const result: SearchEntry[] = [];

  for (const item of items) {
    if (item.group) {
      if (item.children) {
        result.push(...flattenMenu(item.children, item.title));
      }
      continue;
    }

    if (item.link && item.link !== "#" && item.permission) {
      result.push({
        id: `nav-${item.link.replace(/\//g, "-").replace(/^-/, "") || "home"}`,
        title: item.title ?? "",
        keywords: [],
        path: item.link,
        icon: item.icon ?? "circle",
        category: parentCategory ?? "General",
        permission: { action: item.permission[0], module: item.permission[1] },
        type: "navigation",
      });
    }

    if (item.children) {
      result.push(...flattenMenu(item.children, item.title));
    }
  }

  return result;
}

const MANUAL_ENTRIES: SearchEntry[] = [
  {
    id: "qa-create-account",
    title: "Crear cuenta",
    keywords: ["nueva cuenta", "agregar cuenta", "registrar cuenta"],
    path: "/account",
    icon: "building",
    category: "Admin",
    permission: { action: "create", module: "account" },
    type: "quick-action",
  },
  {
    id: "qa-create-company",
    title: "Crear empresa",
    keywords: ["nueva empresa", "agregar empresa", "registrar empresa"],
    path: "/platform/companies/add",
    icon: "globe",
    category: "Admin",
    permission: { action: "create", module: "company" },
    type: "quick-action",
  },
  {
    id: "qa-create-admin-user",
    title: "Crear usuario admin",
    keywords: ["nuevo usuario", "agregar usuario", "registrar admin"],
    path: "/users",
    icon: "user-plus",
    category: "Admin",
    permission: { action: "create", module: "user" },
    type: "quick-action",
  },
  {
    id: "qa-create-role",
    title: "Crear rol",
    keywords: ["nuevo rol", "agregar rol", "registrar rol"],
    path: "/roles",
    icon: "shield",
    category: "Admin",
    permission: { action: "create", module: "role" },
    type: "quick-action",
  },
  {
    id: "qa-create-plan",
    title: "Crear plan",
    keywords: ["nuevo plan", "agregar plan", "registrar plan"],
    path: "/plans/add",
    icon: "box",
    category: "Admin",
    permission: { action: "create", module: "plan" },
    type: "quick-action",
  },
  {
    id: "qa-create-subscription",
    title: "Crear suscripcion",
    keywords: ["nueva suscripcion", "agregar suscripcion", "registrar suscripcion"],
    path: "/subscriptions/add",
    icon: "credit-card",
    category: "Admin",
    permission: { action: "create", module: "subscription" },
    type: "quick-action",
  },
];

const ENTITY_CONFIGS: EntitySearchConfig[] = [
  {
    id: "entity-account",
    entityId: "account",
    fields: ["name", "status"],
    detailPath: "/account",
    icon: "building",
    permission: { action: "view", module: "account" },
    collection: "accounts",
  },
  {
    id: "entity-company",
    entityId: "company",
    fields: ["name", "ruc", "status"],
    detailPath: "/platform/companies/edit/:id",
    icon: "globe",
    permission: { action: "view", module: "company" },
    collection: "companies",
  },
  {
    id: "entity-admin-user",
    entityId: "admin-user",
    fields: ["displayName", "email", "status"],
    detailPath: "/users",
    icon: "user",
    permission: { action: "view", module: "user" },
    collection: "users",
  },
  {
    id: "entity-subscription",
    entityId: "subscription",
    fields: ["planId", "status"],
    detailPath: "/subscriptions/edit/:id",
    icon: "credit-card",
    permission: { action: "view", module: "subscription" },
    collection: "subscriptions",
  },
  {
    id: "entity-plan",
    entityId: "plan",
    fields: ["name"],
    detailPath: "/plans/edit/:id",
    icon: "box",
    permission: { action: "view", module: "plan" },
    collection: "saas-plans",
  },
  {
    id: "entity-role",
    entityId: "role",
    fields: ["name", "description"],
    detailPath: "/roles/:id",
    icon: "shield",
    permission: { action: "view", module: "role" },
    collection: "roles",
  },
  {
    id: "entity-company-user",
    entityId: "company-user",
    fields: ["displayName", "email", "status"],
    detailPath: "/company-users",
    icon: "users",
    permission: { action: "view", module: "company-user" },
    collection: "company-users",
  },
  {
    id: "entity-web-user",
    entityId: "web-user",
    fields: ["displayName", "email", "status"],
    detailPath: "/platform/users/edit/:id",
    icon: "user",
    permission: { action: "view", module: "web-user" },
    collection: "users",
  },
];

export function buildSearchRegistry(): SearchRegistry {
  const menuEntries = flattenMenu(menuData as MenuItem[]);
  const allEntries = [...menuEntries, ...MANUAL_ENTRIES];

  const seen = new Map<string, SearchEntry>();
  for (const entry of allEntries) {
    if (!entry.id || !entry.title || !entry.path) {
      console.warn("[global-search] invalid entry excluded:", entry.id ?? "(no id)");
      continue;
    }
    seen.set(entry.id, entry);
  }

  return {
    entries: Array.from(seen.values()),
    entityConfigs: ENTITY_CONFIGS,
  };
}
