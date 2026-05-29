import { adminFetch } from "~/lib/backend-client";
import type { IntegrationCredentialRecord, IntegrationCredentialDetail, IntegrationCredentialCreateInput, CreateCredentialResult } from "./integration-credentials.types";

const BASE = "/admin/platform/integration-credentials";

export async function getCredentials(companyId: string): Promise<IntegrationCredentialRecord[]> {
  return adminFetch<IntegrationCredentialRecord[]>(`${BASE}?companyId=${encodeURIComponent(companyId)}`);
}

export async function getCredentialById(id: string): Promise<IntegrationCredentialDetail | null> {
  try {
    return await adminFetch<IntegrationCredentialDetail>(`${BASE}/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function createCredential(data: IntegrationCredentialCreateInput): Promise<CreateCredentialResult> {
  return adminFetch<CreateCredentialResult>(BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCredential(id: string, data: Partial<IntegrationCredentialCreateInput>): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function rotateSecret(id: string): Promise<{ apiSecret: string; id: string }> {
  return adminFetch<{ apiSecret: string; id: string }>(`${BASE}/${id}/rotate-secret`, {
    method: "POST",
  });
}

export async function revokeCredential(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}/revoke`, { method: "POST" });
}

export async function deleteCredential(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}

export async function testCredential(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${id}/test`, { method: "POST" });
}

export async function getIntegrationApiMeta(): Promise<{ publicApiBaseUrl: string; openApiUrl: string; version: string }> {
  return adminFetch("/admin/platform/integration-api-meta");
}
