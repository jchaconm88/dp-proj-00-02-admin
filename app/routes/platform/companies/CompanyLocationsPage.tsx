import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useNavigation, useRevalidator, useMatch, useLoaderData } from "react-router";
import type { Route } from "./+types/CompanyLocationsPage";
import { getCompanyById } from "~/features/platform/companies/index";
import {
  getCompanyLocations,
  createCompanyLocation,
  updateCompanyLocation,
  deleteCompanyLocation,
} from "~/features/platform/company-locations/index";
import type { CompanyLocationRecord } from "~/features/platform/company-locations/index";
import { getUbigeos } from "~/features/platform/ubigeos";
import { DpContentInfo, DpContentHeader, DpTable, DpConfirmDialog, DpContentSet, DpInput } from "~/components/ui";
import type { DpTableDefColumn, DpTableRef } from "~/components/ui";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sedes por empresa" },
    { name: "description", content: "Gestión de sedes de una empresa" },
  ];
}

type Row = CompanyLocationRecord;

type EditingState = {
  id: string | null;
  name: string;
  description: string;
  ubigeo: string;
  city: string;
  country: string;
  district: string;
  address: string;
  active: boolean;
};

const EMPTY_EDITING: EditingState = {
  id: null,
  name: "",
  description: "",
  ubigeo: "",
  city: "",
  country: "PE",
  district: "",
  address: "",
  active: true,
};

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true, sort: true },
  { header: "Ciudad", column: "city", order: 2, display: true, filter: true, sort: true },
  { header: "Distrito", column: "district", order: 3, display: true, filter: true, sort: true },
  { header: "Dirección", column: "address", order: 4, display: true, filter: true, sort: true },
];

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const companyId = String(params?.id ?? "").trim() || null;
  if (!companyId) {
    return {
      companyId: null as string | null,
      companyName: "",
      rows: [] as Row[],
    };
  }
  const [company, rows] = await Promise.all([
    getCompanyById(companyId),
    getCompanyLocations(companyId),
  ]);
  return {
    companyId,
    companyName: company?.name ?? "",
    rows,
  };
}

