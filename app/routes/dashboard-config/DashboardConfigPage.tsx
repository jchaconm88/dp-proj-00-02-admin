import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  DpConfirmDialog,
  DpContent,
  DpContentHeader,
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
  getCards,
  getCharts,
  deleteCard,
  deleteChart,
  CardDefinitionForm,
  ChartDefinitionForm,
  type MetricDefinitionRecord,
  type CardDefinitionRecord,
  type ChartDefinitionRecord,
} from "~/features/dashboard-config";

// ─── Flat row types for DpTable (requires top-level `id`) ─────────────────────

interface CardTableRow {
  id: string;
  cardKey: string;
  title: string;
  metricKey: string;
  target: string;
  order: number;
  visible: boolean;
  source: string;
  readonly: boolean;
  _record: CardDefinitionRecord;
}

interface ChartTableRow {
  id: string;
  chartKey: string;
  title: string;
  chartType: string;
  target: string;
  source: string;
  readonly: boolean;
  _record: ChartDefinitionRecord;
}

// ─── Table definitions ────────────────────────────────────────────────────────

const SOURCE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  default: { label: "Default", severity: "info" },
  custom: { label: "Custom", severity: "success" },
};

const READONLY_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  true: { label: "Readonly", severity: "warning" },
  false: { label: "Editable", severity: "secondary" },
};

const VISIBLE_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  true: { label: "Sí", severity: "success" },
  false: { label: "No", severity: "secondary" },
};

const CARDS_TABLE_DEF = moduleTableDef("card-definition", {
  visible: VISIBLE_OPTIONS,
  source: SOURCE_OPTIONS,
  readonly: READONLY_OPTIONS,
}).map((c) => ({ ...c, sort: true }));

const CHARTS_TABLE_DEF = moduleTableDef("chart-definition", {
  source: SOURCE_OPTIONS,
  readonly: READONLY_OPTIONS,
}).map((c) => ({ ...c, sort: true }));

// ─── Flatten helpers ──────────────────────────────────────────────────────────

function flattenCards(records: CardDefinitionRecord[]): CardTableRow[] {
  return records.map((r) => ({
    id: r.data.id,
    cardKey: r.data.cardKey,
    title: r.data.title,
    metricKey: r.data.metricKey,
    target: r.data.target,
    order: r.data.order,
    visible: r.data.visible,
    source: r.source,
    readonly: r.readonly,
    _record: r,
  }));
}

