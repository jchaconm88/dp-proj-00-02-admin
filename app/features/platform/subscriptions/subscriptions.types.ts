export type SubscriptionRecord = {
  id: string;
  accountId: string;
  planId: string;
  status: "active" | "inactive" | "suspended" | "cancelled";
};
