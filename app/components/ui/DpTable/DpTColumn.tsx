import type { ReactNode } from "react";

export interface DpTColumnProps<T = unknown> {
  name: string;
  children: (row: T) => ReactNode;
}

function DpTColumn<T>(_props: DpTColumnProps<T>): null {
  return null;
}

export default DpTColumn;
