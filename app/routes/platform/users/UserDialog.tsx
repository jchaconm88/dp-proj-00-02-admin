import { useEffect, useState, useCallback } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  createWebAppUser,
  getWebAppUserById,
  updateWebAppUser,
  type WebAppUserRecord,
} from "~/features/platform/web-users";

const STATUS_OPTIONS: { label: string; value: WebAppUserRecord["status"] }[] = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
  { label: "Invitado", value: "invited" },
];

function generateRandomPassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const all = lowercase + uppercase + digits + symbols;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += all[bytes[i] % all.length];
  }
  return password;
}

export default function WebUserDialog(props: {
  visible: boolean;
  userIdToEdit: string | null;
  onSuccess: (generatedPassword?: string) => void;
  onHide: () => void;
}) {
  const { visible, userIdToEdit, onSuccess, onHide } = props;
  const isEdit = userIdToEdit != null;
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<WebAppUserRecord["status"]>("active");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const regeneratePassword = useCallback(() => {
    setPassword(generateRandomPassword(16));
  }, []);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!isEdit) {
      setEmail("");
      setDisplayName("");
      setStatus("active");
      setPassword(generateRandomPassword(16));
      setShowPassword(true);
      return;
    }
    void getWebAppUserById(userIdToEdit).then((u) => {
      setEmail(u?.email ?? "");
      setDisplayName(u?.displayName ?? "");
      setStatus(u?.status ?? "active");
    });
  }, [visible, isEdit, userIdToEdit]);

  const valid = email.trim().length > 0;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateWebAppUser(userIdToEdit, {
          email: email.trim(),
          displayName: displayName.trim(),
          status: status === "inactive" ? "inactive" : status === "invited" ? "invited" : "active",
        });
        onSuccess();
      } else {
        const result = await createWebAppUser({
          email: email.trim(),
          displayName: displayName.trim(),
          status: status === "inactive" ? "inactive" : "active",
          password: password.trim() || undefined,
        });
        onSuccess(result.generatedPassword);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      recordId={isEdit ? userIdToEdit : null}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={save}
      saving={saving || busy}
      saveDisabled={!valid || busy}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput type="input" label="Email" name="email" value={email} onChange={setEmail} placeholder="usuario@empresa.com" />
        <DpInput
          type="input"
          label="Nombre"
          name="displayName"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Nombre Apellido"
        />
        <DpInput
          type="select"
          label="Estado"
          name="status"
          value={String(status)}
          onChange={(v) => setStatus(String(v) as WebAppUserRecord["status"])}
          options={STATUS_OPTIONS}
        />
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--dp-on-surface)]">Contraseña</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Contraseña para el usuario"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                <i className={`pi ${showPassword ? "pi-eye" : "pi-eye-slash"}`} />
              </button>
            </div>
            <button
              type="button"
              onClick={regeneratePassword}
              className="self-start text-xs text-[var(--dp-primary)] hover:underline"
            >
              <i className="pi pi-refresh mr-1" />
              Generar nueva contraseña
            </button>
          </div>
        )}
      </div>
    </DpContentSet>
  );
}
