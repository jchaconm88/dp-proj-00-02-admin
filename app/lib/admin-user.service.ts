import { adminFetch } from "./backend-client";

export type AdminUserRecord = {
  id: string;
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
  status: "active" | "inactive";
  adminRoleIds: string[];
  adminRoleNames: string[];
  platform: string[];
};

export async function getMyAdminUser(): Promise<AdminUserRecord | null> {
  try {
    const me = await adminFetch<AdminUserRecord>("/admin/me");
    return me?.id ? me : null;
  } catch {
    return null;
  }
}
