import type { ReactNode } from "react";

export interface DpFilterItemRenderProps<T = unknown> {
  value: T;
  onChange: (value: T) => void;
  error?: string;
}

export interface DpFilterItemProps<T = unknown> {
  name: string;
  label: string;
  required?: boolean;
  colSpan?: 1 | 2 | 3 | 4;
  summary?: (value: T) => string;
  children: (props: DpFilterItemRenderProps<T>) => ReactNode;
}

export default function DpFilterItem<T>(_props: DpFilterItemProps<T>): null {
  return null;
}
