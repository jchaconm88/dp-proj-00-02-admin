import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "./firebase";

export type AdminAccountMemberRecord = {
  id: string;
  accountId: string;
  userId: string;
  status: "active" | "inactive";
  roleIds: string[];
  roleNames: string[];
  permissionCodes: string[];
};

const COLLECTION = "adminAccountMembers";

export async function getMyAdminMembership(userId: string): Promise<AdminAccountMemberRecord | null> {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  const data = doc.data() as Record<string, unknown>;
  const status = String(data.status ?? "active").trim() === "inactive" ? "inactive" : "active";
  return {
    id: doc.id,
    accountId: String(data.accountId ?? "").trim(),
    userId: String(data.userId ?? userId).trim(),
    status,
    roleIds: Array.isArray(data.roleIds) ? (data.roleIds as unknown[]).map(String) : [],
    roleNames: Array.isArray(data.roleNames) ? (data.roleNames as unknown[]).map(String) : [],
    permissionCodes: Array.isArray(data.permissionCodes) ? (data.permissionCodes as unknown[]).map(String) : [],
  };
}

