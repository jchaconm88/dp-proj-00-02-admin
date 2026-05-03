import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useMatch, useNavigate, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";
import { getSequences, deleteSequence, type SequenceRecord } from "~/features/system/sequences";
import SequenceDialog from "./SequenceDialog";

const RESET_PERIOD: Record<string, { label: string; severity: StatusSeverity }> = {
  never: { label: "Nunca", severity: "secondary" },
  yearly: { label: "Anual", severity: "info" },
  monthly: { label: "Mensual", severity: "warning" },
  daily: { label: "Diario", severity: "danger" },
};

const SOURCE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  default: { label: "Default", severity: "secondary" },
  custom: { label: "Custom", severity: "success" },
};

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Entidad", column: "entity", order: 1, display: true, filter: true, sort: true },
  { header: "Prefijo", column: "prefix", order: 2, display: true, filter: true, sort: true },
  { header: "Dígitos", column: "digits", order: 3, display: true, filter: true, sort: true },
  { header: "Formato", column: "format", order: 4, display: true, filter: true, sort: true },
  {
    header: "Reinicio",
    column: "resetPeriod",
    order: 5,
    display: true,
    filter: true,
    type: "status",
    typeOptions: RESET_PERIOD,
  },
  {
    header: "Origen",
    column: "source",
    order: 6,
    display: true,
    filter: true,
    type: "status",
    typeOptions: SOURCE_OPTIONS,
  },
];

export function meta() {
  return [{ title: "Secuencias" }];
}

export async function clientLoader() {
  return {};
}

export default function SequencesPage() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<SequenceRecord>>(null);

  const [items, setItems] = useState<SequenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [filterValue, setFilterValue] = useState("");

  const addMatch = useMatch("/sequences/add");
  const editMatch = useMatch("/sequences/edit/:id");
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
      setItems(await getSequences());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar secuencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidator.state]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/sequences/add");
  const openEdit = (row: SequenceRecord) => {
    if (row.readonly) {
      setError("Las secuencias default no se editan. Crea una secuencia custom con la misma entidad para sobrescribirla.");
      return;
    }
    navigate("/sequences/edit/" + encodeURIComponent(row.id));
  };
  const handleHide = () => navigate("/sequences");

  const handleSuccess = () => {
    void reload();
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (!selected.length) return;
    if (selected.some((s) => s.readonly)) {
      setError("Las secuencias default no se pueden eliminar.");
      return;
    }
    setPendingDeleteIds(selected.map((s) => s.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => deleteSequence(id)));
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
      <DpContent title="SECUENCIAS" breadcrumbItems={["SISTEMA", "SECUENCIAS"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => void reload()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || saving}
          loading={isLoading}
          filterPlaceholder="Filtrar por entidad, prefijo..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        <DpTable<SequenceRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={TABLE_DEF}
          linkColumn="entity"
          onDetail={openEdit}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage="No hay secuencias disponibles."
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      <SequenceDialog visible={dialogVisible} sequenceId={editId} onSuccess={handleSuccess} onHide={handleHide} />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={() => !saving && setPendingDeleteIds(null)}
        title="Eliminar secuencias"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} secuencia(s)? Esta acción no se puede deshacer.`
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
