import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import { MultiSelect } from "primereact/multiselect";
import { createUser, getUserById, updateUser } from "~/features/system/users";
import type { RoleRecord } from "~/features/system/roles";

export default function UserDialog(props: {
  visible: boolean;
  accountId: string | null;
  userIdToEdit: string | null; // uid/docId
  roles: RoleRecord[];
  onSuccess: () => void;
  onHide: () => void;
}) {
  const { visible, accountId, userIdToEdit, roles, onSuccess, onHide } = props;
  const isEdit = userIdToEdit != null;
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!isEdit) {
      setUid("");
      setEmail("");
      setDisplayName("");
      setStatus("active");
      setRoleIds([]);
      return;
    }
    void getUserById(userIdToEdit).then((u) => {
      setUid(u?.id ?? userIdToEdit);
      setEmail(u?.email ?? "");
      setDisplayName(u?.displayName ?? "");
      setStatus(u?.status ?? "active");
      setRoleIds(u?.roleIds ?? []);
    });
  }, [visible, isEdit, userIdToEdit]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: r.name, value: r.id })),
    [roles]
  );

  const roleNames = useMemo(() => {
    const byId = new Map(roles.map((r) => [r.id, r.name]));
    return roleIds.map((id) => byId.get(id)).filter(Boolean) as string[];
  }, [roleIds, roles]);

  const valid = (isEdit ? true : uid.trim().length > 0) && email.trim().length > 0;

  const save = async () => {
    if (!accountId) {
      setError("Falta accountId.");
      return;
    }
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateUser(userIdToEdit, {
          email: email.trim(),
          displayName: displayName.trim(),
          status,
          roleIds,
          roleNames,
        });
      } else {
        const id = uid.trim();
        await createUser({
          id,
          userId: id,
          accountId,
          email: email.trim(),
          displayName: displayName.trim(),
          status,
          roleIds,
          roleNames,
        });
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_SELECT_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      recordId={userIdToEdit}
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
        <DpInput
          type="input"
          label="UID (userId)"
          name="uid"
          value={uid}
          onChange={setUid}
          disabled={isEdit}
          placeholder="UID de Firebase Auth"
        />
        <DpInput type="input" label="Email" name="email" value={email} onChange={setEmail} placeholder="correo@dominio.com" />
        <DpInput type="input" label="Nombre" name="displayName" value={displayName} onChange={setDisplayName} placeholder="Nombre para mostrar" />
        <DpInput
          type="select"
          label="Estado"
          name="status"
          value={status}
          onChange={(v) => setStatus(v as "active" | "inactive")}
          options={STATUS_SELECT_OPTIONS}
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Roles</label>
          <MultiSelect
            value={roleIds}
            options={roleOptions}
            onChange={(e) => setRoleIds((e.value ?? []) as string[])}
            placeholder="Seleccionar roles"
            className="w-full"
            disabled={saving || busy}
            filter
            filterPlaceholder="Buscar roles..."
          />
        </div>
      </div>
    </DpContentSet>
  );
}

