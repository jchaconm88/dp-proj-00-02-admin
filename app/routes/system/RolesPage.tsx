import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { deleteRole, listRoles, type RoleRecord } from "~/features/system/roles";
import RoleDialog from "./RoleDialog";

const TABLE_DEF = moduleTableDef("role").map((c) => ({ ...c, sort: true }));

export async function clientLoader() {
  return {};
}

export default function RolesPage() {
  useLoaderData<typeof clientLoader>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<RoleRecord>>(null);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [items, setItems] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isLoading = useMemo(
    () => loading || navigation.state !== "idle" || revalidator.state === "loading",
    [loading, navigation.state, revalidator.state]
  );

  const reload = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const u = await getMyAdminUser();
      const acc = u?.accountId?.trim() || null;
      setAccountId(acc);
      if (!acc) {
        setItems([]);
        return;
      }
      const next = await listRoles(acc);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, revalidator.state]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => {
    setEditingId(null);
    setDialogVisible(true);
  };

  const openEdit = (row: RoleRecord) => {
    if (row.readonly) return;
    setEditingId(row.id);
    setDialogVisible(true);
  };

  const openPermissions = (row: RoleRecord) => {
    navigate(`/roles/${encodeURIComponent(row.id)}`);
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    const deletable = selected.filter((r) => !r.readonly);
    if (!deletable.length) return;
    setPendingDeleteIds(deletable.map((r) => r.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setDeleteSaving(true);
    try {
      await Promise.all(ids.map((id) => deleteRole(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleteSaving(false);
    }
  };

  const closeDeleteConfirm = () => {
    if (!deleteSaving) setPendingDeleteIds(null);
  };

  if (!user) return null;

  return (
    <>
      <DpContent title="ROLES DEL PANEL" breadcrumbItems={["ADMIN", "ROLES PANEL"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => void reload()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || deleteSaving}
          loading={isLoading}
          filterPlaceholder="Filtrar por nombre o descripción..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        {!accountId && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            No se encontró `accountId` para tu usuario. Completa onboarding o crea el doc en `users`.
          </div>
        )}

        <DpTable<RoleRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={TABLE_DEF}
          linkColumn="name"
          onEdit={openEdit}
          onDetail={openPermissions}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay roles en la colección "roles".'
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      {dialogVisible && (
        <RoleDialog
          visible={dialogVisible}
          accountId={accountId}
          roleId={editingId}
          onSuccess={async () => {
            setDialogVisible(false);
            await reload();
          }}
          onHide={() => setDialogVisible(false)}
        />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar roles"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} rol(es)? Esta acción no se puede deshacer.`
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

