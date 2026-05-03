import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { getActiveSequenceByEntity, type SequenceRecord } from "~/features/system/sequences";

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-200";
const controlClass = "w-full";

export interface DpCodeInputProps {
  entity: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Misma semántica que en Web: secuencia por entidad, override manual opcional,
 * y `generateSequenceCode(code, entity)` al guardar si el valor puede estar vacío.
 */
export function DpCodeInput({
  entity,
  value,
  onChange,
  label = "Código",
  name,
  placeholder,
  className = "",
  disabled: disabledProp = false,
}: DpCodeInputProps) {
  const [sequence, setSequence] = useState<SequenceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entity.trim()) {
      setSequence(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getActiveSequenceByEntity(entity.trim())
      .then((seq) => setSequence(seq ?? null))
      .catch(() => setSequence(null))
      .finally(() => setLoading(false));
  }, [entity]);

  const id = name ?? label.replace(/\s+/g, "-").toLowerCase();
  const allowManual = sequence === null || sequence.allowManualOverride === true;
  const effectiveDisabled = disabledProp || loading || !allowManual;

  let effectivePlaceholder = placeholder;
  if (loading) {
    effectivePlaceholder = "Cargando...";
  } else if (!sequence) {
    effectivePlaceholder = placeholder ?? "No hay secuencia para esta entidad";
  } else if (!allowManual) {
    effectivePlaceholder = placeholder ?? "Se genera automáticamente al guardar";
  } else {
    effectivePlaceholder = placeholder ?? "Opcional: se genera al guardar si está vacío";
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <InputText
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={effectivePlaceholder}
        disabled={effectiveDisabled}
        readOnly={!allowManual && !loading}
        className={controlClass}
      />
    </div>
  );
}
