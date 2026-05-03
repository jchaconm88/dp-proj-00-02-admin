import { auth } from "./firebase";
import { getAuthUser } from "./get-auth-user";

function getDevAccountIdOverride(): string {
  // Solo para DEV cuando el backend corre con ADMIN_AUTH_DISABLED=true
  // (usa header x-admin-account-id).
  try {
    const fromEnv = String((import.meta as any).env?.VITE_ADMIN_DEV_ACCOUNT_ID ?? "").trim();
    if (fromEnv) return fromEnv;
    const fromStorage = String(localStorage.getItem("dp_admin_account_id") ?? "").trim();
    return fromStorage;
  } catch {
    return "";
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const configured = String(import.meta.env.VITE_ADMIN_BACKEND_BASE_URL ?? "").trim().replace(/\/$/, "");
  // En dev, si no defines URL absoluta, usa el proxy de Vite (`/admin-backend/*` -> Cloud Run)
  // Ver `vite.config.ts` y `VITE_ADMIN_BACKEND_PROXY_TARGET`.
  const base =
    configured ||
    (import.meta.env.DEV ? "/admin-backend" : "");
  if (!base) {
    throw new Error("Falta VITE_ADMIN_BACKEND_BASE_URL (build/prod)");
  }
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  // En hard reload, `currentUser` puede ser null hasta que Firebase restaure sesión.
  const user = auth.currentUser ?? (await getAuthUser());
  if (!user) {
    throw new Error("Sesión no lista: no hay usuario de Firebase Auth disponible para firmar el request.");
  }
  const token = await user.getIdToken(/* forceRefresh */ true);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (import.meta.env.DEV) {
    const devAccountId = getDevAccountIdOverride();
    if (devAccountId) headers.set("x-admin-account-id", devAccountId);
  }
  if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

