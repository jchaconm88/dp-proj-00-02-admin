import { useRef, useState, useEffect } from "react";
import {
  useLoaderData,
  useMatch,
  useNavigate,
  useNavigation,
  useRevalidator,
} from "react-router";
import { DpContent, DpContentHeader } from "~/components/ui";
import { DpTable, DpTColumn, type DpTableRef } from "~/components/ui";
import { DpConfirmDialog } from "~/components/ui";
import { DpInput, DpCodeInput } from "~/components/ui";
import { DpContentSet } from "~/components/ui";
import { generateSequenceCode } from "~/features/system/sequences";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "~/features/platform/companies/companies.service";
import type { CompanyRecord } from "~/features/platform/companies/companies.types";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const COMPANIES_TABLE_DEF: DpTableDefColumn[] = [
  { header: "ID", column: "id", order: 1, display: true, filter: true, sort: true },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 3,
    display: true,
    filter: true,
    type: "status",
    typeOptions: STATUS_OPTIONS,
  },
  { header: "Código", column: "code", order: 4, display: true, filter: true, sort: true },
  { header: "RUC / Tax ID", column: "taxId", order: 5, display: true, filter: true, sort: true },
  { header: "Miembros", column: "companyUsers", order: 6, display: true, filter: false, sort: false },
];

export async function clientLoader() {
  const items = await getCompanies();
  return { items };
}

interface CompanyDialogProps {
  visible: boolean;
  item: CompanyRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

const TAX_ID_DUPLICATE_MSG = "Ya existe una empresa con ese RUC";
const CODE_DUPLICATE_MSG = "Ya existe una empresa con ese código";

function isTaxIdDuplicateError(message: string): boolean {
  return message.includes("RUC") || message.includes("taxid_duplicate");
}

function isCodeDuplicateError(message: string): boolean {
  return message.includes("code_duplicate") || message.includes(CODE_DUPLICATE_MSG);
}

function CompanyDialog({ visible, item, onHide, onSaved }: CompanyDialogProps) {
  const isEdit = item !== null;

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [taxId, setTaxId] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setId(item.id);
      setName(item.name);
      setStatus(item.status);
      setTaxId(item.taxId ?? "");
      setCode(item.code ?? "");
    } else {
      setId("");
      setName("");
      setStatus("active");
      setTaxId("");
      setCode("");
    }
  }, [visible, item]);

  const valid = name.trim().length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateCompany(item.id, {
          name: name.trim(),
          status,
          taxId: taxId.trim() || undefined,
        });
      } else {
        const finalCode = await generateSequenceCode(code, "company");
        const created = await createCompany({
          name: name.trim(),
          status,
          code: finalCode,
          taxId: taxId.trim() || undefined,
        });
        if (created?.id) setId(created.id);
      }
      onSaved();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setError(
        isTaxIdDuplicateError(message)
          ? TAX_ID_DUPLICATE_MSG
          : isCodeDuplicateError(message)
            ? CODE_DUPLICATE_MSG
            : message
      );
    } finally {
      setSaving(false);
    }
  };

  const STATUS_SELECT_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar empresa" : "Nueva empresa"}
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
        {isEdit && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ID: <strong>{id}</strong>
          </p>
        )}
        <DpInput
          type="input"
          label="Nombre"
          name="companyName"
          value={name}
          onChange={setName}
          placeholder="Nombre de la empresa"
        />
        {isEdit ? (
          <DpInput
            type="input"
            label="Código"
            name="companyCode"
            value={item.code ?? item.id}
            onChange={() => {}}
            disabled
          />
        ) : (
          <DpCodeInput entity="company" label="Código" name="companyCode" value={code} onChange={setCode} />
        )}
        <DpInput
          type="select"
          label="Estado"
          name="companyStatus"
          value={status}
          onChange={(v) => setStatus(v as "active" | "inactive")}
          options={STATUS_SELECT_OPTIONS}
        />
        <DpInput
          type="input"
          label="RUC / Tax ID"
          name="companyTaxId"
          value={taxId}
          onChange={setTaxId}
          placeholder="Número de RUC"
        />
      </div>
    </DpContentSet>
  );
}

export default function CompaniesPage() {
  const { items } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<CompanyRecord>>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const matchAdd = useMatch("/companies/add");
  const matchEdit = useMatch("/companies/edit/:id");

  const showDialog = Boolean(matchAdd || matchEdit);
  const editId = matchEdit?.params.id ?? null;
  const dialogItem = editId ? (items.find((i) => i.id === editId) ?? null) : null;

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/companies/add");
  const openEdit = (row: CompanyRecord) => navigate(`/companies/edit/${encodeURIComponent(row.id)}`);
  const handleHide = () => navigate("/companies");

  const handleSaved = () => {
    navigate("/companies");
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
      await Promise.all(ids.map((id) => deleteCompany(id)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch {
      // errors surfaced on next load
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
        title="EMPRESAS"
        breadcrumbItems={["PLATAFORMA", "EMPRESAS"]}
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
          filterPlaceholder="Filtrar por ID, nombre, RUC..."
        />

        <DpTable<CompanyRecord>
          ref={tableRef}
          data={items}
          loading={isLoading}
          tableDef={COMPANIES_TABLE_DEF}
          linkColumn="name"
          onDetail={openEdit}
          onEdit={openEdit}
          onSelectionChange={(rows) => setSelectedCount(rows.length)}
          showFilterInHeader={false}
          emptyMessage='No hay empresas en la colección "companies".'
          emptyFilterMessage="No hay resultados para el filtro."
        >
          <DpTColumn name="companyUsers">
            {(row: CompanyRecord) => (
              <button
                type="button"
                onClick={() =>
                  navigate(`/companies/${encodeURIComponent(row.id)}/company-users`)
                }
                className="p-button p-button-text p-button-rounded p-button-icon-only"
                aria-label="Miembros por empresa"
                title="Miembros por empresa"
              >
                <i className="pi pi-users" />
              </button>
            )}
          </DpTColumn>
        </DpTable>
      </DpContent>

      <CompanyDialog
        visible={showDialog}
        item={dialogItem}
        onHide={handleHide}
        onSaved={handleSaved}
      />

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={closeDeleteConfirm}
        title="Eliminar empresas"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} empresa(s)? Esta acción no se puede deshacer.`
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
