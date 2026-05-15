import { adminFetch } from "~/lib/backend-client";
import type { CompanyRecord } from "./companies.types";

const BASE = "/admin/platform/companies";

const TAX_ID_DUPLICATE_MSG = "Ya existe una empresa con ese RUC";
const CODE_DUPLICATE_MSG = "Ya existe una empresa con ese código";
const CONFIG_MSG = "Configuración monetaria inválida. Verifique país, monedas permitidas y moneda por defecto.";

function rethrowIfCompanyCreateConflict(e: unknown): never {
  if (e instanceof Error) {
    const body = e.message;
    if (body.includes("code_duplicate")) {
      throw new Error(CODE_DUPLICATE_MSG);
    }
    if (body.includes("taxid_duplicate") || (body.includes("HTTP 409") && body.includes("RUC"))) {
      throw new Error(TAX_ID_DUPLICATE_MSG);
    }
    if (body.includes("HTTP 409")) {
      throw new Error(CODE_DUPLICATE_MSG);
    }
    if (
      body.includes("countryCode_invalid") ||
      body.includes("allowedCurrencies_required") ||
      body.includes("defaultCurrency_invalid") ||
      body.includes("HTTP 422")
    ) {
      throw new Error(CONFIG_MSG);
    }
  }
  throw e;
}

function rethrowIfTaxIdDuplicate(e: unknown): never {
  if (e instanceof Error) {
    const body = e.message;
    if (body.includes("taxid_duplicate") || body.includes("HTTP 409")) {
      throw new Error(TAX_ID_DUPLICATE_MSG);
    }
    if (
      body.includes("countryCode_invalid") ||
      body.includes("allowedCurrencies_required") ||
      body.includes("defaultCurrency_invalid") ||
      body.includes("HTTP 422")
    ) {
      throw new Error(CONFIG_MSG);
    }
  }
  throw e;
}

export type CompanyCreateInput = Omit<CompanyRecord, "id" | "accountId"> & {
  code: string;
  countryCode: "PE";
  allowedCurrencies: Array<"PEN" | "USD" | "EUR">;
  defaultCurrency: "PEN" | "USD" | "EUR";
};

export async function getCompanies(): Promise<CompanyRecord[]> {
  return adminFetch<CompanyRecord[]>(BASE);
}

export async function getCompanyById(id: string): Promise<CompanyRecord | null> {
  const sid = String(id ?? "").trim();
  if (!sid) return null;
  try {
    return await adminFetch<CompanyRecord>(`${BASE}/${encodeURIComponent(sid)}`);
  } catch {
    return null;
  }
}

export async function createCompany(data: CompanyCreateInput): Promise<CompanyRecord> {
  try {
    return await adminFetch<CompanyRecord>(BASE, {
      method: "POST",
      body: JSON.stringify({ ...data, accountId: undefined }),
    });
  } catch (e) {
    rethrowIfCompanyCreateConflict(e);
  }
}

export async function updateCompany(
  id: string,
  data: Partial<Omit<CompanyRecord, "id">>
): Promise<CompanyRecord> {
  try {
    return await adminFetch<CompanyRecord>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...data, accountId: undefined }),
    });
  } catch (e) {
    rethrowIfTaxIdDuplicate(e);
  }
}

export async function deleteCompany(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
