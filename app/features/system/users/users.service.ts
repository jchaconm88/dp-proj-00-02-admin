import type { UserRecord } from "./users.types";
import { adminFetch } from "~/lib/backend-client";

type UserDoc = Partial<Omit<UserRecord, "id">>;

function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function normalize(id: string, data: Record<string, unknown>): UserRecord {
  const status = String(data.status ?? "active").trim() === "inactive" ? "inactive" : "active";
  return {
    id,
    userId: String(data.userId ?? id).trim(),
    accountId: String(data.accountId ?? "").trim(),
    email: String(data.email ?? "").trim(),
    displayName: String(data.displayName ?? data.userDisplayName ?? "").trim(),
    status,
    roleIds: toStringArray(data.roleIds),
    roleNames: toStringArray(data.roleNames),
  };
}

export async function listUsers(accountId: string): Promise<UserRecord[]> {
  void accountId;
  const rows = await adminFetch<any[]>("/admin/platform/users");
  return rows.map((d) => normalize(String(d.id), d as Record<string, unknown>));
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const row = await adminFetch<any>(`/admin/platform/users/${id}`);
    return normalize(String(row.id ?? id), row as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function createUser(args: {
  id: string; // uid
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
  status: "active" | "inactive";
  roleIds: string[];
  roleNames: string[];
}): Promise<string> {
  const id = args.id.trim();
  await adminFetch("/admin/platform/users", {
    method: "POST",
    body: JSON.stringify({
      id,
      userId: args.userId.trim(),
      accountId: args.accountId.trim(),
      email: args.email.trim(),
      displayName: args.displayName.trim(),
      status: args.status,
      roleIds: args.roleIds,
      roleNames: args.roleNames,
    } satisfies UserDoc & { id: string }),
  });
  return id;
}

export async function updateUser(id: string, data: Partial<Omit<UserRecord, "id" | "userId" | "accountId">> & {
  roleIds?: string[];
  roleNames?: string[];
  status?: "active" | "inactive";
}): Promise<void> {
  await adminFetch(`/admin/platform/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await adminFetch(`/admin/platform/users/${id}`, { method: "DELETE" });
}

