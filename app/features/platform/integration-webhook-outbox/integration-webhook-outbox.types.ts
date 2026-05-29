export interface WebhookOutboxRecord {
  id: string;
  companyId: string;
  accountId: string;
  credentialId: string;
  event: string;
  status: string;
  attempts: number;
  lastError: string;
  createdAt: unknown;
  nextRetryAt?: unknown;
}
