import { adminFetch } from "~/lib/backend-client";
import type { AccountRecord, AccountStatus } from "./accounts.types";

const BASE = "/admin/platform/accounts";

export type CreateAccountInput = {
  id?: string;
  name: string;
  status?: AccountStatus;
  website?: string;
  industry?: string;
  location?: string;
};

export type UpdateAccountInput = Partial<Omit<AccountRecord, "id">>;

export async function getAccounts(): Promise<AccountRecord[]> {
  return adminFetch<AccountRecord[]>(BASE);
}

export async function createAccount(data: CreateAccountInput): Promise<AccountRecord> {
  return adminFetch<AccountRecord>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(id: string, data: UpdateAccountInput): Promise<AccountRecord> {
  return adminFetch<AccountRecord>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
