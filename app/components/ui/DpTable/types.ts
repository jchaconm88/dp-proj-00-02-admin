import type { ReactNode } from "react";
import type { StatusSeverity } from "../constants/status-options";

export type DpTableDefColumnType = "status" | "label" | "bool" | "date" | "datetime";

export interface DpTableDefColumn {
  header: string;
  column: string;
  order: number;
  display: boolean;
  filter?: boolean;
  sort?: boolean;
  type?: DpTableDefColumnType;
  typeOptions?: Record<string, string | { label: string; severity?: StatusSeverity }>;
}

export interface DpTableRow {
  id: string;
}

export interface DpTableFooterTotals {
  label?: string;
  sumColumns: string[];
  labelColumn?: string;
  sumValueKey?: Partial<Record<string, string>>;
  respectGlobalFilter?: boolean;
  formatSum?: (sum: number, columnKey: string) => ReactNode;
}

export interface DpTableRef<T extends DpTableRow> {
  setDatasource(data: T[]): void;
  clearDatasource(): void;
  setLoading(loading: boolean): void;
  getSelectedRows(): T[];
  clearSelectedRows(): void;
  filter(value: string): void;
}
