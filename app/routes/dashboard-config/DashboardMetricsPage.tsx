import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  DpConfirmDialog,
  DpContent,
  DpContentHeader,
  DpContentHeaderAction,
  DpTable,
  DpTColumn,
  type DpTableRef,
} from "~/components/ui";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { listAdminRoles } from "~/lib/admin-roles.service";
import { getEffectivePermissions } from "~/lib/effective-permissions";
import { isGranted } from "~/lib/accessService";
import {
  getMetrics,
  deleteMetric,
  MetricDefinitionForm,
  MetricTemplateWizard,
  type MetricDefinitionRecord,
} from "~/features/dashboard-config";

// ─── Flat row type for DpTable ────────────────────────────────────────────────

interface MetricTableRow {
  id: string;
  metricKey: string;
  label: string;
  type: string;
  measureType: string;
  target: string;
  source: string;
  readonly: boolean;
  _record: MetricDefinitionRecord;
}

// ─── Table definition ─────────────────────────────────────────────────────────

const SOURCE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  default: { label: "Default", severity: "info" },
  custom: { label: "Custom", severity: "success" },
};

const READONLY_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  true: { label: "Readonly", severity: "warning" },
  false: { label: "Editable", severity: "secondary" },
};

const TARGET_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  admin: { label: "Admin", severity: "info" },
  web: { label: "Web", severity: "success" },
  both: { label: "Ambos", severity: "warning" },
};

const METRICS_TABLE_DEF = moduleTableDef("metric-definition", {
  target: TARGET_OPTIONS,
  source: SOURCE_OPTIONS,
  readonly: READONLY_OPTIONS,
}).map((c) => ({ ...c, sort: true }));

// ─── Flatten helper ───────────────────────────────────────────────────────────

function flattenMetrics(records: MetricDefinitionRecord[]): MetricTableRow[] {
  return records.map((r) => ({
    id: r.data.id,
    metricKey: r.data.metricKey,
    label: r.data.label,
    type: r.data.type,
    measureType: r.data.measureType,
    target: (r.data as any).target ?? "both",
    source: r.source,
    readonly: r.readonly,
    _record: r,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function clientLoader() {
  return {};
}

export default function DashboardMetricsPage() {
  const { user } = useAuth();

  // ─── Permissions ────────────────────────────────────────────────────────────
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadPermissions() {
      if (!user?.uid) return;
      try {
        const me = await getMyAdminUser();
        if (cancelled || !me?.accountId) return;
        const roles = await listAdminRoles(me.accountId);
        if (cancelled) return;
        const perms = getEffectivePermissions({
          roleIds: me.adminRoleIds ?? [],
          roleNames: me.adminRoleNames ?? [],
          roles,
        });
        setEffectivePermissions(perms);
      } finally {
        if (!cancelled) setPermissionsLoading(false);
      }
    }
    void loadPermissions();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const canCreate = useMemo(
    () => isGranted(effectivePermissions, "create", "dashboard-metrics"),
    [effectivePermissions]
  );
  const canEdit = useMemo(
    () => isGranted(effectivePermissions, "edit", "dashboard-metrics"),
    [effectivePermissions]
  );
  const canDelete = useMemo(
    () => isGranted(effectivePermissions, "delete", "dashboard-metrics"),
    [effectivePermissions]
  );

  // ─── Table ref ──────────────────────────────────────────────────────────────
  const tableRef = useRef<DpTableRef<MetricTableRow>>(null);

  // ─── Data state ─────────────────────────────────────────────────────────────
  const [metrics, setMetrics] = useState<MetricDefinitionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");

  // ─── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ─── Form dialogs ──────────────────────────────────────────────────────────
  const [formVisible, setFormVisible] = useState(false);
  const [formEdit, setFormEdit] = useState<MetricDefinitionRecord | null>(null);
  const [wizardVisible, setWizardVisible] = useState(false);

  // ─── Flattened data ─────────────────────────────────────────────────────────
  const rows = useMemo(() => flattenMetrics(metrics), [metrics]);

  // ─── Load function ──────────────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics("admin");
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoading) {
      void loadMetrics();
    }
  }, [permissionsLoading, loadMetrics]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const handleCreate = () => {
    setFormEdit(null);
    setFormVisible(true);
  };

  const handleEdit = (row: MetricTableRow) => {
    setFormEdit(row._record);
    setFormVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      await deleteMetric(deleteTarget.id);
      await loadMetrics();
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleteSaving(false);
    }
  };

  // ─── Actions column renderer ────────────────────────────────────────────────
  const actionsRenderer = useCallback(
    (row: MetricTableRow) => {
      if (row.readonly) return null;
      return (
        <div className="flex gap-1">
          {canDelete && (
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-sm p-button-danger"
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              onClick={() => setDeleteTarget({ id: row.id, label: row.label })}
            />
          )}
        </div>
      );
    },
    [canDelete]
  );

  if (!user) return null;

  return (
    <>
      <DpContent
        title="MÉTRICAS DE DASHBOARD"
        breadcrumbItems={["SETUP", "MÉTRICAS DASHBOARD"]}
        onCreate={canCreate ? handleCreate : undefined}
      >
        {permissionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          </div>
        ) : (
          <>
            <DpContentHeader
              filterValue={filterValue}
              onFilter={handleFilter}
              onLoad={() => void loadMetrics()}
              showCreateButton={false}
              loading={loading}
              filterPlaceholder="Filtrar métricas..."
            >
              {canCreate && (
                <DpContentHeaderAction>
                  <Button
                    label="Quick Create"
                    icon="pi pi-bolt"
                    className="dp-btn-soft"
                    size="small"
                    onClick={() => setWizardVisible(true)}
                  />
                </DpContentHeaderAction>
              )}
            </DpContentHeader>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <DpTable<MetricTableRow>
              ref={tableRef}
              data={rows}
              loading={loading}
              tableDef={METRICS_TABLE_DEF}
              linkColumn="metricKey"
              onDetail={handleEdit}
              onEdit={canEdit ? handleEdit : undefined}
              showFilterInHeader={false}
              emptyMessage="No hay métricas definidas."
              emptyFilterMessage="No hay resultados para el filtro."
            >
              {(canEdit || canDelete) && (
                <DpTColumn<MetricTableRow> name="actions">
                  {actionsRenderer}
                </DpTColumn>
              )}
            </DpTable>
          </>
        )}
      </DpContent>

      <MetricDefinitionForm
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSaved={loadMetrics}
        editData={formEdit}
      />

      <MetricTemplateWizard
        visible={wizardVisible}
        onHide={() => setWizardVisible(false)}
        onSaved={loadMetrics}
      />

      <DpConfirmDialog
        visible={deleteTarget !== null}
        onHide={() => { if (!deleteSaving) setDeleteTarget(null); }}
        title="Eliminar métrica"
        message={
          deleteTarget
            ? `¿Eliminar "${deleteTarget.label}"? Esta acción no se puede deshacer.`
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
