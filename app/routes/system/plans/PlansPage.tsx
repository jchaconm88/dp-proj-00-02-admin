import { useRef, useState } from "react";
import {
  useLoaderData,
  useMatch,
  useNavigate,
  useNavigation,
  useRevalidator,
} from "react-router";
import { DpContent, DpContentHeader } from "~/components/ui";
import { DpTable, type DpTableRef } from "~/components/ui";
import { DpConfirmDialog } from "~/components/ui";
import {
  getPlans,
  deletePlan,
} from "~/features/platform/saas-plans/saas-plans.service";
import type { SaasPlanRecord } from "~/features/platform/saas-plans/saas-plans.types";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import PlanDialog from "./PlanDialog";

// ─── Table definition ────────────────────────────────────────────────────────

const ACTIVE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  true: { label: "Activo", severity: "success" },
  false: { label: "Inactivo", severity: "secondary" },
};

const PLANS_TABLE_DEF = moduleTableDef("plan", { active: ACTIVE_OPTIONS }).map((c) => ({ ...c, sort: true }));

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader() {
  const items = await getPlans();
  return { items };
}

// ─── PlansPage ────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { items } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<SaasPlanRecord>>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const matchAdd = useMatch("/plans/add");
  const matchEdit = useMatch("/plans/edit/:id");

  const showDialog = Boolean(matchAdd || matchEdit);
  const editId = matchEdit?.params.id ?? null;
  const dialogItem = editId ? (items.find((i) => i.id === editId) ?? null) : null;

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/plans/add");
  const openEdit = (row: SaasPlanRecord) => navigate(`/plans/edit/${encodeURIComponent(row.id)}`);
  const handleHide = () => navigate("/plans");

  const handleSaved = () => {
    navigate("/plans");
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
      await Promise.all(ids.map((id) => deletePlan(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch {
      // errors are surfaced via revalidation; keep dialog open on failure
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
        title="PLANS"
        breadcrumbItems={["ADMIN", "PLANES"]}
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
          filterPlaceholder="Filtrar por ID, nombre..."
        />

        <DpTable<SaasPlanRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={PLANS_TABLE_DEF}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay planes en la colección "saas-plans".'
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      {showDialog && (
        <PlanDialog
          visible={showDialog}
          item={dialogItem}
          onHide={handleHide}
          onSaved={handleSaved}
        />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar planes"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} plan(es)? Esta acción no se puede deshacer.`
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
