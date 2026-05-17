import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  addCounter,
  getCounterById,
  updateCounter,
} from "~/features/system/counters";

export default function CounterDialog(props: {
  visible: boolean;
  counterId: string | null;
  onSuccess?: () => void;
  onHide: () => void;
}) {
  const { visible, counterId, onSuccess, onHide } = props;
  const isEdit = !!counterId;
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const [sequenceId, setSequenceId] = useState("");
  const [counter, setCounter] = useState("0");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!counterId) {
      setSequenceId("");
      setCounter("0");
      setDescription("");
      setLoading(false);
      return;
    }
    setLoading(true);
    getCounterById(counterId)
      .then((data) => {
        if (!data) {
          setError("Contador no encontrado.");
          return;
        }
        setSequenceId(data.sequenceId ?? "");
        setCounter(String(data.counter ?? 0));
        setDescription(data.description ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar."))
      .finally(() => setLoading(false));
  }, [visible, counterId]);

  const valid = !!sequenceId.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        sequenceId: sequenceId.trim(),
        counter: Math.max(0, Number(counter) || 0),
        description: description.trim() || undefined,
      };
      if (counterId) await updateCounter(counterId, payload);
      else await addCounter(payload);
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
      title={isEdit ? "Editar contador" : "Agregar contador"}
      recordId={isEdit ? counterId : null}
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
        <DpInput type="input" label="Sequence ID" name="sequenceId" value={sequenceId} onChange={setSequenceId} placeholder="ORD" />
        <DpInput type="number" label="Contador" name="counter" value={counter} onChange={setCounter} placeholder="0" />
        <DpInput type="input" label="Descripción" name="description" value={description} onChange={setDescription} placeholder="Opcional" />
      </div>
    </DpContentSet>
  );
}
