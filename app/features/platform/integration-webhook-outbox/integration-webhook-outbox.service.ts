import { adminFetch } from "~/lib/backend-client";
import type { WebhookOutboxRecord } from "./integration-webhook-outbox.types";

const BASE = "/admin/platform/integration-webhook-outbox";

export async function getFailedWebhooks(companyId: string): Promise<WebhookOutboxRecord[]> {
  const qs = `?companyId=${encodeURIComponent(companyId)}&status=failed`;
  const items = await adminFetch<WebhookOutboxRecord[]>(`${BASE}${qs}`);
  return items ?? [];
}

export async function retryWebhookOutbox(id: string): Promise<void> {
  await adminFetch<void>(`${BASE}/${encodeURIComponent(id)}/retry`, { method: "POST" });
}
