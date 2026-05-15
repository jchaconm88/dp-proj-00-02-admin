import { adminFetch } from "~/lib/backend-client";
import type { UbigeoRecord } from "./ubigeos.types";

const BASE = "/admin/platform/ubigeos";

export async function getUbigeos(country: "PE" = "PE"): Promise<UbigeoRecord[]> {
  const result = await adminFetch<{ items: UbigeoRecord[] }>(`${BASE}?country=${encodeURIComponent(country)}`);
  return Array.isArray(result.items) ? result.items : [];
}
