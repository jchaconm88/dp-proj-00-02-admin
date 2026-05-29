import { adminFetch } from "~/lib/backend-client";

export interface IntegrationApiMeta {
  publicApiBaseUrl: string;
  openApiUrl: string;
  adminOpenApiPath?: string;
  version: string;
}

export async function getIntegrationApiMeta(): Promise<IntegrationApiMeta> {
  return adminFetch<IntegrationApiMeta>("/admin/platform/integration-api-meta");
}

export async function getIntegrationOpenApiSpec(): Promise<Record<string, unknown>> {
  return adminFetch<Record<string, unknown>>("/admin/platform/integration-openapi.json");
}
