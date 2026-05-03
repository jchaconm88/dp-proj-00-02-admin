/** Severidades que PrimeReact `Tag` pinta con la prop `severity`. */
export const PRIME_STATUS_SEVERITIES = [
  "success",
  "info",
  "warning",
  "danger",
  "secondary",
  "contrast",
] as const;

export type PrimeStatusSeverity = (typeof PRIME_STATUS_SEVERITIES)[number];
export type CustomStatusSeverity = "accent" | "teal";
export type StatusSeverity = PrimeStatusSeverity | CustomStatusSeverity;

export function isPrimeStatusSeverity(s: string): s is PrimeStatusSeverity {
  return (PRIME_STATUS_SEVERITIES as readonly string[]).includes(s);
}

export interface StatusOption {
  label: string;
  severity: StatusSeverity;
}
