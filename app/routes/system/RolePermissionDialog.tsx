import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "react-router";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from "primereact/multiselect";
import { DpContentSet, DpInput } from "~/components/ui";
import { getModules, getModule } from "~/features/system/admin-modules";
import { updateRolePermissions, getRoleById, type RolePermissions } from "~/features/system/roles";
import type { ModulePermission, ModuleRecord } from "~/features/system/admin-modules";

export default function RolePermissionDialog(props: {
  visible: boolean;
  roleId: string | null;
  readOnly?: boolean;
  editModuleId: string | null;
  onSuccess: () => void | Promise<void>;
  onHide: () => void;
}) {
  const { visible, roleId, readOnly, editModuleId, onSuccess, onHide } = props;
  const isEdit = editModuleId != null;
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(editModuleId);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [currentPermissions, setCurrentPermissions] = useState<RolePermissions>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setSelectedModuleId(editModuleId);
    if (!roleId) {
      setCurrentPermissions({});
      setSelectedCodes([]);
      return;
    }
    void getRoleById(roleId).then((r) => {
      const perms = (r?.permissions ?? {}) as RolePermissions;
      setCurrentPermissions(perms);
      setSelectedCodes(editModuleId ? (perms[editModuleId] ?? []) : []);
    });
  }, [visible, roleId, editModuleId]);

  useEffect(() => {
    if (!visible) return;
    void getModules().then(({ items }) => setModules(items)).catch(() => setModules([]));
  }, [visible]);

  useEffect(() => {
    if (!selectedModuleId) {
      setModulePermissions([]);
      return;
    }
    void getModule(selectedModuleId).then((m) => {
      setModulePermissions(Array.isArray(m?.permissions) ? m!.permissions : []);
      if (!isEdit) setSelectedCodes(currentPermissions[selectedModuleId] ?? []);
    }).catch(() => setModulePermissions([]));
  }, [selectedModuleId, isEdit, currentPermissions]);

  const save = async () => {
    if (readOnly) return;
    const moduleId = isEdit ? editModuleId : selectedModuleId;
    if (!roleId || !moduleId) return;
    setSaving(true);
    setError(null);
    try {
      const next: RolePermissions = { ...currentPermissions, [moduleId]: [...selectedCodes] };
      await updateRolePermissions(roleId, next);
      await onSuccess();
      onHide();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const fullAccessModule = selectedCodes.includes("*");
  const codeOptions = useMemo(
    () =>
      modulePermissions.map((p: ModulePermission) => ({
        label: p.label || p.code,
        value: p.code,
      })),
    [modulePermissions]
  );
  const selectedCodesOnly = selectedCodes.filter((c) => c !== "*");
  const moduleOptions = useMemo(
    () =>
      modules.map((m: ModuleRecord) => ({
        label: m.description || m.id,
        value: m.id,
      })),
    [modules]
  );

  return (
    <DpContentSet
      title={isEdit ? "Editar permisos del módulo" : "Agregar permisos por módulo"}
      recordId={isEdit ? editModuleId : null}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving || busy}
      saveDisabled={!!readOnly || !selectedModuleId || busy}
      visible={visible}
      onHide={onHide}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        {!isEdit && (
          <DpInput
            type="select"
            label="Módulo"
            name="moduleId"
            value={selectedModuleId ?? ""}
            onChange={(v) => setSelectedModuleId(v ? String(v) : null)}
            disabled={!!readOnly}
            options={moduleOptions}
            placeholder="Seleccionar módulo"
            filter
            filterPlaceholder="Buscar módulo..."
          />
        )}

        {selectedModuleId && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                inputId="module-full-access"
                checked={fullAccessModule}
                onChange={(e) => setSelectedCodes(e.checked === true ? ["*"] : [])}
                disabled={!!readOnly || saving}
              />
              <label htmlFor="module-full-access" className="cursor-pointer text-sm font-medium">
                Acceso total al módulo (*)
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-medium">Permisos</label>
              <MultiSelect
                value={selectedCodesOnly}
                options={codeOptions}
                onChange={(e) => setSelectedCodes(e.value ?? [])}
                placeholder="Seleccionar permisos"
                className="w-full"
                disabled={!!readOnly || fullAccessModule || saving}
              />
              {fullAccessModule && <span className="text-xs opacity-70">Con acceso total no se pueden elegir permisos concretos.</span>}
            </div>
          </div>
        )}
      </div>
    </DpContentSet>
  );
}

