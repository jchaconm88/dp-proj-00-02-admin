import { useCallback, useEffect, useState } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import type { MetricPayload } from "./dashboard-config.types";
import * as svc from "./dashboard-config.service";

export interface MetricTemplateWizardProps {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
}

interface FormErrors {
  metricKey?: string;
  label?: string;
  collectionName?: string;
}

const METRIC_KEY_REGEX = /^[a-zA-Z0-9-]+$/;

export default function MetricTemplateWizard({
  visible,
  onHide,
  onSaved,
}: MetricTemplateWizardProps) {
  const [metricKey, setMetricKey] = useState("");
  const [label, setLabel] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Clear backend error when user modifies any field
  const clearError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setErrors({});
    setMetricKey("");
    setLabel("");
    setCollectionName("");
    setActive(true);
  }, [visible]);

  function validate(): boolean {
    const e: FormErrors = {};

    if (!metricKey.trim()) {
      e.metricKey = "Metric Key es requerido";
    } else if (!METRIC_KEY_REGEX.test(metricKey.trim())) {
      e.metricKey = "Solo alfanuméricos y guiones";
    } else if (metricKey.trim().length > 64) {
      e.metricKey = "Máximo 64 caracteres";
    }

    if (!label.trim()) {
      e.label = "Label es requerido";
    } else if (label.trim().length > 120) {
      e.label = "Máximo 120 caracteres";
    }

    if (!collectionName.trim()) {
      e.collectionName = "Collection Name es requerido";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const payload: MetricPayload = {
      metricKey: metricKey.trim(),
      label: label.trim(),
      type: "entityCount",
      measureType: "counterMonthly",
      valueFormat: "number",
      source: { collectionName: collectionName.trim() },
      active,
      permissionModule: null,
    };

    try {
      await svc.createMetric(payload);
      onSaved();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la métrica");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DpContentSet
      title="Quick-Create: Entity Count Metric"
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      saveDisabled={saving}
      saveLabel="Crear"
      showError={!!error}
      errorMessage={error ?? ""}
      dialogBodyHeader={
        <div className="mb-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300">
          <i className="pi pi-info-circle mr-1" />
          Pre-configurado: type=entityCount, measureType=counterMonthly, valueFormat=number
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Metric Key"
            name="metricKey"
            value={metricKey}
            onChange={(v) => { setMetricKey(v); clearError(); }}
            placeholder="ej: warehouses-count"
          />
          {errors.metricKey && (
            <small className="text-red-500">{errors.metricKey}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Label"
            name="label"
            value={label}
            onChange={(v) => { setLabel(v); clearError(); }}
            placeholder="ej: Total Almacenes"
          />
          {errors.label && (
            <small className="text-red-500">{errors.label}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Collection Name"
            name="collectionName"
            value={collectionName}
            onChange={(v) => { setCollectionName(v); clearError(); }}
            placeholder="ej: warehouses"
          />
          {errors.collectionName && (
            <small className="text-red-500">{errors.collectionName}</small>
          )}
        </div>

        <DpInput
          type="check"
          label="Activa"
          name="active"
          value={active}
          onChange={(v) => { setActive(v); clearError(); }}
        />
      </div>
    </DpContentSet>
  );
}
