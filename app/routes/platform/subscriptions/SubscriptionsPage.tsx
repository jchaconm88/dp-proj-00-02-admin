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
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "~/features/platform/subscriptions/subscriptions.service";
import type { SubscriptionRecord } from "~/features/platform/subscriptions/subscriptions.types";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";

// ─── Table definition ────────────────────────────────────────────────────────

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  suspended: { label: "Suspendido", severity: "warning" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

const SUBSCRIPTIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "ID", column: "id", order: 1, display: true, filter: true, sort: true },
  { header: "Plan ID", column: "planId", order: 2, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 3,
    display: true,
    filter: true,
    type: "status",
    typeOptions: STATUS_OPTIONS,
  },
];

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader() {
  const items = await getSubscriptions();
  return { items };
}

// ─── SubscriptionDialog ───────────────────────────────────────────────────────

interface SubscriptionDialogProps {
  visible: boolean;
  item: SubscriptionRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

function SubscriptionDialog({ visible, item, onHide, onSaved }: SubscriptionDialogProps) {
  const isEdit = item !== null;

  const [id, setId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<SubscriptionRecord["status"]>("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setId(item.id);
      setPlanId(item.planId);
      setStatus(item.status);
    } else {
      setId("");
      setPlanId("");
      setStatus("active");
    }
  }, [visible, item]);

  const valid =
    id.trim().length > 0 &&
    planId.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateSubscription(item.id, {
          accountId: item.accountId,
          planId: planId.trim(),
          status,
        });
      } else {
        await createSubscription({
          id: id.trim(),
          accountId: "current",
          planId: planId.trim(),
          status,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_SELECT_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
    { label: "Suspendido", value: "suspended" },
    { label: "Cancelado", value: "cancelled" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar suscripción" : "Nueva suscripción"}
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
          name="subscriptionId"
          value={id}
          onChange={setId}
          disabled={isEdit}
          placeholder="Identificador único del documento"
        />
        <DpInput
          type="input"
          label="Plan ID"
          name="subscriptionPlanId"
          value={planId}
          onChange={setPlanId}
          placeholder="ID del plan"
        />
        <DpInput
          type="select"
          label="Estado"
          name="subscriptionStatus"
          value={status}
          onChange={(v) => setStatus(v as SubscriptionRecord["status"])}
          options={STATUS_SELECT_OPTIONS}
        />
      </div>
    </DpContentSet>
  );
}

// ─── SubscriptionsPage ────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const { items } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<SubscriptionRecord>>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const matchAdd = useMatch("/subscriptions/add");
  const matchEdit = useMatch("/subscriptions/edit/:id");

  const showDialog = Boolean(matchAdd || matchEdit);
  const editId = matchEdit?.params.id ?? null;
  const dialogItem = editId ? (items.find((i) => i.id === editId) ?? null) : null;

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/subscriptions/add");
  const openEdit = (row: SubscriptionRecord) =>
    navigate(`/subscriptions/edit/${encodeURIComponent(row.id)}`);
  const handleHide = () => navigate("/subscriptions");

  const handleSaved = () => {
    navigate("/subscriptions");
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
      await Promise.all(ids.map((id) => deleteSubscription(id)));
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
        title="SUBSCRIPTIONS"
        breadcrumbItems={["PLATAFORMA", "SUBSCRIPTIONS"]}
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
          filterPlaceholder="Filtrar por ID, account, plan..."
        />

        <DpTable<SubscriptionRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={SUBSCRIPTIONS_TABLE_DEF}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay suscripciones en la colección "subscriptions".'
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      <SubscriptionDialog
        visible={showDialog}
        item={dialogItem}
        onHide={handleHide}
        onSaved={handleSaved}
      />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar suscripciones"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} suscripción(es)? Esta acción no se puede deshacer.`
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
