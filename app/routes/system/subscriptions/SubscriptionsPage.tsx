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
  getSubscriptions,
  deleteSubscription,
} from "~/features/platform/subscriptions/subscriptions.service";
import type { SubscriptionRecord } from "~/features/platform/subscriptions/subscriptions.types";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import SubscriptionDialog from "./SubscriptionDialog";

// ─── Table definition ────────────────────────────────────────────────────────

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  suspended: { label: "Suspendido", severity: "warning" },
  cancelled: { label: "Cancelado", severity: "danger" },
};

const SUBSCRIPTIONS_TABLE_DEF = moduleTableDef("subscription", { status: STATUS_OPTIONS }).map((c) => ({ ...c, sort: true }));

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader() {
  const items = await getSubscriptions();
  return { items };
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
        breadcrumbItems={["ADMIN", "SUSCRIPCIONES"]}
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

      {showDialog && (
        <SubscriptionDialog
          visible={showDialog}
          item={dialogItem}
          onHide={handleHide}
          onSaved={handleSaved}
        />
      )}

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
