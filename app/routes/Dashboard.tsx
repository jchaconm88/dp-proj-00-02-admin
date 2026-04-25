import { useMemo } from "react";
import { Link, NavLink, Outlet, redirect } from "react-router";
import type { Route } from "./+types/Dashboard";
import menuData from "~/data/menu.json";
import { getAuthUser } from "~/lib/get-auth-user";

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

function primeIconClass(name?: string): string {
  const base = name && /^[a-z0-9-]+$/i.test(name) ? name : "folder";
  return `pi pi-${base} h-4 w-4`.trim();
}

export default function DashboardLayout() {
  // Placeholder: en siguientes pasos conectamos permisos reales (permissionCodes -> isGranted),
  // y reusamos exactamente el mismo filtrado de menú que en Web vía paquetes compartidos.
  const effectivePermissions = useMemo(() => ["*"], []);
  const items = (menuData as MenuItemJson[]).filter((i) => i.enabled !== false);
  const home = items.find((i) => i.home) ?? items[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <aside className="w-64 border-r border-white/10 p-4">
          <Link to={home?.link ?? "/"} className="block text-lg font-black tracking-tight">
            dp-proj-00-02 Admin
          </Link>
          <nav className="mt-6 space-y-1">
            {items.map((it) => (
              <NavLink
                key={it.title}
                to={it.link ?? "/"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    isActive ? "bg-white/10" : "hover:bg-white/5",
                  ].join(" ")
                }
              >
                <i className={primeIconClass(it.icon)} aria-hidden />
                <span>{it.title}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70">
            Permisos efectivos: <code>{JSON.stringify(effectivePermissions)}</code>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

