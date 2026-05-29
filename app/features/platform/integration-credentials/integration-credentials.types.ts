export type IntegrationCredentialRecord = {
  id: string;
  companyId: string;
  label: string;
  integrator: string;
  apiKey: string;
  webhookUrl: string | null;
  defaultWarehouseCode: string;
  priceListCode: string;
  syncMode: "event_driven" | "manual";
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt: string | null;
};

export type IntegrationCredentialDetail = IntegrationCredentialRecord & {
  webhookSecret: string | null;
  rotatedAt: string | null;
};

export type IntegrationCredentialCreateInput = {
  companyId: string;
  label: string;
  integrator?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  defaultWarehouseCode?: string;
  priceListCode?: string;
  syncMode?: "event_driven" | "manual";
};

export type CreateCredentialResult = {
  id: string;
  apiKey: string;
  apiSecret: string;
  label: string;
  integrator: string;
  companyId: string;
};
