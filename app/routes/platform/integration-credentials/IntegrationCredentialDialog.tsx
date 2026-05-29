import { useState, useEffect } from "react";
import { DpContentSet } from "~/components/ui";
import {
  getCredentialById,
  createCredential,
  updateCredential,
  rotateSecret,
  testCredential,
  revokeCredential,
} from "~/features/platform/integration-credentials";

interface Props {
  visible: boolean;
  credentialId: string | null;
  companyId: string;
  onHide: () => void;
  onSaved: () => void;
}

export function IntegrationCredentialDialog({ visible, credentialId, companyId, onHide, onSaved }: Props) {
  const [label, setLabel] = useState("");
  const [integrator, setIntegrator] = useState("woocommerce");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [defaultWarehouseCode, setDefaultWarehouseCode] = useState("");
  const [priceListCode, setPriceListCode] = useState("web");
  const [syncMode, setSyncMode] = useState<"event_driven" | "manual">("event_driven");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ apiKey: string; apiSecret: string } | null>(null);
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      resetForm();
      return;
    }
    if (credentialId) {
      loadCredential(credentialId);
    } else {
      resetForm();
      setDefaultWarehouseCode("LIMA-01");
      setPriceListCode("web");
    }
  }, [visible, credentialId]);

  function resetForm() {
    setLabel("");
    setIntegrator("woocommerce");
    setWebhookUrl("");
    setWebhookSecret("");
    setDefaultWarehouseCode("");
    setPriceListCode("web");
    setSyncMode("event_driven");
    setError(null);
    setCreatedResult(null);
    setRotatedSecret(null);
  }

  async function loadCredential(id: string) {
    setLoading(true);
    try {
      const cred = await getCredentialById(id);
      if (cred) {
        setLabel(cred.label);
        setIntegrator(cred.integrator);
        setWebhookUrl(cred.webhookUrl ?? "");
        setDefaultWarehouseCode(cred.defaultWarehouseCode);
        setPriceListCode(cred.priceListCode);
        setSyncMode(cred.syncMode);
      }
    } catch (e) {
      setError("Error al cargar credencial");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (credentialId) {
        await updateCredential(credentialId, {
          label,
          webhookUrl: webhookUrl || undefined,
          webhookSecret: webhookSecret || undefined,
          defaultWarehouseCode: defaultWarehouseCode || undefined,
          priceListCode: priceListCode || undefined,
          syncMode,
        });
        onSaved();
      } else {
        const result = await createCredential({
          companyId,
          label,
          integrator,
          webhookUrl: webhookUrl || undefined,
          webhookSecret: webhookSecret || undefined,
          defaultWarehouseCode: defaultWarehouseCode || undefined,
          priceListCode: priceListCode || undefined,
          syncMode,
        });
        setCreatedResult({ apiKey: result.apiKey, apiSecret: result.apiSecret });
        setLabel(result.label);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRotate() {
    if (!credentialId) return;
    setSaving(true);
    try {
      const result = await rotateSecret(credentialId);
      setRotatedSecret(result.apiSecret);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al rotar secreto");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!credentialId) return;
    try {
      await testCredential(credentialId);
      setError(null);
      alert("Conexión exitosa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  const isEditing = !!credentialId;
  const title = isEditing ? "Editar Credencial" : "Nueva Credencial";

  return (
    <DpContentSet
      title={title}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      showLoading={loading}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      {createdResult && (
        <div className="p-message p-message-warn border-round p-2 mb-3">
          <strong>¡Credencial creada! Guarde estos valores (no se mostrarán de nuevo):</strong>
          <div>API Key: <code>{createdResult.apiKey}</code></div>
          <div>API Secret: <code>{createdResult.apiSecret}</code></div>
        </div>
      )}
      {rotatedSecret && (
        <div className="p-message p-message-warn border-round p-2 mb-3">
          <strong>Nuevo Secret (una sola vez):</strong>
          <div>API Secret: <code>{rotatedSecret}</code></div>
        </div>
      )}
      <div className="field">
        <label>Label (ej. woocommerce:tienda.cliente.com)</label>
        <input className="p-inputtext w-full" value={label} onChange={(e) => setLabel(e.target.value)} disabled={!!createdResult} />
      </div>
      <div className="field">
        <label>Integrador</label>
        <select className="p-inputtext w-full" value={integrator} onChange={(e) => setIntegrator(e.target.value)} disabled={!!createdResult}>
          <option value="woocommerce">WooCommerce</option>
          <option value="pos">POS</option>
          <option value="api">API</option>
        </select>
      </div>
      <div className="field">
        <label>Webhook URL</label>
        <input className="p-inputtext w-full" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
      </div>
      <div className="field">
        <label>Webhook Secret</label>
        <input className="p-inputtext w-full" type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder={isEditing ? "(dejar vacío para mantener)" : ""} />
      </div>
      <div className="field">
        <label>Almacén por defecto</label>
        <input className="p-inputtext w-full" value={defaultWarehouseCode} onChange={(e) => setDefaultWarehouseCode(e.target.value)} />
      </div>
      <div className="field">
        <label>Lista de precios</label>
        <input className="p-inputtext w-full" value={priceListCode} onChange={(e) => setPriceListCode(e.target.value)} />
      </div>
      <div className="field">
        <label>Modo de sincronización</label>
        <select className="p-inputtext w-full" value={syncMode} onChange={(e) => setSyncMode(e.target.value as any)}>
          <option value="event_driven">Event-driven (default)</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      {isEditing && (
        <div className="flex gap-2 mt-3">
          <button className="p-button p-component p-button-outlined p-button-sm" onClick={handleRotate}>
            Rotar Secret
          </button>
          <button className="p-button p-component p-button-outlined p-button-sm" onClick={handleTest}>
            Probar Conexión
          </button>
        </div>
      )}
    </DpContentSet>
  );
}
