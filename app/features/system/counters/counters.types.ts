export interface CounterRecord {
  id: string;
  sequenceId: string;
  counter: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CounterAddInput {
  sequenceId: string;
  counter: number;
  description?: string;
}

export type CounterEditInput = Partial<Omit<CounterRecord, "id" | "createdAt" | "updatedAt">>;
