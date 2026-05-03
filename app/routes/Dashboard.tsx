import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, redirect, useLocation, useNavigate, useNavigation } from "react-router";
import type { Route } from "./+types/Dashboard";
import menuData from "~/data/menu.json";
import { getAuthUser } from "~/lib/get-auth-user";
import { useAuth } from "~/lib/auth-context";
import { useTheme } from "~/lib/theme-context";
import { canNavigateToModule, isGranted } from "~/lib/accessService";
import { getEffectivePermissions } from "~/lib/effective-permissions";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { listAdminRoles, type AdminRoleRecord } from "~/lib/admin-roles.service";

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const user = await getAuthUser();
  if (!user) throw redirect("/login");
  return {};
}

type MenuItemJson = {
  title: string;
  enabled?: boolean;
  icon?: string;
  link?: string;
  home?: boolean;
  group?: boolean;
  permission?: string[];
  children?: { title: string; link?: string; permission?: string[] }[];
};

/** Clase PrimeIcons (alineado con Web). */
function primeIconClass(name?: string, className = "h-5 w-5 shrink-0"): string {
  const base = name && /^[a-z0-9-]+$/i.test(name) ? name : "folder";
  return `pi pi-${base} ${className}`.trim();
}

const HEADER_HEIGHT = 48;

function menuToSections(menu: MenuItemJson[]): { title?: string; items: MenuItemJson[] }[] {
  const sections: { title?: string; items: MenuItemJson[] }[] = [];
  let current: { title?: string; items: MenuItemJson[] } = { items: [] };
  for (const item of menu) {
    if (item.group === true) {
      if (current.items.length > 0) sections.push(current);
      current = { title: item.title, items: [] };
    } else if (item.enabled !== false) {
      current.items.push(item);
    }
  }
  if (current.items.length > 0) sections.push(current);
  return sections;
}

function canShowItem(permission: string[] | undefined, effectivePermissions: string[]): boolean {
  if (effectivePermissions.includes("*")) return true;
  if (!permission?.length) return true;
  if (effectivePermissions.length === 0) return false;
  const action = permission[0];
  const moduleName = permission[1] ?? permission[0];
  if (action === "view") {
    return canNavigateToModule(effectivePermissions, moduleName);
  }
  return isGranted(effectivePermissions, action, moduleName);
}

function filterMenu(items: MenuItemJson[], effectivePermissions: string[]): MenuItemJson[] {
  return items
    .filter((item) => item.enabled !== false && canShowItem(item.permission, effectivePermissions))
    .map((item) => {
      if (item.children?.length) {
        return {
          ...item,
          children: item.children.filter((c) => canShowItem(c.permission, effectivePermissions)),
        };
      }
      return item;
    })
    .filter((item) => (item.children == null ? true : item.children.length > 0));
}

