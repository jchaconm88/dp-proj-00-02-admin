import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import { createRole, getRoleById, updateRole } from "~/features/system/roles";

export default function RoleDialog(props: {
  visible: boolean;
  accountId: string | null;
  roleId: string | null;
  onSuccess: () => void;
  onHide: () => void;
}) {
  const { visible, accountId, roleId, onSuccess, onHide } = props;
  const isEdit = roleId != null;
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!isEdit) {
      setName("");
      setDescription("");
      setReadOnly(false);
      return;
    }
    void getRoleById(roleId).then((r) => {
      setName(r?.name ?? "");
      setDescription(r?.description ?? "");
      setReadOnly(!!r?.readonly);
    });
  }, [visible, isEdit, roleId]);

  const valid = name.trim().length > 0;

  const save = async () => {
    if (!valid || readOnly) return;
    if (!accountId) {
      setError("Falta accountId.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateRole(roleId, { name: name.trim(), description: description.trim() });
      } else {
        await createRole({ accountId, name: name.trim(), description: description.trim() });
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={isEdit ? "Editar rol" : "Nuevo rol"}
      recordId={roleId}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={save}
      saving={saving || busy}
      saveDisabled={!valid || busy || readOnly}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput
          type="input"
          label="Nombre"
          name="roleName"
          value={name}
          onChange={setName}
          placeholder="Nombre del rol"
          disabled={readOnly}
        />
        <DpInput
          type="input"
          label="Descripción"
          name="roleDescription"
          value={description}
          onChange={setDescription}
          placeholder="Descripción (opcional)"
          disabled={readOnly}
        />
      </div>
    </DpContentSet>
  );
}

