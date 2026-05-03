import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "./firebase";
import { adminFetch } from "./backend-client";

export type AdminUserRecord = {
  id: string;
  userId: string;
  accountId: string;
  email: string;
  displayName: string;
  status: "active" | "inactive";
  roleIds: string[];
  roleNames: string[];
};

const COLLECTION = "users";

function toArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function normalize(docId: string, data: Record<string, unknown>, fallbackUid: string): AdminUserRecord {
  const status = String(data.status ?? "active").trim() === "inactive" ? "inactive" : "active";
  return {
    id: docId,
    userId: String(data.userId ?? fallbackUid).trim(),
    accountId: String(data.accountId ?? "").trim(),
    email: String(data.email ?? "").trim(),
    displayName: String(data.displayName ?? data.userDisplayName ?? "").trim(),
    status,
    roleIds: toArray(data.roleIds),
    roleNames: toArray(data.roleNames),
  };
}

export async function getMyAdminUser(uid: string): Promise<AdminUserRecord | null> {
  // Preferimos backend: evita depender de reglas/permisos de Firestore en el cliente.
  try {
    const me = await adminFetch<AdminUserRecord>("/admin/me");
    if (me?.id) return me;
  } catch {
    // fallback a Firestore
  }
  const direct = await getDoc(doc(db, COLLECTION, uid));
  if (direct.exists()) {
    return normalize(direct.id, direct.data() as Record<string, unknown>, uid);
  }
  const q = query(collection(db, COLLECTION), where("userId", "==", uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0]!;
  return normalize(d.id, d.data() as Record<string, unknown>, uid);
}

/**
 * Upsert básico del usuario logueado para asegurar que exista en `users`.
 * No setea `accountId` (eso lo define onboarding o un admin).
 */
export async function upsertAdminUser(args: { uid: string; email: string; displayName?: string | null }): Promise<void> {
  const id = args.uid.trim();
  if (!id) return;
  await setDoc(
    doc(db, COLLECTION, id),
    {
      userId: id,
      email: args.email?.trim() || "",
      displayName: args.displayName?.trim() || "",
      status: "active",
      roleIds: [],
      roleNames: [],
      updatedAt: serverTimestamp(),
    } as any,
    { merge: true }
  );
}
