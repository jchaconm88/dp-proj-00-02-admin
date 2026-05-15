import { useRef, useState } from "react";
import {
  useLoaderData,
  useMatch,
  useNavigate,
  useNavigation,
  useRevalidator,
} from "react-router";
import { DpContent, DpContentHeader } from "~/components/ui";
import { DpTable, DpTColumn, type DpTableRef } from "~/components/ui";
import { DpConfirmDialog } from "~/components/ui";
import {
  getCompanies,
  deleteCompany,
  type CompanyRecord,
} from "~/features/platform/companies/index";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";
import CompanyDialog from "./CompanyDialog";

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const COMPANIES_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 2,
    display: true,
    filter: true,
    type: "status",
    typeOptions: STATUS_OPTIONS,
  },
  { header: "Código", column: "code", order: 3, display: true, filter: true, sort: true },
  { header: "RUC / Tax ID", column: "taxId", order: 4, display: true, filter: true, sort: true },
  { header: "Miembros", column: "companyUsers", order: 5, display: true, filter: false, sort: false },
  { header: "Sedes", column: "companyLocations", order: 6, display: true, filter: false, sort: false },
];

export async function clientLoader() {
  const items = await getCompanies();
  return { items };
}

export default function CompaniesPage() {
  const { items } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<CompanyRecord>>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const matchAdd = useMatch("/platform/companies/add");
  const matchEdit = useMatch("/platform/companies/edit/:id");

  const showDialog = Boolean(matchAdd || matchEdit);
  const editId = matchEdit?.params.id ?? null;
  const dialogItem = editId ? (items.find((i) => i.id === editId) ?? null) : null;

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/platform/companies/add");
  const openEdit = (row: CompanyRecord) =>
    navigate(`/platform/companies/edit/${encodeURIComponent(row.id)}`);
  const handleHide = () => navigate("/platform/companies");

  const handleSaved = () => {
    navigate("/platform/companies");
    revalidator.revalidate();
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (!selected.length) return;
    setPendingDeleteIds(selected.map((r) => r.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setDeleteSaving(true);
    try {
      await Promise.all(ids.map((id) => deleteCompany(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch {
      // errors surfaced on next load
    } finally {
      setDeleteSaving(false);
    }
  };

  const closeDeleteConfirm = () => {
    if (!deleteSaving) setPendingDeleteIds(null);
  };

  return (
    <>
      <DpContent
        title="EMPRESAS"
        breadcrumbItems={["PLATAFORMA", "EMPRESAS"]}
        onCreate={openAdd}
      >
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => revalidator.revalidate()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || deleteSaving}
          loading={isLoading}
          filterPlaceholder="Filtrar por nombre, código, RUC..."
        />

        <DpTable<CompanyRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={COMPANIES_TABLE_DEF}
          linkColumn="name"
          onDetail={openEdit}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay empresas en la colección "companies".'
          emptyFilterMessage="No hay resultados para el filtro."
        >
          <DpTColumn name="companyUsers">
            {(row: CompanyRecord) => (
              <button
                type="button"
                onClick={() =>
                  navigate(`/platform/companies/${encodeURIComponent(row.id)}/company-users`)
                }
                className="p-button p-button-text p-button-rounded p-button-icon-only"
                aria-label="Miembros por empresa"
                title="Miembros por empresa"
              >
                <i className="pi pi-users" />
              </button>
            )}
          </DpTColumn>
          <DpTColumn name="companyLocations">
            {(row: CompanyRecord) => (
              <button
                type="button"
                onClick={() =>
                  navigate(`/platform/companies/${encodeURIComponent(row.id)}/company-locations`)
                }
                className="p-button p-button-text p-button-rounded p-button-icon-only"
                aria-label="Sedes por empresa"
                title="Sedes por empresa"
              >
                <i className="pi pi-map-marker" />
              </button>
            )}
          </DpTColumn>
        </DpTable>
      </DpContent>

      <CompanyDialog
        visible={showDialog}
        item={dialogItem}
        onHide={handleHide}
        onSaved={handleSaved}
      />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar empresas"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} empresa(s)? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        severity="danger"
        loading={deleteSaving}
      />
    </>
  );
}
