import { useMemo, useState, useEffect } from "react";
import { useNavigation } from "react-router";
import { MultiSelect } from "primereact/multiselect";
import { DpInput } from "~/components/ui";
import { DpContentSet } from "~/components/ui";
import {
  createCompanyUser,
  updateCompanyUser,
  type CompanyUserRecord,
} from "~/features/platform/company-users/index";
import { listCompanyRoles, type CompanyRoleRecord } from "~/features/platform/web-roles";
import { listWebAppUsers, type WebAppUserRecord } from "~/features/platform/web-users";

const STATUS_OPTIONS: { label: string; value: "active" | "inactive" }[] = [
  { label: "Activo", value: "active" },
  { label: "Inactivo", value: "inactive" },
];

function findUserForCompanyUser(
  companyUser: CompanyUserRecord,
  users: WebAppUserRecord[]
): WebAppUserRecord | null {
  const byId = new Map(users.map((u) => [u.id, u]));
  const byEmail = new Map(users.map((u) => [u.email.trim().toLowerCase(), u]));
  const uid = String(companyUser.usersDocId ?? "").trim();
  const em = String(companyUser.userEmail ?? "").trim().toLowerCase();
  return (
    (uid ? byId.get(uid) : undefined) ||
    (em ? byEmail.get(em) : undefined) ||
    byId.get(companyUser.userId) ||
    null
  );
}

export interface CompanyUserDialogProps {
  visible: boolean;
  companyId: string | null;
  companyUser: CompanyUserRecord | null;
  onSuccess?: () => void;
  onHide: () => void;
}

