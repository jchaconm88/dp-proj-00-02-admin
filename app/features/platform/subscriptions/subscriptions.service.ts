import { adminFetch } from "~/lib/backend-client";
import type { SubscriptionRecord } from "./subscriptions.types";

const BASE = "/admin/platform/subscriptions";

export async function getSubscriptions(): Promise<SubscriptionRecord[]> {
  return adminFetch<SubscriptionRecord[]>(BASE);
}

export async function createSubscription(
  data: Omit<SubscriptionRecord, "id"> & { id?: string }
): Promise<SubscriptionRecord> {
  return adminFetch<SubscriptionRecord>(BASE, {
    method: "POST",
    body: JSON.stringify({ ...data, accountId: undefined }),
  });
}

export async function updateSubscription(
  id: string,
  data: Partial<Omit<SubscriptionRecord, "id">>
): Promise<SubscriptionRecord> {
  return adminFetch<SubscriptionRecord>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...data, accountId: undefined }),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
