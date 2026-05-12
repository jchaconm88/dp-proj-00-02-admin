export type SubscriptionStatus = "active" | "inactive" | "suspended" | "cancelled";
export type BillingCycle = "monthly" | "annual";

export type SubscriptionRecord = {
  id: string;
  accountId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle?: BillingCycle;
  nextRenewalAt?: string;
  amountCents?: number;
  currency?: string;
};
