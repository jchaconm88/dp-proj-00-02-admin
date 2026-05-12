import { useCallback, useEffect, useMemo, useState } from "react";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  type CardDefinitionRecord,
  type CardPayload,
  type TargetType,
} from "./dashboard-config.types";
import * as svc from "./dashboard-config.service";

export interface CardDefinitionFormProps {
  visible: boolean;
  onHide: () => void;
  onSaved: () => void;
  editData?: CardDefinitionRecord | null;
  metricKeys?: string[];
}

const TARGET_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Web", value: "web" },
  { label: "Both", value: "both" },
];

interface FormErrors {
  cardKey?: string;
  metricKey?: string;
  title?: string;
  icon?: string;
  accentClass?: string;
  order?: string;
}

export default function CardDefinitionForm({
  visible,
  onHide,
  onSaved,
  editData,
  metricKeys = [],
}: CardDefinitionFormProps) {
  const isEdit = !!editData;

  const [cardKey, setCardKey] = useState("");
  const [metricKey, setMetricKey] = useState("");
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [accentClass, setAccentClass] = useState("");
  const [order, setOrder] = useState("1");
  const [visible_, setVisible_] = useState(true);
  const [active, setActive] = useState(true);
  const [target, setTarget] = useState<TargetType>("both");
  const [permissionModule, setPermissionModule] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Clear backend error when user modifies any field
  const clearError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const metricKeyOptions = useMemo(
    () => metricKeys.map((k) => ({ label: k, value: k })),
    [metricKeys]
  );

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setErrors({});
    if (editData) {
      const d = editData.data;
      setCardKey(d.cardKey);
      setMetricKey(d.metricKey);
      setTitle(d.title);
      setIcon(d.icon);
      setAccentClass(d.accentClass);
      setOrder(String(d.order));
      setVisible_(d.visible);
      setActive(d.active);
      setTarget(d.target);
      setPermissionModule(d.permissionModule ?? "");
    } else {
      setCardKey("");
      setMetricKey("");
      setTitle("");
      setIcon("");
      setAccentClass("");
      setOrder("1");
      setVisible_(true);
      setActive(true);
      setTarget("both");
      setPermissionModule("");
    }
  }, [visible, editData]);

  function validate(): boolean {
    const e: FormErrors = {};

    if (!cardKey.trim()) {
      e.cardKey = "Card Key es requerido";
    } else if (cardKey.trim().length > 64) {
      e.cardKey = "Máximo 64 caracteres";
    }

    if (!metricKey.trim()) {
      e.metricKey = "Metric Key es requerido";
    }

    if (!title.trim()) {
      e.title = "Título es requerido";
    } else if (title.trim().length > 120) {
      e.title = "Máximo 120 caracteres";
    }

    if (!icon.trim()) {
      e.icon = "Icono es requerido";
    }

    if (!accentClass.trim()) {
      e.accentClass = "Accent Class es requerido";
    }

    const orderNum = parseInt(order, 10);
    if (isNaN(orderNum) || orderNum < 1 || orderNum > 999) {
      e.order = "Orden debe ser entre 1 y 999";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const payload: CardPayload = {
      cardKey: cardKey.trim(),
      metricKey: metricKey.trim(),
      title: title.trim(),
      icon: icon.trim(),
      accentClass: accentClass.trim(),
      order: parseInt(order, 10),
      visible: visible_,
      active,
      target,
      permissionModule: permissionModule.trim() || null,
    };

    try {
      if (isEdit) {
        await svc.updateCard(editData.data.id, payload);
      } else {
        await svc.createCard(payload);
      }
      onSaved();
      onHide();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la tarjeta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DpContentSet
      title={isEdit ? "Editar Tarjeta" : "Nueva Tarjeta"}
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
            label="Card Key"
            name="cardKey"
            value={cardKey}
            onChange={(v) => { setCardKey(v); clearError(); }}
            disabled={isEdit}
            placeholder="ej: trips-count-card"
          />
          {errors.cardKey && (
            <small className="text-red-500">{errors.cardKey}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {metricKeyOptions.length > 0 ? (
            <DpInput
              type="select"
              label="Metric Key"
              name="metricKey"
              value={metricKey}
              onChange={(v) => { setMetricKey(v as string); clearError(); }}
              options={metricKeyOptions}
              placeholder="Seleccionar métrica"
              filter
              filterPlaceholder="Buscar métrica..."
            />
          ) : (
            <DpInput
              type="input"
              label="Metric Key"
              name="metricKey"
              value={metricKey}
              onChange={(v) => { setMetricKey(v); clearError(); }}
              placeholder="ej: trips-count"
            />
          )}
          {errors.metricKey && (
            <small className="text-red-500">{errors.metricKey}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Título"
            name="title"
            value={title}
            onChange={(v) => { setTitle(v); clearError(); }}
            placeholder="Nombre de la tarjeta"
          />
          {errors.title && (
            <small className="text-red-500">{errors.title}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Icono"
            name="icon"
            value={icon}
            onChange={(v) => { setIcon(v); clearError(); }}
            placeholder="ej: pi pi-map"
          />
          {errors.icon && (
            <small className="text-red-500">{errors.icon}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="input"
            label="Accent Class"
            name="accentClass"
            value={accentClass}
            onChange={(v) => { setAccentClass(v); clearError(); }}
            placeholder="ej: text-blue-500"
          />
          {errors.accentClass && (
            <small className="text-red-500">{errors.accentClass}</small>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <DpInput
            type="number"
            label="Orden"
            name="order"
            value={order}
            onChange={(v) => { setOrder(v); clearError(); }}
            placeholder="1-999"
          />
          {errors.order && (
            <small className="text-red-500">{errors.order}</small>
          )}
        </div>

        <DpInput
          type="select"
          label="Target"
          name="target"
          value={target}
          onChange={(v) => { setTarget(v as TargetType); clearError(); }}
          options={TARGET_OPTIONS}
        />

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
          label="Visible"
          name="visible"
          value={visible_}
          onChange={(v) => { setVisible_(v); clearError(); }}
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
