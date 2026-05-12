import { useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { getAdminSnapshot } from "./admin-dashboard.service";
import type { DashboardSnapshotResponse, SnapshotCard, SnapshotChart } from "./dashboard.types";

// ─── Filter Utilities ────────────────────────────────────────────────────────

/**
 * Filtra items por permiso del usuario.
 * - Si effectivePermissions incluye "*", pasa todo.
 * - Si el item no tiene permissionModule (null/undefined), pasa.
 * - De lo contrario, requiere `{permissionModule}:view` en effectivePermissions.
 */
function filterByPermission<T extends { permissionModule: string | null }>(
  items: T[],
  effectivePermissions: string[]
): T[] {
  if (effectivePermissions.includes("*")) return items;
  return items.filter((item) => {
    if (!item.permissionModule) return true;
    const code = `${item.permissionModule}:view`.toLowerCase();
    return effectivePermissions.some((p) => p.toLowerCase() === code);
  });
}

/**
 * Filtra items por target para el admin dashboard.
 * Incluye items con target === "admin" o target === "both".
 */
function filterByTarget<T extends { target: "admin" | "web" | "both" }>(items: T[]): T[] {
  return items.filter((item) => item.target === "admin" || item.target === "both");
}

// ─── Period Utilities ────────────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getLast12Months(): { label: string; value: string }[] {
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const value = `${y}-${m}`;
    const label = d.toLocaleDateString("es-MX", { year: "numeric", month: "long" });
    months.push({ label, value });
  }
  return months;
}

// ─── Component Props ─────────────────────────────────────────────────────────

interface AdminDashboardRendererProps {
  accountId: string;
  effectivePermissions: string[];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminDashboardRenderer({ accountId, effectivePermissions }: AdminDashboardRendererProps) {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [snapshot, setSnapshot] = useState<DashboardSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodOptions = useMemo(() => getLast12Months(), []);

  const fetchSnapshot = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSnapshot(accountId, period);
      setSnapshot(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, period]);

  useEffect(() => {
    void fetchSnapshot();
  }, [fetchSnapshot]);

  // Filter cards and charts
  const filteredCards = useMemo(() => {
    if (!snapshot?.cards) return [];
    const byTarget = filterByTarget(snapshot.cards);
    return filterByPermission(byTarget, effectivePermissions);
  }, [snapshot?.cards, effectivePermissions]);

  const filteredCharts = useMemo(() => {
    if (!snapshot?.charts) return [];
    const byTarget = filterByTarget(snapshot.charts);
    return filterByPermission(byTarget, effectivePermissions);
  }, [snapshot?.charts, effectivePermissions]);

  const isEmpty = !loading && !error && snapshot && !snapshot.hasUsageForPeriod && filteredCards.length === 0;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="period-selector" className="text-sm font-semibold text-[var(--dp-on-surface-soft)]">
          Periodo
        </label>
        <Dropdown
          id="period-selector"
          value={period}
          options={periodOptions}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => setPeriod(e.value)}
          className="w-56"
          placeholder="Seleccionar periodo"
        />
      </div>

      {/* Loading State */}
      {loading && <SkeletonCards />}

      {/* Error State */}
      {!loading && error && (
        <div className="space-y-3">
          <Message severity="error" text={`Error al cargar el dashboard: ${error}`} className="w-full" />
          <Button
            label="Reintentar"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            onClick={() => void fetchSnapshot()}
          />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Message
          severity="info"
          text="No hay datos disponibles para el periodo seleccionado"
          className="w-full"
        />
      )}

      {/* Cards Grid */}
      {!loading && !error && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card) => (
            <DashboardCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Charts Section */}
      {!loading && !error && filteredCharts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredCharts.map((chart) => (
            <DashboardChartPlaceholder key={chart.id} chart={chart} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--dp-outline-soft)] bg-[var(--dp-surface-high)] p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" size="2.5rem" />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height="0.75rem" />
              <Skeleton width="40%" height="1.25rem" />
            </div>
          </div>
          <Skeleton width="100%" height="0.5rem" className="mt-3" />
        </div>
      ))}
    </div>
  );
}

function DashboardCard({ card }: { card: SnapshotCard }) {
  return (
    <div className="rounded-xl border border-[var(--dp-outline-soft)] bg-[var(--dp-surface-high)] p-4 transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dp-surface-low)] ${card.accentClass}`}
        >
          <i className={`${card.icon} text-lg`} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[var(--dp-on-surface-soft)]">{card.title}</p>
          <p className="text-lg font-bold text-[var(--dp-on-surface)]">{card.value}</p>
        </div>
      </div>
      {card.progressPct != null && (
        <div className="mt-3">
          <ProgressBar
            value={card.progressPct}
            showValue={false}
            style={{ height: "6px" }}
          />
          {card.progressLabel && (
            <p className="mt-1 text-[10px] text-[var(--dp-on-surface-soft)]">{card.progressLabel}</p>
          )}
        </div>
      )}
      {card.subtitle && (
        <p className="mt-2 truncate text-[11px] text-[var(--dp-on-surface-soft)]">{card.subtitle}</p>
      )}
    </div>
  );
}

function DashboardChartPlaceholder({ chart }: { chart: SnapshotChart }) {
  return (
    <div className="rounded-xl border border-[var(--dp-outline-soft)] bg-[var(--dp-surface-high)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <i className="pi pi-chart-bar text-[var(--dp-on-surface-soft)]" aria-hidden />
        <h3 className="text-sm font-semibold text-[var(--dp-on-surface)]">{chart.title}</h3>
        <span className="ml-auto rounded-md bg-[var(--dp-surface-low)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--dp-on-surface-soft)]">
          {chart.chartType}
        </span>
      </div>
      <div className="flex h-32 items-center justify-center rounded-lg bg-[var(--dp-surface-low)] text-xs text-[var(--dp-on-surface-soft)]">
        Gráfico ({chart.chartType}) — {chart.datasets.length} dataset(s), {chart.labels.length} periodos
      </div>
    </div>
  );
}

export default AdminDashboardRenderer;
