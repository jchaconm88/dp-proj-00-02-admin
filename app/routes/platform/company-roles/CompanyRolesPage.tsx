import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate, useNavigation, useRevalidator } from "react-router";
import { DpConfirmDialog, DpContent, DpContentHeader, DpTable, type DpTableRef } from "~/components/ui";
import type { DpTableDefColumn } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { getCompanies } from "~/features/platform/companies/companies.service";
import type { CompanyRecord } from "~/features/platform/companies/companies.types";
import {
  deleteWebCompanyRole,
  listWebCompanyRoles,
  type WebCompanyRoleRecord,
} from "~/features/platform/web-roles";
import WebCompanyRoleDialog from "./WebCompanyRoleDialog";

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true, sort: true },
  { header: "Descripción", column: "description", order: 2, display: true, filter: true, sort: true },
];

export async function clientLoader() {
  return {};
}

export default function CompanyRolesPage() {
  useLoaderData<typeof clientLoader>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<WebCompanyRoleRecord>>(null);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [items, setItems] = useState<WebCompanyRoleRecord[]>([]);
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

  const companyOptions = useMemo(
    () =>
      companies.map((c) => ({
        label: (c.name?.trim() || c.id).trim(),
        value: c.id,
      })),
    [companies]
  );

  const reloadCompanies = async () => {
    if (!user?.uid) return;
    try {
      const u = await getMyAdminUser(user.uid);
      const acc = u?.accountId?.trim() || null;
      setAccountId(acc);
      if (!acc) {
        setCompanies([]);
        return;
      }
      const list = await getCompanies();
      setCompanies(list);
      if (!companyId && list.length === 1) setCompanyId(list[0]!.id);
    } catch {
      setCompanies([]);
    }
  };

  const reloadRoles = async () => {
    const cid = companyId.trim();
    if (!cid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await listWebCompanyRoles(cid);
      setItems(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar roles");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, revalidator.state]);

  useEffect(() => {
    void reloadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, accountId]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => {
    setEditingId(null);
    setDialogVisible(true);
  };

  const openEdit = (row: WebCompanyRoleRecord) => {
    if (row.readonly) return;
    setEditingId(row.id);
    setDialogVisible(true);
  };

  const openPermissions = (row: WebCompanyRoleRecord) => {
    const cid = companyId.trim();
    const search = cid ? `?companyId=${encodeURIComponent(cid)}` : "";
    navigate({ pathname: `/company-roles/${encodeURIComponent(row.id)}`, search });
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
      const cid = companyId.trim();
      await Promise.all(ids.map((id) => deleteWebCompanyRole(id, cid || null)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      await reloadRoles();
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

  const selectedCompanyId = companyId.trim() || null;

  return (
    <>
      <DpContent title="ROLES POR EMPRESA (WEB)" breadcrumbItems={["ADMIN", "ROLES WEB"]} onCreate={openAdd}>
        <DpContentHeader
          filterValue={filterValue}
          onFilter={handleFilter}
          onLoad={() => {
            void reloadCompanies();
            void reloadRoles();
          }}
          showCreateButton={false}
          onDelete={openDeleteConfirm}
          deleteDisabled={selectedCount === 0 || deleteSaving || !selectedCompanyId}
          loading={isLoading}
          filterPlaceholder="Filtrar por nombre..."
        />

        {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">{error}</div>}

        {!accountId && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            No se encontró `accountId` para tu usuario.
          </div>
        )}

        <p className="mb-2 text-sm text-[var(--dp-on-surface-soft)]">
          Roles de la app Web por empresa (Firestore Web, colección <code>roles</code>). Los roles del panel Admin están
          en <code>/roles</code>.
        </p>

        <div className="mb-4 max-w-md">
          <label className="block text-sm font-medium text-[var(--dp-on-surface)]">Empresa</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-3 py-2 outline-none dark:bg-white/5"
          >
            <option value="">— Selecciona empresa —</option>
            {companyOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <DpTable<WebCompanyRoleRecord>
          ref={tableRef}
          data={items}
          loading={isLoading && !!selectedCompanyId}
          tableDef={TABLE_DEF}
          linkColumn="name"
          onEdit={openEdit}
          onDetail={openPermissions}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage={
            selectedCompanyId ? "No hay roles para esta empresa." : "Selecciona una empresa para ver sus roles."
          }
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      <WebCompanyRoleDialog
        visible={dialogVisible}
        companyId={selectedCompanyId}
        roleId={editingId}
        onSuccess={async () => {
          setDialogVisible(false);
          await reloadRoles();
        }}
        onHide={() => setDialogVisible(false)}
      />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar roles Web"
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
