import { useRef, useState, useEffect } from "react";
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
import { DpInput } from "~/components/ui";
import { DpContentSet } from "~/components/ui";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "~/features/platform/saas-plans/saas-plans.service";
import type { SaasPlanRecord } from "~/features/platform/saas-plans/saas-plans.types";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";

// ─── Table definition ────────────────────────────────────────────────────────

const ACTIVE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  true: { label: "Activo", severity: "success" },
  false: { label: "Inactivo", severity: "secondary" },
};

const PLANS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "ID", column: "id", order: 1, display: true, filter: true, sort: true },
  { header: "Plan ID", column: "planId", order: 2, display: true, filter: true, sort: true },
  { header: "Nombre", column: "name", order: 3, display: true, filter: true, sort: true },
  {
    header: "Activo",
    column: "active",
    order: 4,
    display: true,
    filter: true,
    type: "status",
    typeOptions: ACTIVE_OPTIONS,
  },
];

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader() {
  const items = await getPlans();
  return { items };
}

// ─── PlanDialog ───────────────────────────────────────────────────────────────

interface PlanDialogProps {
  visible: boolean;
  item: SaasPlanRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

function PlanDialog({ visible, item, onHide, onSaved }: PlanDialogProps) {
  const isEdit = item !== null;

  const [id, setId] = useState("");
  const [planId, setPlanId] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setId(item.id);
      setPlanId(item.planId);
      setName(item.name);
      setActive(item.active);
    } else {
      setId("");
      setPlanId("");
      setName("");
      setActive(true);
    }
  }, [visible, item]);

  const valid = id.trim().length > 0 && planId.trim().length > 0 && name.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePlan(item.id, {
          planId: planId.trim(),
          name: name.trim(),
          active,
        });
      } else {
        await createPlan({
          id: id.trim(),
          planId: planId.trim(),
          name: name.trim(),
          active,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const ACTIVE_SELECT_OPTIONS = [
    { label: "Activo", value: "true" },
    { label: "Inactivo", value: "false" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar plan" : "Nuevo plan"}
      recordId={isEdit ? item.id : null}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput
          type="input"
          label="ID"
          name="planDocId"
          value={id}
          onChange={setId}
          disabled={isEdit}
          placeholder="Identificador único del documento"
        />
        <DpInput
          type="input"
          label="Plan ID"
          name="planId"
          value={planId}
          onChange={setPlanId}
          placeholder="Identificador del plan (ej. basic, pro)"
        />
        <DpInput
          type="input"
          label="Nombre"
          name="planName"
          value={name}
          onChange={setName}
          placeholder="Nombre del plan"
        />
        <DpInput
          type="select"
          label="Activo"
          name="planActive"
          value={String(active)}
          onChange={(v) => setActive(v === "true")}
          options={ACTIVE_SELECT_OPTIONS}
        />
      </div>
    </DpContentSet>
  );
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

      <PlanDialog
        visible={showDialog}
        item={dialogItem}
        onHide={handleHide}
        onSaved={handleSaved}
      />

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
