export type MetricType = "entityCount" | "sum" | "ratio" | "custom";
export type MeasureType = "counterMonthly" | "gaugeCurrent";
export type ValueFormat = "number" | "currency" | "percentage" | "bytes";
export type TargetType = "admin" | "web" | "both";
export type ChartType = "bar" | "line" | "pie" | "doughnut";
export type GroupBy = "daily" | "weekly" | "monthly";
export type DefinitionSource = "default" | "custom";

export interface MetricDefinitionRecord {
  data: {
    id: string;
    metricKey: string;
    label: string;
    type: MetricType;
    measureType: MeasureType;
    valueFormat: ValueFormat;
    source: { collectionName: string };
    numeratorMetricKey?: string;
    denominatorMetricKey?: string;
    permissionModule?: string | null;
    active: boolean;
  };
  source: DefinitionSource;
  readonly: boolean;
}

export interface CardDefinitionRecord {
  data: {
    id: string;
    cardKey: string;
    metricKey: string;
    title: string;
    icon: string;
    accentClass: string;
    order: number;
    visible: boolean;
    active: boolean;
    target: TargetType;
    permissionModule?: string | null;
  };
  source: DefinitionSource;
  readonly: boolean;
}

export interface ChartDefinitionRecord {
  data: {
    id: string;
    chartKey: string;
    title: string;
    chartType: ChartType;
    metricKeys: string[];
    groupBy: GroupBy;
    target: TargetType;
    permissionModule: string;
    active: boolean;
  };
  source: DefinitionSource;
  readonly: boolean;
}

// Payloads for create/update

export interface MetricPayload {
  metricKey: string;
  label: string;
  type: MetricType;
  measureType: MeasureType;
  valueFormat: ValueFormat;
  source: { collectionName: string };
  numeratorMetricKey?: string;
  denominatorMetricKey?: string;
  permissionModule?: string | null;
  active: boolean;
  target?: TargetType;
}

export interface CardPayload {
  cardKey: string;
  metricKey: string;
  title: string;
  icon: string;
  accentClass: string;
  order: number;
  visible: boolean;
  active: boolean;
  target: TargetType;
  permissionModule?: string | null;
}

export interface ChartPayload {
  chartKey: string;
  title: string;
  chartType: ChartType;
  metricKeys: string[];
  groupBy: GroupBy;
  target: TargetType;
  permissionModule: string;
  active: boolean;
}

// Response types

export interface CreateResponse {
  id: string;
}

export interface RecomposeParams {
  accountId: string;
  companyId?: string;
  period?: string;
}
