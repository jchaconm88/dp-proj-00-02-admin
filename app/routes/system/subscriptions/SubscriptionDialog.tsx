import { useState, useEffect } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  createSubscription,
  updateSubscription,
} from "~/features/platform/subscriptions/subscriptions.service";
import type { SubscriptionRecord } from "~/features/platform/subscriptions/subscriptions.types";

interface SubscriptionDialogProps {
  visible: boolean;
  item: SubscriptionRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

export default function SubscriptionDialog({ visible, item, onHide, onSaved }: SubscriptionDialogProps) {
  const isEdit = item !== null;

  const [id, setId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<SubscriptionRecord["status"]>("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setId(item.id);
      setPlanId(item.planId);
      setStatus(item.status);
    } else {
      setId("");
      setPlanId("");
      setStatus("active");
    }
  }, [visible, item]);

  const valid = id.trim().length > 0 && planId.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateSubscription(item.id, {
          accountId: item.accountId,
          planId: planId.trim(),
          status,
        });
      } else {
        await createSubscription({
          id: id.trim(),
          accountId: "current",
          planId: planId.trim(),
          status,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_SELECT_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
    { label: "Suspendido", value: "suspended" },
    { label: "Cancelado", value: "cancelled" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar suscripción" : "Nueva suscripción"}
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
          name="subscriptionId"
          value={id}
          onChange={setId}
          disabled={isEdit}
          placeholder="Identificador único del documento"
        />
        <DpInput
          type="input"
          label="Plan ID"
          name="subscriptionPlanId"
          value={planId}
          onChange={setPlanId}
          placeholder="ID del plan"
        />
        <DpInput
          type="select"
          label="Estado"
          name="subscriptionStatus"
          value={status}
          onChange={(v) => setStatus(v as SubscriptionRecord["status"])}
          options={STATUS_SELECT_OPTIONS}
        />
      </div>
    </DpContentSet>
  );
}