export default function CompanyLocationsPage() {
  const loaderData = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<Row>>(null);

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";
  const isAdd = !!useMatch("/companies/:id/company-locations/add");
  const editMatch = useMatch("/companies/:id/company-locations/edit/:locationId");
  const editId = editMatch?.params.locationId
    ? decodeURIComponent(editMatch.params.locationId)
    : null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);

  const dialogVisible = isAdd || !!editId;
  const editingItem = useMemo(() => {
    if (!editId) return null;
    return loaderData.rows.find((r) => r.id === editId) ?? null;
  }, [editId, loaderData.rows]);

  const [editing, setEditing] = useState<EditingState>(EMPTY_EDITING);
  const [ubigeoOptions, setUbigeoOptions] = useState<{ label: string; value: string }[]>([]);
  const [ubigeoNameByCode, setUbigeoNameByCode] = useState<Record<string, string>>({});

  const basePath = loaderData.companyId
    ? `/companies/${encodeURIComponent(loaderData.companyId)}/company-locations`
    : "/companies";

  useEffect(() => {
    void getUbigeos("PE")
      .then((items) => {
        const byCode: Record<string, string> = {};
        for (const item of items) byCode[item.code] = item.name;
        setUbigeoNameByCode(byCode);
        setUbigeoOptions(items.map((item) => ({ label: `${item.name} (${item.code})`, value: item.code })));
      })
      .catch(() => {
        setUbigeoNameByCode({});
        setUbigeoOptions([]);
      });
  }, []);

  const parseUbigeo = (name: string): { city: string; district: string } => {
    const parts = name.split("—").map((x) => x.trim()).filter(Boolean);
    return {
      district: parts[0] ?? "",
      city: parts[1] ?? parts[0] ?? "",
    };
  };

  const openAdd = () => {
    setEditing(EMPTY_EDITING);
    navigate(`${basePath}/add`);
  };

  const openEdit = (row: Row) => {
    setEditing({
      id: row.id,
      name: row.name,
      description: row.description,
      ubigeo: row.ubigeo,
      city: row.city,
      country: row.country || "PE",
      district: row.district,
      address: row.address,
      active: row.active !== false,
    });
    navigate(`${basePath}/edit/${encodeURIComponent(row.id)}`);
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const valid = editing.name.trim().length > 0 && editing.ubigeo.trim().length === 6;

  const handleSave = async () => {
    const companyId = loaderData.companyId;
    if (!companyId || !valid) return;
    setSaving(true);
    setError(null);
    try {
      const ubigeoName = ubigeoNameByCode[editing.ubigeo.trim()] ?? "";
      const ubigeoDerived = parseUbigeo(ubigeoName);
      const payload = {
        companyId,
        name: editing.name.trim(),
        description: editing.description.trim(),
        ubigeo: editing.ubigeo.trim(),
        city: isAdd ? ubigeoDerived.city : editing.city.trim(),
        country: editing.country.trim() || "PE",
        district: isAdd ? ubigeoDerived.district : editing.district.trim(),
        address: editing.address.trim(),
        active: editing.active,
      };
      if (editing.id) {
        await updateCompanyLocation(editing.id, payload);
      } else {
        await createCompanyLocation(payload);
      }
      navigate(basePath);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sede.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setPendingDeleteIds(selected.map((r) => r.id));
  };

  const handleConfirmDelete = async () => {
    const ids = pendingDeleteIds;
    const companyId = loaderData.companyId;
    if (!ids?.length || !companyId) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => deleteCompanyLocation(id, companyId)));
      tableRef.current?.clearSelectedRows();
      setPendingDeleteIds(null);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron eliminar las sedes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentInfo
      title={loaderData.companyName ? `Sedes: ${loaderData.companyName}` : "Sedes por empresa"}
      breadcrumbItems={["PLATAFORMA", "EMPRESAS", "SEDES"]}
      backLabel="Volver a empresas"
      onBack={() => navigate("/platform/companies")}
      onCreate={loaderData.companyId ? openAdd : undefined}
    >
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={() => revalidator.revalidate()}
        showCreateButton={false}
        onDelete={openDeleteConfirm}
        deleteDisabled={selectedCount === 0 || saving}
        loading={isLoading || saving}
        filterPlaceholder="Filtrar sedes..."
      />

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50/80 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!loaderData.companyId && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          Selecciona una empresa desde la grilla de empresas para gestionar sus sedes.
        </div>
      )}

      {loaderData.companyId && loaderData.rows.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
          Esta empresa no tiene sedes. Crea la primera sede para habilitar operaciones en web.
        </div>
      )}

      <DpTable<Row>
        ref={tableRef}
        data={loaderData.rows}
        loading={isLoading || saving}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        emptyMessage="No hay sedes registradas."
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <DpContentSet
        title={editing.id ? "Editar sede" : "Nueva sede"}
        visible={dialogVisible}
        onHide={() => !saving && navigate(basePath)}
        onCancel={() => !saving && navigate(basePath)}
        onSave={handleSave}
        saving={saving}
        saveDisabled={!valid}
      >
        <div className="flex flex-col gap-4 pt-2">
          <DpInput type="input" label="Nombre" value={editing.name} onChange={(v) => setEditing((s) => ({ ...s, name: v }))} />
          <DpInput type="input" label="Descripción" value={editing.description} onChange={(v) => setEditing((s) => ({ ...s, description: v }))} />
          <DpInput
            type="select"
            label="Ubigeo"
            value={editing.ubigeo}
            onChange={(v) => {
              const code = String(v);
              const selectedName = ubigeoNameByCode[code] ?? "";
              const ubigeoDerived = parseUbigeo(selectedName);
              setEditing((s) => ({
                ...s,
                ubigeo: code,
                city: selectedName ? ubigeoDerived.city : s.city,
                district: selectedName ? ubigeoDerived.district : s.district,
              }));
            }}
            options={[{ label: "— Seleccionar distrito —", value: "" }, ...ubigeoOptions]}
            placeholder="Buscar por nombre o UBIGEO"
            filter
          />
          {!isAdd && (
            <DpInput type="input" label="Ciudad" value={editing.city} onChange={(v) => setEditing((s) => ({ ...s, city: v }))} />
          )}
          {!isAdd && (
            <DpInput type="input" label="Distrito" value={editing.district} onChange={(v) => setEditing((s) => ({ ...s, district: v }))} />
          )}
          <DpInput type="input" label="Dirección" value={editing.address} onChange={(v) => setEditing((s) => ({ ...s, address: v }))} />
          <DpInput type="check" label="Activo" value={editing.active} onChange={(v) => setEditing((s) => ({ ...s, active: v }))} />
        </div>
      </DpContentSet>

      <DpConfirmDialog
        visible={pendingDeleteIds !== null}
        onHide={() => !saving && setPendingDeleteIds(null)}
        title="Eliminar sedes"
        message={
          pendingDeleteIds?.length
            ? `¿Eliminar ${pendingDeleteIds.length} sede(s)? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        severity="danger"
        loading={saving}
      />
    </DpContentInfo>
  );
}
