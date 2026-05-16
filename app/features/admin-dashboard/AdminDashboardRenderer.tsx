import { useCallback, useEffect, useMemo, useState } from "react";
import { Skeleton } from "primereact/skeleton";
import { Button } from "primereact/button";
import { hasPermissionCode } from "~/lib/permission-codes";
import { getAdminSnapshot } from "./admin-dashboard.service";
import type { DashboardSnapshotResponse, SnapshotCard, SnapshotChart } from "./dashboard.types";
import DashboardKpiCard from "./DashboardKpiCard";
import DashboardChart from "./DashboardChart";
import DashboardPeriodSelector from "./DashboardPeriodSelector";

// ─── Filter Utilities ────────────────────────────────────────────────────────

function filterByTarget<T extends { target: "admin" | "web" | "both" }>(items: T[]): T[] {
  return items.filter((item) => item.target === "admin" || item.target === "both");
}

function filterByPermission<T extends { permissionModule: string | null }>(
  items: T[],
  effectivePermissions: string[]
): T[] {
  if (effectivePermissions.includes("*")) return items;
  return items.filter((item) => {
    if (!item.permissionModule) return true;
    return hasPermissionCode(effectivePermissions, "view", item.permissionModule);
  });
}

// ─── Period Utilities ────────────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─── Component Props ─────────────────────────────────────────────────────────

interface AdminDashboardRendererProps {
  accountId: string;
  effectivePermissions: string[];
  onRecompose?: () => void;
  recomposing?: boolean;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminDashboardRenderer({
  accountId,
  effectivePermissions,
  onRecompose,
  recomposing = false,
}: AdminDashboardRendererProps) {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [snapshot, setSnapshot] = useState<DashboardSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [fetchSnapshot, refreshKey]);

  const handleRecompose = useCallback(() => {
    if (onRecompose) {
      onRecompose();
    } else {
      setRefreshKey((k) => k + 1);
    }
  }, [onRecompose]);

  const handlePeriodChange = useCallback((newPeriod: string) => {
    setPeriod(newPeriod);
  }, []);

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

  const isEmpty = !loading && !error && filteredCards.length === 0 && filteredCharts.length === 0;

  return (
    <div className="space-y-6">
      {/* Period selector + recompose button */}
      <div className="flex items-center gap-3">
        <DashboardPeriodSelector value={period} onChange={handlePeriodChange} />
        <Button
          type="button"
          icon="pi pi-refresh"
          size="small"
          outlined
          onClick={handleRecompose}
          loading={recomposing}
          disabled={recomposing}
          tooltip="Recomponer dashboard"
          tooltipOptions={{ position: "top" }}
          aria-label="Recomponer dashboard"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="relative h-36 animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-[var(--dp-surface-low)]/80"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <div className="p-5">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="mt-4 h-8 w-16 rounded bg-white/10" />
                <div className="mt-4 h-2 w-full rounded bg-white/10" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
          <i className="pi pi-exclamation-triangle text-red-400" aria-hidden />
          <span className="flex-1 text-sm text-red-200">{error}</span>
          <Button
            type="button"
            icon="pi pi-refresh"
            label="Reintentar"
            size="small"
            severity="danger"
            outlined
            onClick={() => void fetchSnapshot()}
          />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <i className="pi pi-info-circle text-amber-400" aria-hidden />
          <span className="text-sm text-amber-200">
            No hay datos disponibles para el periodo seleccionado.
          </span>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && filteredCards.length > 0 && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card, i) => (
            <DashboardKpiCard key={card.cardKey} card={card} index={i} />
          ))}
        </section>
      )}

      {/* Charts Section */}
      {!loading && !error && filteredCharts.length > 0 && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredCharts.map((chart) => (
            <DashboardChart key={chart.chartKey} chart={chart} />
          ))}
        </section>
      )}
    </div>
  );
}

export default AdminDashboardRenderer;
