import { useRef, useState } from "react";
import { useLoaderData, useRevalidator, type LoaderFunctionArgs } from "react-router";
import { DpContent, DpContentHeader, DpTable, DpConfirmDialog } from "~/components/ui";
import type { DpTableRef } from "~/components/ui";
import { IntegrationCompanySelect } from "~/components/platform/IntegrationCompanySelect";
import { moduleTableDef } from "~/data/system-modules";
import { getCompanies } from "~/features/platform/companies";
import { getCredentials, revokeCredential, deleteCredential } from "~/features/platform/integration-credentials";
import type { IntegrationCredentialRecord } from "~/features/platform/integration-credentials";
import { IntegrationCredentialDialog } from "./IntegrationCredentialDialog";

const TABLE_DEF = moduleTableDef("integration-credential");

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? "";
  const [companies, items] = await Promise.all([
    getCompanies(),
    companyId ? getCredentials(companyId) : Promise.resolve([]),
  ]);
  return { items, companyId, companies };
}

async function revokeAndDeleteCredential(id: string) {
  await revokeCredential(id);
  await deleteCredential(id);
}

export default function IntegrationCredentialsPage() {
  const { items, companyId, companies } = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<IntegrationCredentialRecord>>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const handleEdit = (item: IntegrationCredentialRecord) => {
    setEditId(item.id);
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setShowDialog(true);
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (!selected.length) return;
    setPendingDeleteIds(selected.map((row) => row.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    if (!ids?.length) return;
    setDeleteSaving(true);
    try {
      await Promise.all(ids.map((id) => revokeAndDeleteCredential(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <>
      <DpContent
        title="CREDENCIALES DE INTEGRACIÓN"
        breadcrumbItems={["PLATAFORMA", "WEB", "INTEGRACIÓN"]}
        onCreate={companyId ? handleAdd : undefined}
      >
        <IntegrationCompanySelect
          companies={companies}
          companyId={companyId}
          basePath="/platform/integration-credentials"
        />
        <DpContentHeader
          filterValue={filterValue}
          onFilter={(v) => {
            setFilterValue(v);
            tableRef.current?.filter(v);
          }}
          onLoad={() => revalidator.revalidate()}
          showCreateButton={false}
          onDelete={companyId ? openDeleteConfirm : undefined}
          deleteDisabled={selectedCount === 0 || deleteSaving}
          filterPlaceholder="Filtrar credenciales…"
          loading={revalidator.state === "loading" || deleteSaving}
        />
        <DpTable<IntegrationCredentialRecord>
          ref={tableRef}
          data={items}
          loading={revalidator.state === "loading"}
          tableDef={TABLE_DEF}
          onEdit={companyId ? handleEdit : undefined}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage={
            companyId
              ? "No hay credenciales para esta empresa."
              : "Seleccione una empresa para listar credenciales."
          }
          emptyFilterMessage="No hay resultados para el filtro."
        />
      </DpContent>

      {showDialog && (
        <IntegrationCredentialDialog
          visible={showDialog}
          credentialId={editId}
          companyId={companyId}
          onHide={() => {
            setShowDialog(false);
            setEditId(null);
          }}
          onSaved={() => {
            setShowDialog(false);
            setEditId(null);
            revalidator.revalidate();
          }}
        />
      )}

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        title="Revocar credenciales"
        message={
          pendingDeleteIds?.length
            ? `¿Revocar y eliminar ${pendingDeleteIds.length} credencial(es)? Esta acción no se puede deshacer.`
            : ""
        }
        onHide={() => !deleteSaving && setPendingDeleteIds(null)}
        onConfirm={handleConfirmDelete}
        severity="danger"
        loading={deleteSaving}
      />
    </>
  );
}
