import { adminFetch } from "~/lib/backend-client";
import type { WebAppUserRecord, WebAppUserCreateInput, WebAppUserCreateResult } from "./web-users.types";

const BASE = "/admin/platform/web-users";

const EMAIL_DUPLICATE_MSG = "Ya existe un usuario con ese email.";

function rethrowIfEmailDuplicate(e: unknown): never {
  if (e instanceof Error) {
    const body = e.message;
    if (body.includes("email_duplicate") || body.includes("HTTP 409")) {
      throw new Error(EMAIL_DUPLICATE_MSG);
    }
  }
  throw e;
}

function normalize(id: string, data: Record<string, unknown>): WebAppUserRecord {
  const st = String(data.status ?? "active").trim();
  return {
    id,
    authUid: String(data.authUid ?? id).trim(),
    email: String(data.email ?? id).trim(),
    displayName: String(data.displayName ?? "").trim(),
    accountId: String(data.accountId ?? "").trim() || undefined,
    status: st === "inactive" ? "inactive" : st === "invited" ? "invited" : "active",
  };
}

export async function listWebAppUsers(): Promise<WebAppUserRecord[]> {
  const rows = await adminFetch<Record<string, unknown>[]>(BASE);
  return rows.map((d) => normalize(String(d.id), d));
}

export async function getWebAppUserById(id: string): Promise<WebAppUserRecord | null> {
  try {
    const row = await adminFetch<Record<string, unknown>>(`${BASE}/${encodeURIComponent(id)}`);
    return normalize(String(row.id ?? id), row);
  } catch {
    return null;
  }
}

export async function createWebAppUser(args: WebAppUserCreateInput): Promise<WebAppUserCreateResult> {
  try {
    const res = await adminFetch<WebAppUserCreateResult>(BASE, {
      method: "POST",
      body: JSON.stringify({
        email: args.email.trim(),
        displayName: args.displayName.trim(),
        status: args.status === "inactive" ? "inactive" : "active",
        password: args.password,
      }),
    });
    return res;
  } catch (e) {
    rethrowIfEmailDuplicate(e);
  }
}

export async function updateWebAppUser(
  id: string,
  data: Partial<Pick<WebAppUserRecord, "email" | "displayName" | "status">>
): Promise<void> {
  try {
    await adminFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  } catch (e) {
    rethrowIfEmailDuplicate(e);
  }
}

export async function deleteWebAppUser(id: string): Promise<void> {
  await adminFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
