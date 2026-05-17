import { useState, useEffect } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  createPlan,
  updatePlan,
} from "~/features/platform/saas-plans/saas-plans.service";
import type { SaasPlanRecord } from "~/features/platform/saas-plans/saas-plans.types";

interface PlanDialogProps {
  visible: boolean;
  item: SaasPlanRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

export default function PlanDialog({ visible, item, onHide, onSaved }: PlanDialogProps) {
  const isEdit = item !== null;

  const [id, setId] = useState("");
  const [planId, setPlanId] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setId(item.id);
      setPlanId(item.planId);
      setName(item.name);
      setActive(item.active);
    } else {
      setId("");
      setPlanId("");
      setName("");
      setActive(true);
    }
  }, [visible, item]);

  const valid = id.trim().length > 0 && planId.trim().length > 0 && name.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePlan(item.id, {
          planId: planId.trim(),
          name: name.trim(),
          active,
        });
      } else {
        await createPlan({
          id: id.trim(),
          planId: planId.trim(),
          name: name.trim(),
          active,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const ACTIVE_SELECT_OPTIONS = [
    { label: "Activo", value: "true" },
    { label: "Inactivo", value: "false" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar plan" : "Nuevo plan"}
      recordId={isEdit ? item.id : null}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput
          type="input"
          label="ID"
          name="planDocId"
          value={id}
          onChange={setId}
          disabled={isEdit}
          placeholder="Identificador único del documento"
        />
        <DpInput
          type="input"
          label="Plan ID"
          name="planId"
          value={planId}
          onChange={setPlanId}
          placeholder="Identificador del plan (ej. basic, pro)"
        />
        <DpInput
          type="input"
          label="Nombre"
          name="planName"
          value={name}
          onChange={setName}
          placeholder="Nombre del plan"
        />
        <DpInput
          type="select"
          label="Activo"
          name="planActive"
          value={String(active)}
          onChange={(v) => setActive(v === "true")}
          options={ACTIVE_SELECT_OPTIONS}
        />
      </div>
    </DpContentSet>
  );
}
