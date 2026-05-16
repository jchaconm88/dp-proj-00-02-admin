import { useMemo } from "react";
import { Dropdown } from "primereact/dropdown";

interface DashboardPeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildPeriodOptions(): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[month]} ${year}`;
    options.push({ label, value });
  }

  return options;
}

export default function DashboardPeriodSelector({ value, onChange }: DashboardPeriodSelectorProps) {
  const options = useMemo(() => buildPeriodOptions(), []);

  return (
    <Dropdown
      value={value}
      onChange={(e) => onChange(String(e.value ?? ""))}
      options={options}
      optionLabel="label"
      optionValue="value"
      placeholder="Seleccionar periodo"
      className="w-52"
      aria-label="Selector de periodo"
    />
  );
}
