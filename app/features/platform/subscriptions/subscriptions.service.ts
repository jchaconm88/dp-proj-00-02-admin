import { adminFetch } from "~/lib/backend-client";
import type { BillingCycle, SubscriptionRecord, SubscriptionStatus } from "./subscriptions.types";

const BASE = "/admin/platform/subscriptions";

export type CreateSubscriptionInput = {
  id?: string;
  accountId?: string;
  planId: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  nextRenewalAt?: string;
  amountCents?: number;
  currency?: string;
};

export type UpdateSubscriptionInput = Partial<Omit<SubscriptionRecord, "id">>;

export async function getSubscriptions(): Promise<SubscriptionRecord[]> {
  return adminFetch<SubscriptionRecord[]>(BASE);
}

export async function createSubscription(data: CreateSubscriptionInput): Promise<SubscriptionRecord> {
  return adminFetch<SubscriptionRecord>(BASE, {
    method: "POST",
    body: JSON.stringify({ ...data, accountId: undefined }),
  });
}

export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionInput
): Promise<SubscriptionRecord> {
  return adminFetch<SubscriptionRecord>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...data, accountId: undefined }),
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
