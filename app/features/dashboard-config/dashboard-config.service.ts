import { adminFetch } from "~/lib/backend-client";
import type {
  MetricDefinitionRecord,
  CardDefinitionRecord,
  ChartDefinitionRecord,
  MetricPayload,
  CardPayload,
  ChartPayload,
  CreateResponse,
  RecomposeParams,
} from "./dashboard-config.types";

const METRICS_BASE = "/admin/dashboard-config/metrics";
const CARDS_BASE = "/admin/dashboard-config/cards";
const CHARTS_BASE = "/admin/dashboard-config/charts";
const RECOMPOSE_BASE = "/admin/dashboard/recompose";

// ─── Metrics ────────────────────────────────────────────────────────────────

export async function getMetrics(target?: "admin" | "web"): Promise<MetricDefinitionRecord[]> {
  const query = target ? `?target=${target}` : "";
  return adminFetch<MetricDefinitionRecord[]>(`${METRICS_BASE}${query}`);
}

export async function createMetric(data: MetricPayload): Promise<CreateResponse> {
  return adminFetch<CreateResponse>(METRICS_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMetric(id: string, data: Partial<MetricPayload>): Promise<void> {
  await adminFetch<void>(`${METRICS_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMetric(id: string): Promise<void> {
  await adminFetch<void>(`${METRICS_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Cards ──────────────────────────────────────────────────────────────────

export async function getCards(): Promise<CardDefinitionRecord[]> {
  return adminFetch<CardDefinitionRecord[]>(CARDS_BASE);
}

export async function createCard(data: CardPayload): Promise<CreateResponse> {
  return adminFetch<CreateResponse>(CARDS_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCard(id: string, data: Partial<CardPayload>): Promise<void> {
  await adminFetch<void>(`${CARDS_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCard(id: string): Promise<void> {
  await adminFetch<void>(`${CARDS_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Charts ─────────────────────────────────────────────────────────────────

export async function getCharts(): Promise<ChartDefinitionRecord[]> {
  return adminFetch<ChartDefinitionRecord[]>(CHARTS_BASE);
}

export async function createChart(data: ChartPayload): Promise<CreateResponse> {
  return adminFetch<CreateResponse>(CHARTS_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChart(id: string, data: Partial<ChartPayload>): Promise<void> {
  await adminFetch<void>(`${CHARTS_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteChart(id: string): Promise<void> {
  await adminFetch<void>(`${CHARTS_BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ─── Recompose ──────────────────────────────────────────────────────────────

export async function recompose(params: RecomposeParams): Promise<void> {
  await adminFetch<void>(RECOMPOSE_BASE, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── Admin Dashboard Overrides ──────────────────────────────────────────────

export async function getAdminOverrides(): Promise<{ cards: any[]; charts: any[]; overrides: any[] | null }> {
  return adminFetch<{ cards: any[]; charts: any[]; overrides: any[] | null }>("/admin/dashboard-config/overrides");
}

export async function saveAdminOverrides(entries: Array<{ definitionId: string; definitionType: "card" | "chart"; visible: boolean; order: number }>): Promise<void> {
  await adminFetch<void>("/admin/dashboard-config/overrides", {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}
