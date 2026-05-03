import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  createWebCompanyRole,
  getWebCompanyRoleById,
  updateWebCompanyRole,
} from "~/features/platform/web-roles";

export default function WebCompanyRoleDialog(props: {
  visible: boolean;
  companyId: string | null;
  roleId: string | null;
  onSuccess: () => void;
  onHide: () => void;
}) {
  const { visible, companyId, roleId, onSuccess, onHide } = props;
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
    void getWebCompanyRoleById(roleId, companyId).then((r) => {
      setName(r?.name ?? "");
      setDescription(r?.description ?? "");
      setReadOnly(!!r?.readonly);
    });
  }, [visible, isEdit, roleId, companyId]);

  const valid = name.trim().length > 0 && Boolean(companyId?.trim());

  const save = async () => {
    if (!valid || !companyId?.trim() || readOnly) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateWebCompanyRole(
          roleId,
          { name: name.trim(), description: description.trim() },
          companyId.trim()
        );
      } else {
        await createWebCompanyRole({
          companyId: companyId.trim(),
          name: name.trim(),
          description: description.trim(),
        });
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
      title={isEdit ? "Editar rol de empresa (Web)" : "Nuevo rol de empresa (Web)"}
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
          placeholder="Descripción"
          disabled={readOnly}
        />
      </div>
    </DpContentSet>
  );
}
