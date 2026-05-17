import { useRef, useState, useMemo } from "react";
import { useNavigate, useNavigation, useRevalidator, useMatch, useLoaderData } from "react-router";
import {
  deleteCompanyUser,
  getCompanyUsersByCompanyId,
  type CompanyUserRecord,
} from "~/features/platform/company-users/index";
import { getCompanyById } from "~/features/platform/companies/index";
import type { Route } from "./+types/CompanyUsersPage";
import { DpContentHeader, DpContentInfo } from "~/components/ui";
import { DpTable, type DpTableRef } from "~/components/ui";
import { DpConfirmDialog } from "~/components/ui";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import CompanyUserDialog from "./CompanyUserDialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Usuarios por empresa" },
    { name: "description", content: "Asignación de usuarios a una empresa" },
  ];
}

type UserRow = CompanyUserRecord & { emailLabel: string; rolesLabel: string };

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const TABLE_DEF = moduleTableDef("company-user", { status: STATUS_OPTIONS }).map((c) => ({ ...c, sort: true }));

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const companyId = String(params?.id ?? "").trim() || null;
  if (!companyId) {
    return {
      companyId: null as string | null,
      companyName: "",
      rows: [] as UserRow[],
    };
  }
  const [company, members] = await Promise.all([
    getCompanyById(companyId),
    getCompanyUsersByCompanyId(companyId),
  ]);

  const normalized = members;

  const rows: UserRow[] = normalized.map((m) => {
    const name =
      m.user?.trim() ||
      m.userDisplayName?.trim() ||
      "";
    const email = m.userEmail?.trim() || "";
    const emailLabel = name && email
      ? `${name} (${email})`
      : name || email || "—";
    const names = (m.webRoleNames?.filter((x) => String(x).trim()) ?? m.webRoleIds ?? []) as string[];
    return {
      ...m,
      emailLabel,
      rolesLabel: names.length ? names.join(", ") : "—",
    };
  });

  return { companyId, companyName: company?.name ?? "", rows };
}

export default function CompanyUsersPage() {
  const loaderData = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<UserRow>>(null);

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";
  const isAdd = !!useMatch("/companies/:id/company-users/add");
  const editMatch = useMatch("/companies/:id/company-users/edit/:companyUserDocId");
  const editId = editMatch?.params.companyUserDocId
    ? decodeURIComponent(editMatch.params.companyUserDocId)
    : null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);

  const dialogVisible = isAdd || !!editId;

  const editingCompanyUser = useMemo(() => {
    if (!editId) return null;
    return loaderData.rows.find((r) => r.id === editId) ?? null;
  }, [editId, loaderData.rows]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const basePath = loaderData.companyId
    ? `/companies/${encodeURIComponent(loaderData.companyId)}/company-users`
    : "/companies";

  const openAdd = () => navigate(`${basePath}/add`);
  const openEdit = (row: UserRow) => navigate(`${basePath}/edit/${encodeURIComponent(row.id)}`);

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setPendingDeleteIds(selected.map((r) => r.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => deleteCompanyUser(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron eliminar los usuarios.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccess = () => {
    navigate(basePath);
    revalidator.revalidate();
  };

  const handleHide = () => navigate(basePath);
  const handleBack = () => navigate("/platform/companies");

  return (
    <DpContentInfo
      title={
        loaderData.companyName ? `Usuarios: ${loaderData.companyName}` : "Usuarios por empresa"
      }
      breadcrumbItems={["PLATAFORMA", "EMPRESAS", "USUARIOS"]}
      backLabel="Volver a empresas"
      onBack={handleBack}
      onCreate={loaderData.companyId ? openAdd : undefined}
    >
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={() => revalidator.revalidate()}
        showCreateButton={false}
        onDelete={openDeleteConfirm}
        deleteDisabled={selectedCount === 0 || saving}
        loading={isLoading || saving}
        filterPlaceholder="Filtrar por usuario y roles..."
      />

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loaderData.companyId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          Selecciona una empresa desde la grilla de empresas para gestionar sus usuarios.
        </div>
      )}

      <DpTable<UserRow>
        ref={tableRef}
        data={loaderData.rows}
        loading={isLoading || saving}
        tableDef={TABLE_DEF}
        linkColumn="emailLabel"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        emptyMessage="No hay usuarios en esta empresa."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      {dialogVisible && (
        <CompanyUserDialog
          visible={dialogVisible}
          companyId={loaderData.companyId}
          companyUser={isAdd ? null : editingCompanyUser}
          onSuccess={handleSuccess}
          onHide={handleHide}
        />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={() => !saving && setPendingDeleteIds(null)}
        title="Eliminar usuarios"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} usuario(s)? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        severity="danger"
        loading={saving}
      />
    </DpContentInfo>
  );
}
