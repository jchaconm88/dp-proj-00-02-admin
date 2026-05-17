import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useMatch, useNavigate, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import { getCounters, deleteCounter, type CounterRecord } from "~/features/system/counters";
import CounterDialog from "./CounterDialog";

const TABLE_DEF = moduleTableDef("counter").map((c) => ({ ...c, sort: true }));

export function meta() {
  return [{ title: "Contadores" }];
}

export async function clientLoader() {
  return {};
}

export default function CountersPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<CounterRecord>>(null);

  const [items, setItems] = useState<CounterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [filterValue, setFilterValue] = useState("");

  const addMatch = useMatch("/counters/add");
  const editMatch = useMatch("/counters/edit/:id");
  const isAdd = !!addMatch;
  const editId = editMatch?.params.id ? decodeURIComponent(editMatch.params.id) : null;
  const dialogVisible = isAdd || !!editId;

  const isLoading = useMemo(
    () => loading || navigation.state !== "idle" || revalidator.state === "loading" || saving,
    [loading, navigation.state, revalidator.state, saving]
  );

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getCounters());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar contadores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [revalidator.state]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/counters/add");
  const openEdit = (row: CounterRecord) => navigate("/counters/edit/" + encodeURIComponent(row.id));
  const handleHide = () => navigate("/counters");

  const handleSuccess = () => {
    void reload();
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (!selected.length) return;
    setPendingDeleteIds(selected.map((s) => s.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => deleteCounter(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DpContent title="CONTADORES" breadcrumbItems={["SISTEMA", "CONTADORES"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => void reload()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || saving}
          loading={isLoading}
          filterPlaceholder="Filtrar por sequence ID..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        <DpTable<CounterRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={TABLE_DEF}
          linkColumn="sequenceId"
          onDetail={openEdit}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage="No hay contadores disponibles."
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      {dialogVisible && (
        <CounterDialog visible={dialogVisible} counterId={editId} onSuccess={handleSuccess} onHide={handleHide} />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={() => !saving && setPendingDeleteIds(null)}
        title="Eliminar contadores"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} contador(es)? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        severity="danger"
        loading={saving}
      />

      <Outlet />
    </>
  );
}