function flattenCharts(records: ChartDefinitionRecord[]): ChartTableRow[] {
  return records.map((r) => ({
    id: r.data.id,
    chartKey: r.data.chartKey,
    title: r.data.title,
    chartType: r.data.chartType,
    target: r.data.target,
    source: r.source,
    readonly: r.readonly,
    _record: r,
  }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function clientLoader() {
  return {};
}

export default function DashboardConfigPage() {
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
    () => isGranted(effectivePermissions, "create", "dashboard-config"),
    [effectivePermissions]
  );
  const canEdit = useMemo(
    () => isGranted(effectivePermissions, "edit", "dashboard-config"),
    [effectivePermissions]
  );
  const canDelete = useMemo(
    () => isGranted(effectivePermissions, "delete", "dashboard-config"),
    [effectivePermissions]
  );

  // ─── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);
  const [filterValue, setFilterValue] = useState("");

  // ─── Table refs ─────────────────────────────────────────────────────────────
  const cardsTableRef = useRef<DpTableRef<CardTableRow>>(null);
  const chartsTableRef = useRef<DpTableRef<ChartTableRow>>(null);

  // ─── Metrics (needed for card/chart forms) ──────────────────────────────────
  const [metrics, setMetrics] = useState<MetricDefinitionRecord[]>([]);
  const [metricsLoaded, setMetricsLoaded] = useState(false);

  // ─── Cards ──────────────────────────────────────────────────────────────────
  const [cards, setCards] = useState<CardDefinitionRecord[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  // ─── Charts ─────────────────────────────────────────────────────────────────
  const [charts, setCharts] = useState<ChartDefinitionRecord[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // ─── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "card" | "chart";
    id: string;
    label: string;
  } | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ─── Form dialogs ──────────────────────────────────────────────────────────
  const [cardFormVisible, setCardFormVisible] = useState(false);
  const [cardFormEdit, setCardFormEdit] = useState<CardDefinitionRecord | null>(null);
  const [chartFormVisible, setChartFormVisible] = useState(false);
  const [chartFormEdit, setChartFormEdit] = useState<ChartDefinitionRecord | null>(null);

  // ─── Flattened data ─────────────────────────────────────────────────────────
  const cardRows = useMemo(() => flattenCards(cards), [cards]);
  const chartRows = useMemo(() => flattenCharts(charts), [charts]);

  // ─── Load functions ─────────────────────────────────────────────────────────
  const loadMetrics = useCallback(async () => {
    try {
      const data = await getMetrics();
      setMetrics(data);
      setMetricsLoaded(true);
    } catch {
      // Metrics load silently — only needed for form dropdowns
    }
  }, []);

  const loadCards = useCallback(async () => {
    setCardsLoading(true);
    setCardsError(null);
    try {
      const data = await getCards();
      setCards(data);
      setCardsLoaded(true);
    } catch (e) {
      setCardsError(e instanceof Error ? e.message : "Error al cargar tarjetas");
    } finally {
      setCardsLoading(false);
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      const data = await getCharts();
      setCharts(data);
      setChartsLoaded(true);
    } catch (e) {
      setChartsError(e instanceof Error ? e.message : "Error al cargar gráficos");
    } finally {
      setChartsLoading(false);
    }
  }, []);

  // ─── Load data on tab activation ───────────────────────────────────────────
  useEffect(() => {
    if (permissionsLoading) return;
    if (activeTab === 0 && !cardsLoaded && !cardsLoading) {
      void loadCards();
    } else if (activeTab === 1 && !chartsLoaded && !chartsLoading) {
      void loadCharts();
    }
  }, [activeTab, permissionsLoading, cardsLoaded, cardsLoading, chartsLoaded, chartsLoading, loadCards, loadCharts]);

  // ─── Delete handler ─────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      if (deleteTarget.type === "card") {
        await deleteCard(deleteTarget.id);
        await loadCards();
      } else {
        await deleteChart(deleteTarget.id);
        await loadCharts();
      }
      setDeleteTarget(null);
    } catch (e) {
      setCardsError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeleteSaving(false);
    }
  };

  // ─── Create/Edit handlers ─────────────────────────────────────────────────
  const handleCreateCard = () => {
    if (!metricsLoaded) void loadMetrics();
    setCardFormEdit(null);
    setCardFormVisible(true);
  };

  const handleEditCard = (row: CardTableRow) => {
    if (!metricsLoaded) void loadMetrics();
    setCardFormEdit(row._record);
    setCardFormVisible(true);
  };

  const handleCreateChart = () => {
    if (!metricsLoaded) void loadMetrics();
    setChartFormEdit(null);
    setChartFormVisible(true);
  };

  const handleEditChart = (row: ChartTableRow) => {
    if (!metricsLoaded) void loadMetrics();
    setChartFormEdit(row._record);
    setChartFormVisible(true);
  };

  // ─── Filter & Reload ────────────────────────────────────────────────────────
  const handleFilter = (value: string) => {
    setFilterValue(value);
    if (activeTab === 0) cardsTableRef.current?.filter(value);
    else chartsTableRef.current?.filter(value);
  };

  const handleCreate = () => {
    if (activeTab === 0) handleCreateCard();
    else handleCreateChart();
  };

  // ─── Actions column renderers ───────────────────────────────────────────────
  const cardActionsRenderer = useCallback(
    (row: CardTableRow) => {
      if (row.readonly) return null;
      return (
        <div className="flex gap-1">
          {canDelete && (
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-sm p-button-danger"
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              onClick={() =>
                setDeleteTarget({ type: "card", id: row.id, label: row.title })
              }
            />
          )}
        </div>
      );
    },
    [canDelete]
  );

  const chartActionsRenderer = useCallback(
    (row: ChartTableRow) => {
      if (row.readonly) return null;
      return (
        <div className="flex gap-1">
          {canDelete && (
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-sm p-button-danger"
              tooltip="Eliminar"
              tooltipOptions={{ position: "top" }}
              onClick={() =>
                setDeleteTarget({ type: "chart", id: row.id, label: row.title })
              }
            />
          )}
        </div>
      );
    },
    [canDelete]
  );

  // ─── Error display ──────────────────────────────────────────────────────────
  const ErrorBanner = ({ message }: { message: string | null }) =>
    message ? (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm mb-3">
        {message}
      </div>
    ) : null;

  if (!user) return null;

  return (
    <>
      <DpContent
        title="CONFIG. DASHBOARD"
        breadcrumbItems={["SETUP", "CONFIG. DASHBOARD"]}
        onCreate={canCreate ? handleCreate : undefined}
      >
        {permissionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          </div>
        ) : (
          <TabView
            activeIndex={activeTab}
            onTabChange={(e) => setActiveTab(e.index)}
          >
            {/* ─── Tarjetas Tab ─────────────────────────────────────────── */}
            <TabPanel header="Tarjetas">
              <div className="space-y-3">
                <DpContentHeader
                  filterValue={filterValue}
                  onFilter={handleFilter}
                  onLoad={() => void loadCards()}
                  showCreateButton={false}
                  loading={cardsLoading}
                  filterPlaceholder="Filtrar tarjetas..."
                />

                <ErrorBanner message={cardsError} />

                <DpTable<CardTableRow>
                  ref={cardsTableRef}
                  data={cardRows}
                  loading={cardsLoading}
                  tableDef={CARDS_TABLE_DEF}
                  linkColumn="cardKey"
                  onDetail={handleEditCard}
                  onEdit={canEdit ? handleEditCard : undefined}
                  showFilterInHeader={false}
                  emptyMessage="No hay tarjetas definidas."
                >
                  {(canEdit || canDelete) && (
                    <DpTColumn<CardTableRow> name="actions">
                      {cardActionsRenderer}
                    </DpTColumn>
                  )}
                </DpTable>
              </div>
            </TabPanel>

            {/* ─── Gráficos Tab ─────────────────────────────────────────── */}
            <TabPanel header="Gráficos">
              <div className="space-y-3">
                <DpContentHeader
                  filterValue={filterValue}
                  onFilter={handleFilter}
                  onLoad={() => void loadCharts()}
                  showCreateButton={false}
                  loading={chartsLoading}
                  filterPlaceholder="Filtrar gráficos..."
                />

                <ErrorBanner message={chartsError} />

                <DpTable<ChartTableRow>
                  ref={chartsTableRef}
                  data={chartRows}
                  loading={chartsLoading}
                  tableDef={CHARTS_TABLE_DEF}
                  linkColumn="chartKey"
                  onDetail={handleEditChart}
                  onEdit={canEdit ? handleEditChart : undefined}
                  showFilterInHeader={false}
                  emptyMessage="No hay gráficos definidos."
                >
                  {(canEdit || canDelete) && (
                    <DpTColumn<ChartTableRow> name="actions">
                      {chartActionsRenderer}
                    </DpTColumn>
                  )}
                </DpTable>
              </div>
            </TabPanel>
          </TabView>
        )}
      </DpContent>

      <DpConfirmDialog
        visible={deleteTarget !== null}
        onHide={() => { if (!deleteSaving) setDeleteTarget(null); }}
        title="Eliminar definición"
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

      <CardDefinitionForm
        visible={cardFormVisible}
        onHide={() => setCardFormVisible(false)}
        onSaved={loadCards}
        editData={cardFormEdit}
        metricKeys={metrics.map((m) => m.data.metricKey)}
      />

      <ChartDefinitionForm
        visible={chartFormVisible}
        onHide={() => setChartFormVisible(false)}
        onSaved={loadCharts}
        editData={chartFormEdit}
        metricKeys={metrics.map((m) => m.data.metricKey)}
      />
    </>
  );
}
