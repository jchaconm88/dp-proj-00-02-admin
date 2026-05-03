import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  addSequence,
  getSequenceById,
  updateSequence,
  type ResetPeriod,
} from "~/features/system/sequences";

const RESET_PERIOD_OPTIONS: { label: string; value: ResetPeriod }[] = [
  { label: "Nunca", value: "never" },
  { label: "Anual", value: "yearly" },
  { label: "Mensual", value: "monthly" },
  { label: "Diario", value: "daily" },
];

const FORMAT_PLACEHOLDERS = "prefix | year | month | day | number";

export default function SequenceDialog(props: {
  visible: boolean;
  sequenceId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}) {
  const { visible, sequenceId, onSuccess, onHide } = props;
  const isEdit = !!sequenceId;
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const [entity, setEntity] = useState("");
  const [prefix, setPrefix] = useState("");
  const [digits, setDigits] = useState("6");
  const [format, setFormat] = useState("{prefix}-{number}");
  const [resetPeriod, setResetPeriod] = useState<ResetPeriod>("never");
  const [allowManualOverride, setAllowManualOverride] = useState(false);
  const [preventGaps, setPreventGaps] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!sequenceId) {
      setEntity("");
      setPrefix("");
      setDigits("6");
      setFormat("{prefix}-{number}");
      setResetPeriod("never");
      setAllowManualOverride(false);
      setPreventGaps(false);
      setActive(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSequenceById(sequenceId)
      .then((data) => {
        if (!data) {
          setError("Secuencia no encontrada.");
          return;
        }
        if (data.readonly) {
          setError("Las secuencias default no se editan. Crea una secuencia custom con la misma entidad para sobrescribirla.");
          return;
        }
        setEntity(data.entity ?? "");
        setPrefix(data.prefix ?? "");
        setDigits(String(data.digits ?? 6));
        setFormat(data.format ?? "{prefix}-{number}");
        setResetPeriod(data.resetPeriod ?? "never");
        setAllowManualOverride(!!data.allowManualOverride);
        setPreventGaps(!!data.preventGaps);
        setActive(data.active !== false);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, sequenceId]);

  const valid = !!entity.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        entity: entity.trim(),
        prefix: prefix.trim(),
        digits: Math.max(0, Number(digits) || 6),
        format: format.trim() || "{prefix}-{number}",
        resetPeriod,
        allowManualOverride,
        preventGaps,
        active,
      };
      if (sequenceId) await updateSequence(sequenceId, payload);
      else await addSequence(payload);
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar secuencia" : "Agregar secuencia"}
      recordId={isEdit ? sequenceId : null}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving || isNavigating}
      saveDisabled={!valid || isNavigating || !!error}
      visible={visible}
      onHide={onHide}
      showLoading={loading}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput type="input" label="Entidad" name="entity" value={entity} onChange={setEntity} placeholder="company" />
        <DpInput type="input" label="Prefijo" name="prefix" value={prefix} onChange={setPrefix} placeholder="COM" />
        <DpInput type="number" label="Dígitos" name="digits" value={digits} onChange={setDigits} placeholder="6" />
        <DpInput type="input" label="Formato" name="format" value={format} onChange={setFormat} placeholder="{prefix}-{number}" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Placeholders: {FORMAT_PLACEHOLDERS}</p>
        <DpInput
          type="select"
          label="Reinicio"
          name="resetPeriod"
          value={resetPeriod}
          onChange={(v) => setResetPeriod(String(v) as ResetPeriod)}
          options={RESET_PERIOD_OPTIONS}
        />
        <DpInput type="check" label="Permitir override manual" name="allowManualOverride" value={allowManualOverride} onChange={setAllowManualOverride} />
        <DpInput type="check" label="Evitar huecos" name="preventGaps" value={preventGaps} onChange={setPreventGaps} />
        <DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
      </div>
    </DpContentSet>
  );
}
