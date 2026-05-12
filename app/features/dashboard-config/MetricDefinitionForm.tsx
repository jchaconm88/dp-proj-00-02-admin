import { useCallback, useEffect, useState } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import type {
  MetricDefinitionRecord,
  MetricPayload,
  MetricType,
  MeasureType,
  ValueFormat,
  TargetType,
} from "./dashboard-config.types";
import * as svc from "./dashboard-config.service";

export interface MetricDefinitionFormProps {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  editData?: MetricDefinitionRecord | null;
}

const METRIC_TYPE_OPTIONS = [
  { label: "Entity Count", value: "entityCount" },
  { label: "Sum", value: "sum" },
  { label: "Ratio", value: "ratio" },
  { label: "Custom", value: "custom" },
];

const MEASURE_TYPE_OPTIONS = [
  { label: "Counter Monthly", value: "counterMonthly" },
  { label: "Gauge Current", value: "gaugeCurrent" },
];

const VALUE_FORMAT_OPTIONS = [
  { label: "Number", value: "number" },
  { label: "Currency", value: "currency" },
  { label: "Percentage", value: "percentage" },
  { label: "Bytes", value: "bytes" },
];

const TARGET_TYPE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Web", value: "web" },
  { label: "Ambos", value: "both" },
];

interface FormErrors {
  metricKey?: string;
  label?: string;
  type?: string;
  measureType?: string;
  valueFormat?: string;
  collectionName?: string;
  numeratorMetricKey?: string;
  denominatorMetricKey?: string;
}

const METRIC_KEY_REGEX = /^[a-zA-Z0-9-]+$/;

export default function MetricDefinitionForm({
  visible,
  onHide,
  onSaved,
  editData,
}: MetricDefinitionFormProps) {
  const isEdit = !!editData;

  const [metricKey, setMetricKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<MetricType>("entityCount");
  const [measureType, setMeasureType] = useState<MeasureType>("counterMonthly");
  const [valueFormat, setValueFormat] = useState<ValueFormat>("number");
  const [target, setTarget] = useState<TargetType>("admin");
  const [collectionName, setCollectionName] = useState("");
  const [numeratorMetricKey, setNumeratorMetricKey] = useState("");
  const [denominatorMetricKey, setDenominatorMetricKey] = useState("");
  const [permissionModule, setPermissionModule] = useState("");
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
    if (editData) {
      const d = editData.data;
      setMetricKey(d.metricKey);
      setLabel(d.label);
      setType(d.type);
      setMeasureType(d.measureType);
      setValueFormat(d.valueFormat);
      setTarget((d as any).target ?? "admin");
      setCollectionName(d.source.collectionName);
      setNumeratorMetricKey(d.numeratorMetricKey ?? "");
      setDenominatorMetricKey(d.denominatorMetricKey ?? "");
      setPermissionModule(d.permissionModule ?? "");
      setActive(d.active);
    } else {
      setMetricKey("");
      setLabel("");
      setType("entityCount");
      setMeasureType("counterMonthly");
      setValueFormat("number");
      setTarget("admin");
      setCollectionName("");
      setNumeratorMetricKey("");
      setDenominatorMetricKey("");
      setPermissionModule("");
      setActive(true);
    }
  }, [visible, editData]);

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

    if (!type) e.type = "Tipo es requerido";
    if (!measureType) e.measureType = "Medición es requerida";
    if (!valueFormat) e.valueFormat = "Formato es requerido";

    if (!collectionName.trim()) {
      e.collectionName = "Collection Name es requerido";
    }

    if (type === "ratio") {
      if (!numeratorMetricKey.trim()) {
        e.numeratorMetricKey = "Numerator Metric Key es requerido para tipo ratio";
      }
      if (!denominatorMetricKey.trim()) {
        e.denominatorMetricKey = "Denominator Metric Key es requerido para tipo ratio";
      }
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
      type,
      measureType,
      valueFormat,
      source: { collectionName: collectionName.trim() },
      active,
      target,
      permissionModule: permissionModule.trim() || null,
    };

    if (type === "ratio") {
      payload.numeratorMetricKey = numeratorMetricKey.trim();
      payload.denominatorMetricKey = denominatorMetricKey.trim();
    }

    try {
      if (isEdit) {
        await svc.updateMetric(editData.data.id, payload);
      } else {
        await svc.createMetric(payload);
      }
      onSaved();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la métrica");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DpContentSet
      title={isEdit ? "Editar Métrica" : "Nueva Métrica"}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      saveDisabled={saving}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Metric Key"
            name="metricKey"
            value={metricKey}
            onChange={(v) => { setMetricKey(v); clearError(); }}
            disabled={isEdit}
            placeholder="ej: trips-count"
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
            placeholder="Nombre descriptivo"
          />
          {errors.label && (
            <small className="text-red-500">{errors.label}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Tipo"
            name="type"
            value={type}
            onChange={(v) => { setType(v as MetricType); clearError(); }}
            options={METRIC_TYPE_OPTIONS}
            placeholder="Seleccionar tipo"
          />
          {errors.type && (
            <small className="text-red-500">{errors.type}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Medición"
            name="measureType"
            value={measureType}
            onChange={(v) => { setMeasureType(v as MeasureType); clearError(); }}
            options={MEASURE_TYPE_OPTIONS}
            placeholder="Seleccionar medición"
          />
          {errors.measureType && (
            <small className="text-red-500">{errors.measureType}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Formato de Valor"
            name="valueFormat"
            value={valueFormat}
            onChange={(v) => { setValueFormat(v as ValueFormat); clearError(); }}
            options={VALUE_FORMAT_OPTIONS}
            placeholder="Seleccionar formato"
          />
          {errors.valueFormat && (
            <small className="text-red-500">{errors.valueFormat}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Target"
            name="target"
            value={target}
            onChange={(v) => { setTarget(v as TargetType); clearError(); }}
            options={TARGET_TYPE_OPTIONS}
            placeholder="Seleccionar target"
          />
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Collection Name"
            name="collectionName"
            value={collectionName}
            onChange={(v) => { setCollectionName(v); clearError(); }}
            placeholder="ej: trips"
          />
          {errors.collectionName && (
            <small className="text-red-500">{errors.collectionName}</small>
          )}
        </div>

        {type === "ratio" && (
          <>
            <div className="flex flex-col gap-1">
              <DpInput
                type="input"
                label="Numerator Metric Key"
                name="numeratorMetricKey"
                value={numeratorMetricKey}
                onChange={(v) => { setNumeratorMetricKey(v); clearError(); }}
                placeholder="ej: trips-completed"
              />
              {errors.numeratorMetricKey && (
                <small className="text-red-500">{errors.numeratorMetricKey}</small>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <DpInput
                type="input"
                label="Denominator Metric Key"
                name="denominatorMetricKey"
                value={denominatorMetricKey}
                onChange={(v) => { setDenominatorMetricKey(v); clearError(); }}
                placeholder="ej: trips-count"
              />
              {errors.denominatorMetricKey && (
                <small className="text-red-500">{errors.denominatorMetricKey}</small>
              )}
            </div>
          </>
        )}

        <DpInput
          type="input"
          label="Permission Module (opcional)"
          name="permissionModule"
          value={permissionModule}
          onChange={(v) => { setPermissionModule(v); clearError(); }}
          placeholder="ej: trip"
        />

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