function MenuLoadingBlock({ sidebarOpen }: { sidebarOpen: boolean }) {
  return (
    <div className={`pb-4 ${sidebarOpen ? "px-2" : "px-0"}`}>
      {sidebarOpen && (
        <div className="mb-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--dp-menu-text)] opacity-70">
          Cargando…
        </div>
      )}

      <div className={`flex ${sidebarOpen ? "items-start" : "items-center justify-center"} gap-3 px-3 py-3`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-[var(--dp-tertiary)]" />
        {sidebarOpen && (
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-white/5" />
            <div className="h-4 w-28 rounded bg-white/5" />
            <div className="h-4 w-36 rounded bg-white/5" />
          </div>
        )}
      </div>

      {sidebarOpen && (
        <div className="space-y-2 px-3 pb-2">
          <div className="h-9 rounded-xl bg-white/5" />
          <div className="h-9 rounded-xl bg-white/5" />
          <div className="h-9 rounded-xl bg-white/5" />
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const pathname = useLocation().pathname;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminAccountId, setAdminAccountId] = useState<string | null>(null);
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userRoleIds, setUserRoleIds] = useState<string[]>([]);
  const [userRoleNames, setUserRoleNames] = useState<string[]>([]);
  const adminUserCheckedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.uid) return;
      let mem = null as Awaited<ReturnType<typeof getMyAdminUser>>;
      try {
        mem = await getMyAdminUser(user.uid);
      } catch {
        mem = null;
      }
      if (cancelled) return;
      adminUserCheckedRef.current = true;
      if (!mem || mem.status !== "active" || !mem.accountId) {
        navigate("/onboarding");
        return;
      }
      setAdminAccountId(mem.accountId || null);
      setUserRoleIds(mem.roleIds ?? []);
      setUserRoleNames(mem.roleNames ?? []);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!adminAccountId) {
        setRoles([]);
        return;
      }
      setRolesLoading(true);
      try {
        const next = await listAdminRoles(adminAccountId);
        if (!cancelled) setRoles(next);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [adminAccountId]);

  const effectivePermissions = useMemo(
    () =>
      getEffectivePermissions({
        roleIds: userRoleIds,
        roleNames: userRoleNames,
        roles,
      }),
    [userRoleIds, userRoleNames, roles]
  );

  const menuLoading = !adminUserCheckedRef.current || rolesLoading;
  const filteredMenu = useMemo(
    () => filterMenu(menuData as MenuItemJson[], effectivePermissions),
    [effectivePermissions]
  );
  const sections = useMemo(() => menuToSections(filteredMenu), [filteredMenu]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(["Sistema"]));

  const toggleExpanded = (title: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--dp-surface)] text-[var(--dp-on-surface)] flex items-center justify-center p-6">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--dp-outline-soft)] bg-[var(--dp-surface-high)]/60 px-5 py-6 text-sm font-semibold text-[var(--dp-on-surface-soft)]">
          <i className="pi pi-spin pi-spinner text-base" aria-hidden />
          <span>Cargando…</span>
        </div>
      </div>
    );
  }

  // En refresh puede existir una ventana corta donde authLoading ya terminó
  // pero el user aún no está disponible; nunca renderizar pantalla en blanco.
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--dp-surface)] text-[var(--dp-on-surface)] flex items-center justify-center p-6">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--dp-outline-soft)] bg-[var(--dp-surface-high)]/60 px-5 py-6 text-sm font-semibold text-[var(--dp-on-surface-soft)]">
          <i className="pi pi-spin pi-spinner text-base" aria-hidden />
          <span>Verificando sesión…</span>
        </div>
      </div>
    );
  }

  const busy = navigation.state !== "idle";

  const themes = [
    { name: "Claro", code: "light" },
    { name: "Oscuro", code: "dark" },
  ];

  const activeMenuTitle = useMemo(() => {
    let best: string | null = null;
    let bestLen = 0;
    for (const section of sections) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        for (const child of item.children) {
          const link = (child.link ?? "").trim();
          if (!link || link === "#") continue;
          if (pathname === link || pathname.startsWith(link + "/")) {
            if (link.length > bestLen) {
              bestLen = link.length;
              best = item.title;
            }
          }
        }
      }
    }
    return best;
  }, [sections, pathname]);

  useEffect(() => {
    if (activeMenuTitle) setExpandedKeys(new Set([activeMenuTitle]));
  }, [activeMenuTitle]);

  return (
    <div className="min-h-screen bg-[var(--dp-surface)] text-[var(--dp-on-surface)]">
      {/* Sidebar estilo Web */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[var(--dp-shell-surface)] backdrop-blur-2xl transition-[width] duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden py-4">
          {sidebarOpen && (
            <div className="px-4 pb-2">
              <Link to="/" className="group min-w-0">
                <div className="rounded-xl border border-white/10 bg-[var(--dp-surface-high)]/55 px-3 py-3">
                  <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--dp-tertiary)]">
                    Admin
                  </div>
                  <div className="mt-1 text-sm font-black tracking-tight text-[var(--dp-on-surface)]">
                    dp-proj-00-02
                  </div>
                </div>
              </Link>
            </div>
          )}
          {!sidebarOpen && (
            <div className="flex justify-center pb-3">
              <Link
                to="/"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[var(--dp-surface-high)]/60 text-[var(--dp-tertiary)]"
                title="Inicio"
              >
                <i className="pi pi-box" aria-hidden />
              </Link>
            </div>
          )}

          <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden py-2">
            {menuLoading ? (
              <MenuLoadingBlock sidebarOpen={sidebarOpen} />
            ) : (
              sections.map((section, idx) => (
                <div key={idx} className={`pb-4 ${sidebarOpen ? "px-2" : "px-0"}`}>
                  {sidebarOpen && section.title && (
                    <div className="mb-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--dp-menu-text)]">
                      {section.title}
                    </div>
                  )}
                  <nav className="space-y-0.5">
                    {section.items.map((item, i) => {
                      const hasChildren = item.children && item.children.length > 0;
                      const isExpanded = hasChildren && expandedKeys.has(item.title);
                      const href = item.link ?? "#";
                      const isActive = href !== "#" && (pathname === href || pathname.startsWith(href + "/"));

                      if (sidebarOpen) {
                        if (hasChildren) {
                          return (
                            <div key={i}>
                              <button
                                type="button"
                                onClick={() => toggleExpanded(item.title)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--dp-menu-text)] transition-all hover:bg-white/5 hover:text-[var(--dp-menu-text-strong)]"
                              >
                                <i className={primeIconClass(item.icon)} aria-hidden />
                                <span className="flex-1">{item.title}</span>
                                <i
                                  className={`pi shrink-0 opacity-70 ${isExpanded ? "pi-chevron-down h-4 w-4" : "pi-chevron-right h-4 w-4"}`}
                                  aria-hidden
                                />
                              </button>
                              {isExpanded && (
                                <div className="ml-4 border-l border-white/10 pl-2">
                                  {item.children!.map((child, j) => {
                                    const childHref = child.link ?? "#";
                                    return (
                                      <NavLink
                                        key={j}
                                        to={childHref}
                                        end={false}
                                        className={({ isActive }) =>
                                          `mb-0.5 flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors no-underline ${
                                            isActive
                                              ? "border-r-2 border-[var(--dp-tertiary)] bg-[color-mix(in_srgb,var(--dp-tertiary)_14%,transparent)] font-semibold text-[var(--dp-tertiary)]"
                                              : "text-[var(--dp-menu-text)] hover:bg-white/5 hover:text-[var(--dp-menu-text-strong)]"
                                          }`
                                        }
                                      >
                                        {child.title}
                                      </NavLink>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={i}
                            to={href}
                            title={item.title}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all no-underline ${
                              isActive
                                ? "border-r-2 border-[var(--dp-tertiary)] bg-[color-mix(in_srgb,var(--dp-tertiary)_14%,transparent)] font-semibold text-[var(--dp-tertiary)]"
                                : "text-[var(--dp-menu-text)] hover:bg-white/5 hover:text-[var(--dp-menu-text-strong)]"
                            }`}
                          >
                            {item.icon && <i className={primeIconClass(item.icon)} aria-hidden />}
                            <span className="flex-1">{item.title}</span>
                          </Link>
                        );
                      }

                      if (hasChildren) {
                        const firstChildLink = item.children!.find((c) => c.link && c.link !== "#");
                        return (
                          <div key={i} className="flex justify-center">
                            {firstChildLink ? (
                              <NavLink
                                to={firstChildLink.link!}
                                title={item.title}
                                className={({ isActive }) =>
                                  `flex flex-col items-center justify-center rounded-xl p-2.5 transition-colors ${
                                    isActive
                                      ? "bg-[color-mix(in_srgb,var(--dp-tertiary)_14%,transparent)] text-[var(--dp-tertiary)]"
                                      : "text-[var(--dp-menu-text)] hover:bg-white/5 hover:text-[var(--dp-menu-text-strong)]"
                                  }`
                                }
                              >
                                <i className={primeIconClass(item.icon)} aria-hidden />
                              </NavLink>
                            ) : (
                              <span
                                title={item.title}
                                className="flex flex-col items-center justify-center rounded-xl p-2.5 text-[var(--dp-menu-text)]"
                              >
                                <i className={primeIconClass(item.icon)} aria-hidden />
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={i} className="flex justify-center">
                          <Link
                            to={href}
                            title={item.title}
                            className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition-colors no-underline ${
                              isActive
                                ? "bg-[color-mix(in_srgb,var(--dp-tertiary)_14%,transparent)] text-[var(--dp-tertiary)]"
                                : "text-[var(--dp-menu-text)] hover:bg-white/5 hover:text-[var(--dp-menu-text-strong)]"
                            }`}
                          >
                            <i className={primeIconClass(item.icon)} aria-hidden />
                          </Link>
                        </div>
                      );
                    })}
                  </nav>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Botón de menú flotante */}
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="fixed top-8 z-[60] rounded-full border border-white/15 bg-[var(--dp-surface-high)]/90 p-1.5 text-[var(--dp-on-surface-soft)] shadow-lg shadow-black/20 transition hover:text-[var(--dp-tertiary)]"
        style={{ left: sidebarOpen ? "15.25rem" : "3.95rem" }}
        aria-label="Menú"
      >
        <i className={`pi ${sidebarOpen ? "pi-angle-left" : "pi-angle-right"} text-xs`} aria-hidden />
      </button>

      {/* Header compacto */}
      <header
        className="dp-glass-panel fixed top-0 z-40 flex items-center justify-between px-3 md:px-4"
        style={{
          height: HEADER_HEIGHT,
          left: sidebarOpen ? "16rem" : "5rem",
          width: sidebarOpen ? "calc(100% - 16rem)" : "calc(100% - 5rem)",
        }}
      >
        <div className="relative w-56 md:w-80">
          <i className="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--dp-on-surface-soft)]" />
          <input
            type="text"
            placeholder="Search systems..."
            className="w-full rounded-full border border-white/10 bg-[var(--dp-surface-low)]/70 py-1 pl-9 pr-4 text-sm text-[var(--dp-on-surface)] outline-none transition focus:border-[var(--dp-primary)]"
          />
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-full p-1.5 transition ${
              theme === "light"
                ? "bg-[color-mix(in_srgb,var(--dp-tertiary)_20%,transparent)] text-[var(--dp-tertiary)]"
                : "text-[var(--dp-on-surface-soft)] hover:bg-white/5"
            }`}
            aria-label="Tema claro"
          >
            <i className="pi pi-sun text-sm" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-full p-1.5 transition ${
              theme === "dark"
                ? "bg-[color-mix(in_srgb,var(--dp-tertiary)_20%,transparent)] text-[var(--dp-tertiary)]"
                : "text-[var(--dp-on-surface-soft)] hover:bg-white/5"
            }`}
            aria-label="Tema oscuro"
          >
            <i className="pi pi-moon text-sm" aria-hidden />
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[var(--dp-surface-low)]/70 px-2.5 py-1">
              <i className="pi pi-user text-xs text-[var(--dp-on-surface-soft)]" aria-hidden />
              <span className="max-w-40 truncate text-xs font-semibold text-[var(--dp-on-surface)]">
                {user.email || "Usuario"}
              </span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                await signOut();
                navigate("/login", { replace: true });
              }}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--dp-on-surface-soft)] transition hover:text-[var(--dp-tertiary)] disabled:opacity-60"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main
        className="min-h-screen overflow-auto p-5 md:p-6"
        style={{
          marginLeft: sidebarOpen ? "16rem" : "5rem",
          paddingTop: `calc(${HEADER_HEIGHT}px + 12px)`,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

