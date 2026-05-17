import { useRef, useState } from "react";
import { useNavigate, useNavigation, useRevalidator, useMatch, useLoaderData } from "react-router";
import type { Route } from "./+types/CompanyLocationsPage";
import { getCompanyById } from "~/features/platform/companies/index";
import {
  getCompanyLocations,
  deleteCompanyLocation,
} from "~/features/platform/company-locations/index";
import type { CompanyLocationRecord } from "~/features/platform/company-locations/index";
import { DpContentInfo, DpContentHeader, DpTable, DpConfirmDialog } from "~/components/ui";
import type { DpTableRef } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import CompanyLocationDialog from "./CompanyLocationDialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sedes por empresa" },
    { name: "description", content: "Gestión de sedes de una empresa" },
  ];
}

type Row = CompanyLocationRecord;

const TABLE_DEF = moduleTableDef("company-location").map((c) => ({ ...c, sort: true }));

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const companyId = String(params?.id ?? "").trim() || null;
  if (!companyId) {
    return {
      companyId: null as string | null,
      companyName: "",
      rows: [] as Row[],
    };
  }
  const [company, rows] = await Promise.all([
    getCompanyById(companyId),
    getCompanyLocations(companyId),
  ]);
  return {
    companyId,
    companyName: company?.name ?? "",
    rows,
  };
}

export default function CompanyLocationsPage() {
  const loaderData = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<Row>>(null);

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";
  const isAdd = !!useMatch("/companies/:id/company-locations/add");
  const editMatch = useMatch("/companies/:id/company-locations/edit/:locationId");
  const editId = editMatch?.params.locationId
    ? decodeURIComponent(editMatch.params.locationId)
    : null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);

  const dialogVisible = isAdd || !!editId;
  const editItem = editId ? (loaderData.rows.find((r) => r.id === editId) ?? null) : null;

  const basePath = loaderData.companyId
    ? `/companies/${encodeURIComponent(loaderData.companyId)}/company-locations`
    : "/companies";

  const openAdd = () => {
    navigate(`${basePath}/add`);
  };

  const openEdit = (row: Row) => {
    navigate(`${basePath}/edit/${encodeURIComponent(row.id)}`);
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const handleDialogSaved = () => {
    navigate(basePath);
    revalidator.revalidate();
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setPendingDeleteIds(selected.map((r) => r.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    const companyId = loaderData.companyId;
    if (!ids?.length || !companyId) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => deleteCompanyLocation(id, companyId)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron eliminar las sedes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentInfo
      title={loaderData.companyName ? `Sedes: ${loaderData.companyName}` : "Sedes por empresa"}
      breadcrumbItems={["PLATAFORMA", "EMPRESAS", "SEDES"]}
      backLabel="Volver a empresas"
      onBack={() => navigate("/platform/companies")}
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
        filterPlaceholder="Filtrar sedes..."
      />

      {!loaderData.companyId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          Selecciona una empresa desde la grilla de empresas para gestionar sus sedes.
        </div>
      )}

      {loaderData.companyId && loaderData.rows.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          Esta empresa no tiene sedes. Crea la primera sede para habilitar operaciones en web.
        </div>
      )}

      <DpTable<Row>
        ref={tableRef}
        data={loaderData.rows}
        loading={isLoading || saving}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        emptyMessage="No hay sedes registradas."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      {dialogVisible && (
        <CompanyLocationDialog
          visible={dialogVisible}
          companyId={loaderData.companyId}
          isAdd={isAdd}
          editItem={editItem}
          onHide={() => navigate(basePath)}
          onSaved={handleDialogSaved}
        />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={() => !saving && setPendingDeleteIds(null)}
        title="Eliminar sedes"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} sede(s)? Esta acción no se puede deshacer.`
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
