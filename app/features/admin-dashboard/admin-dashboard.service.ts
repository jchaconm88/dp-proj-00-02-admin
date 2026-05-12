import { adminFetch } from "~/lib/backend-client";
import type { DashboardSnapshotResponse } from "./dashboard.types";

export type DashboardSnapshot = {
  period: string;
  cards: unknown[];
  activityReports: unknown[];
  activityTrips: unknown[];
  hasUsageForPeriod: boolean;
};

export async function fetchAdminDashboardSnapshot(args: {
  accountId: string;
  period?: string;
}): Promise<DashboardSnapshot> {
  const qs = new URLSearchParams();
  qs.set("accountId", args.accountId);
  if (args.period) qs.set("period", args.period);
  return adminFetch<DashboardSnapshot>(`/admin/dashboard/snapshot?${qs.toString()}`);
}

/**
 * Fetch del snapshot tipado con cards y charts completos.
 */
export async function getAdminSnapshot(
  accountId: string,
  period: string
): Promise<DashboardSnapshotResponse> {
  return adminFetch<DashboardSnapshotResponse>(
    `/admin/dashboard/snapshot?accountId=${encodeURIComponent(accountId)}&period=${encodeURIComponent(period)}`
  );
}

