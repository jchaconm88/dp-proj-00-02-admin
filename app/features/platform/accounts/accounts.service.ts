import { adminFetch } from "~/lib/backend-client";
import type { AccountRecord } from "./accounts.types";

const BASE = "/admin/platform/accounts";

export async function getAccounts(): Promise<AccountRecord[]> {
  return adminFetch<AccountRecord[]>(BASE);
}

export async function createAccount(data: Omit<AccountRecord, "id"> & { id?: string }): Promise<AccountRecord> {
  return adminFetch<AccountRecord>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: Partial<Omit<AccountRecord, "id">>): Promise<AccountRecord> {
  return adminFetch<AccountRecord>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
