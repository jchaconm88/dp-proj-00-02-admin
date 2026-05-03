import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { deleteWebAppUser, listWebAppUsers, type WebAppUserRecord } from "~/features/platform/web-users";
import WebUserDialog from "./WebUserDialog";

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
  invited: { label: "Invitado", severity: "warning" },
};

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "ID", column: "id", order: 1, display: true, filter: true, sort: true },
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

export default function WebUsersPage() {
  useLoaderData<typeof clientLoader>();
  const { user } = useAuth();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<WebAppUserRecord>>(null);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [items, setItems] = useState<WebAppUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

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
        return;
      }
      const next = await listWebAppUsers();
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios Web");
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

  const openEdit = (row: WebAppUserRecord) => {
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
      await Promise.all(ids.map((id) => deleteWebAppUser(id)));
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
      <DpContent title="USUARIOS WEB" breadcrumbItems={["ADMIN", "USUARIOS WEB"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => void reload()}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || deleteSaving}
          loading={isLoading}
          filterPlaceholder="Filtrar por id, email, nombre..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        {!accountId && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            No se encontró `accountId` para tu usuario. Completa onboarding o crea el doc en `users` (Admin).
          </div>
        )}

        <p className="mb-2 text-sm text-[var(--dp-on-surface-soft)]">
          Usuarios de la aplicación Web (Firestore Web, colección <code>users</code>). No confundir con usuarios del panel
          Admin en <code>/users</code>.
        </p>

        <DpTable<WebAppUserRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={TABLE_DEF}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage="No hay usuarios Web para esta cuenta."
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      <WebUserDialog
        visible={dialogVisible}
        userIdToEdit={editingId}
        onSuccess={(pw) => {
          setDialogVisible(false);
          if (pw) setGeneratedPassword(pw);
          void reload();
        }}
        onHide={() => setDialogVisible(false)}
      />

      {generatedPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Contraseña generada
            </h2>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Esta contraseña solo se muestra una vez. Guárdala o compártela con el usuario.
            </p>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <code className="flex-1 font-mono text-sm text-gray-900 dark:text-white break-all">
                {generatedPassword}
              </code>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(generatedPassword)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                title="Copiar"
              >
                <i className="pi pi-copy mr-1" />
                Copiar
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGeneratedPassword(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-white"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar usuarios Web"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} usuario(s) Web? Esta acción no se puede deshacer.`
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