export default function CompanyUserDialog({
  visible,
  companyId,
  companyUser,
  onSuccess,
  onHide,
}: CompanyUserDialogProps) {
  const isEdit = !!companyUser;
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const [selectedUserDocId, setSelectedUserDocId] = useState("");
  const [users, setUsers] = useState<WebAppUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roles, setRoles] = useState<CompanyRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.authUid === selectedUserDocId) ?? null,
    [users, selectedUserDocId]
  );

  const editCompanyUserProfile = useMemo(() => {
    if (!isEdit || !companyUser) return null;
    return findUserForCompanyUser(companyUser, users);
  }, [isEdit, companyUser, users]);

  const editUserLabel = useMemo(() => {
    if (!isEdit || !companyUser) return "";
    return (
      editCompanyUserProfile?.displayName?.trim() ||
      editCompanyUserProfile?.email?.trim() ||
      companyUser.user?.trim() ||
      companyUser.userDisplayName?.trim() ||
      companyUser.userEmail?.trim() ||
      companyUser.usersDocId?.trim() ||
      companyUser.userId
    );
  }, [isEdit, companyUser, editCompanyUserProfile]);

  const userSelectOptions = useMemo(
    () =>
      users.map((u) => {
        const name = u.displayName?.trim() || "";
        const email = u.email?.trim() || "";
        const label = name && email ? `${name} (${email})` : name || email || u.id;
        return { label, value: u.authUid };
      }),
    [users]
  );

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (companyUser) {
      setSelectedUserDocId(
        String(companyUser.usersDocId ?? "").trim() ||
          (companyUser.id.includes("_") ? companyUser.id.split("_").slice(1).join("_").trim() : "")
      );
      setRoleIds(companyUser.webRoleIds ?? []);
      setStatus(companyUser.status);
      return;
    }
    setSelectedUserDocId("");
    setRoleIds([]);
    setStatus("active");
  }, [visible, companyUser]);

  useEffect(() => {
    if (!visible || !companyId?.trim()) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    setRolesLoading(true);
    listCompanyRoles(companyId.trim())
      .then((rows) => {
        if (!cancelled) setRoles(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setRoles([]);
          setError("No se pudieron cargar los roles Web de la empresa.");
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, companyId]);

  const loadUsers = async () => {
    if (usersLoading) return;
    setUsersLoading(true);
    setError(null);
    try {
      const rows = await listWebAppUsers();
      setUsers(rows);
    } catch {
      setError("No se pudo cargar la lista de usuarios Web.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (users.length > 0) return;
    void loadUsers();
  }, [visible, users.length]);

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name || r.id])), [roles]);

  const save = async () => {
    const cid = companyId?.trim();
    if (!cid) {
      setError("No hay empresa seleccionada.");
      return;
    }
    const normalizedRoleIds = [...new Set(roleIds.map((x) => String(x).trim()).filter(Boolean))];
    if (normalizedRoleIds.length === 0) {
      setError("Debes asignar al menos un rol.");
      return;
    }
    const roleNames = normalizedRoleIds
      .map((id) => roleNameById.get(id) || id)
      .map((n) => String(n).trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);
    try {
      if (isEdit && companyUser) {
        await updateCompanyUser(companyUser.id, {
          webRoleIds: normalizedRoleIds,
          webRoleNames: roleNames,
          status,
        });
      } else {
        if (!selectedUser) {
          setError("Selecciona un usuario Web existente.");
          setSaving(false);
          return;
        }
        const userId = selectedUser.authUid.trim();
        if (!userId) {
          setError("El usuario seleccionado no tiene authUid.");
          setSaving(false);
          return;
        }
        await createCompanyUser({
          companyId: cid,
          userId,
          user: selectedUser.displayName?.trim() || selectedUser.email.trim() || undefined,
          usersDocId: selectedUser.id.trim() || undefined,
          userEmail: selectedUser.email.trim().toLowerCase() || undefined,
          userDisplayName: selectedUser.displayName?.trim() || undefined,
          webRoleIds: normalizedRoleIds,
          webRoleNames: roleNames,
          status,
        });
      }
      onSuccess?.();
      onHide();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar el usuario de empresa.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const roleSelectOptions = roles.map((r) => ({
    label: r.name || r.id,
    value: r.id,
  }));

  return (
    <DpContentSet
      title={isEdit ? "Editar usuario de empresa" : "Agregar usuario de empresa"}
      recordId={isEdit ? (companyUser?.userId ?? null) : null}
      cancelLabel="Cancelar"
      onCancel={onHide}
      saveLabel="Guardar"
      onSave={save}
      saving={saving || isNavigating}
      saveDisabled={
        !companyId ||
        (!isEdit && !selectedUserDocId.trim()) ||
        roleIds.length === 0 ||
        rolesLoading ||
        (!isEdit && usersLoading) ||
        isNavigating
      }
      visible={visible}
      onHide={onHide}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      {!isEdit && (
        <div className="space-y-2">
          <DpInput
            type="select"
            label="Usuario"
            name="usersDocId"
            value={selectedUserDocId}
            onChange={(v) => setSelectedUserDocId(String(v))}
            options={userSelectOptions}
            placeholder={usersLoading ? "Cargando usuarios..." : "Seleccionar usuario existente"}
            filter
            onRefresh={() => void loadUsers()}
            refreshing={usersLoading}
            refreshAriaLabel="Recargar usuarios"
          />
        </div>
      )}
      {isEdit && (
        <p className="text-sm text-[var(--dp-on-surface-soft)]">
          Usuario: <strong>{editUserLabel}</strong>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--dp-on-surface)]">Roles Web de la empresa</label>
        <MultiSelect
          value={roleIds}
          options={roleSelectOptions}
          onChange={(e) => setRoleIds((e.value as string[]) ?? [])}
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar roles"
          display="chip"
          className="w-full"
          filter
          disabled={rolesLoading}
        />
      </div>

      <DpInput
        type="select"
        label="Estado"
        name="status"
        value={status}
        onChange={(v) => setStatus(String(v) as "active" | "inactive")}
        options={STATUS_OPTIONS}
      />
    </DpContentSet>
  );
}
