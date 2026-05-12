import { useCallback, useEffect, useMemo, useState } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  type ChartDefinitionRecord,
  type ChartPayload,
  type ChartType,
  type GroupBy,
  type TargetType,
} from "./dashboard-config.types";
import * as svc from "./dashboard-config.service";

export interface ChartDefinitionFormProps {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  editData?: ChartDefinitionRecord | null;
  metricKeys?: string[];
}

const CHART_TYPE_OPTIONS = [
  { label: "Bar", value: "bar" },
  { label: "Line", value: "line" },
  { label: "Pie", value: "pie" },
  { label: "Doughnut", value: "doughnut" },
];

const GROUP_BY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const TARGET_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Web", value: "web" },
  { label: "Both", value: "both" },
];

interface FormErrors {
  chartKey?: string;
  title?: string;
  chartType?: string;
  metricKeys?: string;
  groupBy?: string;
  target?: string;
  permissionModule?: string;
}

export default function ChartDefinitionForm({
  visible,
  onHide,
  onSaved,
  editData,
  metricKeys: availableMetricKeys = [],
}: ChartDefinitionFormProps) {
  const isEdit = !!editData;

  const [chartKey, setChartKey] = useState("");
  const [title, setTitle] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>([]);
  const [metricKeysStr, setMetricKeysStr] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("monthly");
  const [target, setTarget] = useState<TargetType>("both");
  const [permissionModule, setPermissionModule] = useState("");
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Clear backend error when user modifies any field
  const clearError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const metricKeyOptions = useMemo(
    () => availableMetricKeys.map((k) => ({ label: k, value: k })),
    [availableMetricKeys]
  );

  const useMultiSelect = metricKeyOptions.length > 0;

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setErrors({});
    if (editData) {
      const d = editData.data;
      setChartKey(d.chartKey);
      setTitle(d.title);
      setChartType(d.chartType);
      setSelectedMetricKeys(d.metricKeys);
      setMetricKeysStr(d.metricKeys.join(", "));
      setGroupBy(d.groupBy);
      setTarget(d.target);
      setPermissionModule(d.permissionModule ?? "");
      setActive(d.active);
    } else {
      setChartKey("");
      setTitle("");
      setChartType("bar");
      setSelectedMetricKeys([]);
      setMetricKeysStr("");
      setGroupBy("monthly");
      setTarget("both");
      setPermissionModule("");
      setActive(true);
    }
  }, [visible, editData]);

  function getMetricKeysForPayload(): string[] {
    if (useMultiSelect) {
      return selectedMetricKeys;
    }
    return metricKeysStr
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  function validate(): boolean {
    const e: FormErrors = {};

    if (!chartKey.trim()) {
      e.chartKey = "Chart Key es requerido";
    } else if (chartKey.trim().length > 64) {
      e.chartKey = "Máximo 64 caracteres";
    }

    if (!title.trim()) {
      e.title = "Título es requerido";
    } else if (title.trim().length > 120) {
      e.title = "Máximo 120 caracteres";
    }

    if (!chartType) {
      e.chartType = "Tipo de gráfico es requerido";
    }

    const keys = getMetricKeysForPayload();
    if (keys.length === 0) {
      e.metricKeys = "Al menos 1 metric key es requerido";
    } else if (keys.length > 10) {
      e.metricKeys = "Máximo 10 metric keys";
    }

    if (!groupBy) {
      e.groupBy = "Group By es requerido";
    }

    if (!target) {
      e.target = "Target es requerido";
    }

    if (!permissionModule.trim()) {
      e.permissionModule = "Permission Module es requerido";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const payload: ChartPayload = {
      chartKey: chartKey.trim(),
      title: title.trim(),
      chartType,
      metricKeys: getMetricKeysForPayload(),
      groupBy,
      target,
      permissionModule: permissionModule.trim(),
      active,
    };

    try {
      if (isEdit) {
        await svc.updateChart(editData.data.id, payload);
      } else {
        await svc.createChart(payload);
      }
      onSaved();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el gráfico");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DpContentSet
      title={isEdit ? "Editar Gráfico" : "Nuevo Gráfico"}
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
            label="Chart Key"
            name="chartKey"
            value={chartKey}
            onChange={(v) => { setChartKey(v); clearError(); }}
            disabled={isEdit}
            placeholder="ej: trips-trend"
          />
          {errors.chartKey && (
            <small className="text-red-500">{errors.chartKey}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Título"
            name="title"
            value={title}
            onChange={(v) => { setTitle(v); clearError(); }}
            placeholder="Nombre del gráfico"
          />
          {errors.title && (
            <small className="text-red-500">{errors.title}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Tipo de Gráfico"
            name="chartType"
            value={chartType}
            onChange={(v) => { setChartType(v as ChartType); clearError(); }}
            options={CHART_TYPE_OPTIONS}
          />
          {errors.chartType && (
            <small className="text-red-500">{errors.chartType}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {useMultiSelect ? (
            <DpInput
              type="multiselect"
              label="Metric Keys (1-10)"
              name="metricKeys"
              value={selectedMetricKeys}
              onChange={(v) => { setSelectedMetricKeys(v as string[]); clearError(); }}
              options={metricKeyOptions}
              placeholder="Seleccionar métricas"
              filter
            />
          ) : (
            <DpInput
              type="input"
              label="Metric Keys (separados por coma)"
              name="metricKeys"
              value={metricKeysStr}
              onChange={(v) => { setMetricKeysStr(v); clearError(); }}
              placeholder="ej: trips-count, invoices-count"
            />
          )}
          {errors.metricKeys && (
            <small className="text-red-500">{errors.metricKeys}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Group By"
            name="groupBy"
            value={groupBy}
            onChange={(v) => { setGroupBy(v as GroupBy); clearError(); }}
            options={GROUP_BY_OPTIONS}
          />
          {errors.groupBy && (
            <small className="text-red-500">{errors.groupBy}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="select"
            label="Target"
            name="target"
            value={target}
            onChange={(v) => { setTarget(v as TargetType); clearError(); }}
            options={TARGET_OPTIONS}
          />
          {errors.target && (
            <small className="text-red-500">{errors.target}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Permission Module"
            name="permissionModule"
            value={permissionModule}
            onChange={(v) => { setPermissionModule(v); clearError(); }}
            placeholder="ej: trip"
          />
          {errors.permissionModule && (
            <small className="text-red-500">{errors.permissionModule}</small>
          )}
        </div>

        <DpInput
          type="check"
          label="Activo"
          name="active"
          value={active}
          onChange={(v) => { setActive(v); clearError(); }}
        />
      </div>
    </DpContentSet>
  );
}
