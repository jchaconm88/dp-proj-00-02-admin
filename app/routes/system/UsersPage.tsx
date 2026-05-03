import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { deleteUser, listUsers, type UserRecord } from "~/features/system/users";
import { listRoles, type RoleRecord } from "~/features/system/roles";
import UserDialog from "./UserDialog";

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "UID", column: "id", order: 1, display: true, filter: true, sort: true },
  { header: "Email", column: "email", order: 2, display: true, filter: true, sort: true },
  { header: "Nombre", column: "displayName", order: 3, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 4,
    display: true,
    filter: true,
    type: "status",
    typeOptions: STATUS_OPTIONS,
  },
];

export async function clientLoader() {
  return {};
}

export default function UsersPage() {
  useLoaderData<typeof clientLoader>();
  const { user } = useAuth();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<UserRecord>>(null);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [items, setItems] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
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
      const u = await getMyAdminUser(user.uid);
      const acc = u?.accountId?.trim() || null;
      setAccountId(acc);
      if (!acc) {
        setItems([]);
        setRoles([]);
        return;
      }
      const [nextUsers, nextRoles] = await Promise.all([listUsers(acc), listRoles(acc)]);
      setItems(nextUsers);
      setRoles(nextRoles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
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

  const openEdit = (row: UserRecord) => {
    setEditingId(row.id);
    setDialogVisible(true);
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
      await Promise.all(ids.map((id) => deleteUser(id)));
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
      <DpContent title="USUARIOS DEL PANEL" breadcrumbItems={["ADMIN", "USUARIOS PANEL"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => void reload()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || deleteSaving}
          loading={isLoading}
          filterPlaceholder="Filtrar por UID, email, nombre..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        {!accountId && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            No se encontró `accountId` para tu usuario. Completa onboarding o crea el doc en `users`.
          </div>
        )}

        <DpTable<UserRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={TABLE_DEF}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay usuarios en la colección "users".'
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      <UserDialog
        visible={dialogVisible}
        accountId={accountId}
        userIdToEdit={editingId}
        roles={roles}
        onSuccess={async () => {
          setDialogVisible(false);
          await reload();
        }}
        onHide={() => setDialogVisible(false)}
      />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
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
        loading={deleteSaving}
      />
    </>
  );
}

