/**
 * Tipos de snapshot para el dashboard de admin.
 * Reflejan la estructura del backend sin campos Timestamp de Firestore.
 */

export interface SnapshotCard {
  id: string;
  cardKey: string;
  metricKey: string;
  title: string;
  subtitle: string | null;
  icon: string;
  accentClass: string;
  value: string;
  rawValue: number;
  progressPct: number | null;
  progressLabel: string | null;
  href: string | null;
  permissionModule: string | null;
  target: "admin" | "web" | "both";
}

export interface SnapshotChartDataset {
  metricKey: string;
  label: string;
  data: number[];
}

export interface SnapshotChart {
  id: string;
  chartKey: string;
  title: string;
  chartType: "bar" | "line" | "pie" | "doughnut";
  permissionModule: string | null;
  target: "admin" | "web" | "both";
  labels: string[];
  datasets: SnapshotChartDataset[];
}

export interface DashboardSnapshotResponse {
  accountId: string;
  companyId: string | null;
  period: string;
  cards: SnapshotCard[];
  charts: SnapshotChart[];
  hasUsageForPeriod: boolean;
  metadata?: {
    generatedAt: string;
    configSource: string;
  };
}
