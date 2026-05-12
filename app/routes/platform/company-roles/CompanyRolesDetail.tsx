import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Checkbox } from "primereact/checkbox";
import { DpContentInfo, DpContentHeader, DpTable } from "~/components/ui";
import type { DpTableDefColumn, DpTableRef } from "~/components/ui";
import { getCompanyRoleById, updateCompanyRole, type CompanyRoleRecord } from "~/features/platform/web-roles";
import type { RolePermissions } from "~/features/system/roles/roles.types";
import CompanyRoleDialog from "./CompanyRoleDialog";
import CompanyRolePermissionDialog from "./CompanyRolePermissionDialog";

const PERMISSIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Módulo", column: "moduleId", order: 1, display: true, filter: true },
  { header: "Permisos", column: "permissions", order: 2, display: true, filter: true },
];

const FULL_ACCESS_MODULE = "*";
const FULL_ACCESS_CODE = "*";

interface PermissionRow {
  id: string;
  moduleId: string;
  permissions: string[];
}

export default function CompanyRolesDetail() {
  const { id: roleIdParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const permissionTableRef = useRef<DpTableRef<PermissionRow>>(null);

  const roleId = roleIdParam ?? "";
  const companyIdFromQuery = String(searchParams.get("companyId") ?? "").trim();

  const [role, setRole] = useState<CompanyRoleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [selectedPermissionCount, setSelectedPermissionCount] = useState(0);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionEditModuleId, setPermissionEditModuleId] = useState<string | null>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);

  const loadRole = async () => {
    if (!roleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await getCompanyRoleById(roleId, companyIdFromQuery || null);
      setRole(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar rol");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleId) {
      setLoading(false);
      return;
    }
    void loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, companyIdFromQuery]);

  const permissionRows: PermissionRow[] = Object.entries(role?.permissions ?? {}).map(
    ([moduleId, codes]) => ({
      id: moduleId,
      moduleId,
      permissions: Array.isArray(codes) ? codes : [],
    })
  );

  const backToRoles = () => navigate("/company-roles");

  const deletePermissions = async () => {
    if (!role || !roleId) return;
    const selected = permissionTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const toRemove = new Set(selected.map((r) => r.moduleId));
    const newPermissions: RolePermissions = {};
    for (const [moduleId, codes] of Object.entries(role.permissions ?? {})) {
      if (!toRemove.has(moduleId)) newPermissions[moduleId] = codes;
    }
    setSaving(true);
    setError(null);
    try {
      await updateCompanyRole(roleId, { permissions: newPermissions }, role.companyId || companyIdFromQuery || null);
      permissionTableRef.current?.clearSelectedRows();
      void loadRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionFilter = (value: string) => {
    setPermissionFilter(value);
    permissionTableRef.current?.filter(value);
  };

  const hasFullAccess =
    role != null &&
    Array.isArray(role.permissions?.[FULL_ACCESS_MODULE]) &&
    role.permissions[FULL_ACCESS_MODULE].includes(FULL_ACCESS_CODE);

  const onFullAccessChange = async (checked: boolean) => {
    if (!role || !roleId) return;
    setSaving(true);
    setError(null);
    const newPermissions: RolePermissions = { ...(role.permissions ?? {}) };
    if (checked) {
      newPermissions[FULL_ACCESS_MODULE] = [FULL_ACCESS_CODE];
    } else {
      delete newPermissions[FULL_ACCESS_MODULE];
    }
    try {
      await updateCompanyRole(roleId, { permissions: newPermissions }, role.companyId || companyIdFromQuery || null);
      void loadRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar acceso total.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DpContentInfo
        title="ROL WEB"
        breadcrumbItems={["ADMIN", "ROLES WEB", "DETALLE"]}
        backLabel="Volver a roles"
        onBack={backToRoles}
      >
        <p className="text-zinc-500">Cargando...</p>
      </DpContentInfo>
    );
  }

  if (!role) {
    return (
      <DpContentInfo
        title="ROL WEB"
        breadcrumbItems={["ADMIN", "ROLES WEB", "DETALLE"]}
        backLabel="Volver a roles"
        onBack={backToRoles}
      >
        <p className="text-zinc-500">{error ?? "Rol no encontrado."}</p>
      </DpContentInfo>
    );
  }

  return (
    <DpContentInfo
      title={role.name || roleId}
      breadcrumbItems={["ADMIN", "ROLES WEB", "DETALLE"]}
      backLabel="Volver a roles"
      onBack={backToRoles}
      editLabel={role.readonly ? undefined : "Editar rol"}
      onEdit={role.readonly ? undefined : () => setEditRoleOpen(true)}
    >
      <div className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 p-3 dark:border-navy-600">
          <Checkbox
            inputId="full-access"
            checked={hasFullAccess}
            onChange={(e) => onFullAccessChange(e.checked === true)}
            disabled={saving || loading || !!role.readonly}
          />
          <label
            htmlFor="full-access"
            className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Acceso total al sistema (*.*) - este rol puede hacer cualquier operación
          </label>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Permisos por módulo
          </h2>
          <DpContentHeader
            filterValue={permissionFilter}
            onFilter={handlePermissionFilter}
            onLoad={() => void loadRole()}
            onCreate={role.readonly ? undefined : () => { setPermissionEditModuleId(null); setPermissionDialogOpen(true); }}
            onDelete={role.readonly ? undefined : deletePermissions}
            deleteDisabled={!!role.readonly || selectedPermissionCount === 0 || saving}
            loading={loading}
            filterPlaceholder="Filtrar módulos..."
          />
          <DpTable<PermissionRow>
            ref={permissionTableRef}
            data={permissionRows}
            loading={loading}
            tableDef={PERMISSIONS_TABLE_DEF}
            linkColumn="moduleId"
            onDetail={
              role.readonly
                ? undefined
                : (row) => {
                    setPermissionEditModuleId(row.moduleId);
                    setPermissionDialogOpen(true);
                  }
            }
            onEdit={
              role.readonly
                ? undefined
                : (row) => {
                    setPermissionEditModuleId(row.moduleId);
                    setPermissionDialogOpen(true);
                  }
            }
            onSelectionChange={(rows) => setSelectedPermissionCount(rows.length)}
            showFilterInHeader={false}
            emptyMessage="No hay permisos. Agregar para definir."
            emptyFilterMessage="No hay resultados."
          />
        </section>

        <CompanyRolePermissionDialog
          visible={permissionDialogOpen}
          roleId={roleId || null}
          companyId={role.companyId || companyIdFromQuery || null}
          readOnly={!!role.readonly}
          editModuleId={permissionEditModuleId}
          onSuccess={async () => { setPermissionDialogOpen(false); void loadRole(); }}
          onHide={() => setPermissionDialogOpen(false)}
        />

        <CompanyRoleDialog
          visible={editRoleOpen}
          companyId={role.companyId}
          roleId={roleId || null}
          onSuccess={() => { setEditRoleOpen(false); void loadRole(); }}
          onHide={() => setEditRoleOpen(false)}
        />
      </div>
    </DpContentInfo>
  );
}
