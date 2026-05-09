import { useEffect, useMemo, useState } from "react";
import type { AdminUserRecord } from "~/lib/admin-user.service";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { useAuth } from "~/lib/auth-context";
import { fetchAdminDashboardSnapshot, type DashboardSnapshot } from "~/features/admin-dashboard/admin-dashboard.service";

function currentUsagePeriod(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUserRecord | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(currentUsagePeriod());

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.uid) return;
      setLoading(true);
      setError(null);
      try {
        const mem = await getMyAdminUser();
        if (cancelled) return;
        setAdminUser(mem);
        if (!mem?.accountId) {
          setSnapshot(null);
          return;
        }
        const snap = await fetchAdminDashboardSnapshot({ accountId: mem.accountId, period });
        if (!cancelled) setSnapshot(snap);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, period]);

  const title = useMemo(
    () => (adminUser?.accountId ? `Cuenta: ${adminUser.accountId}` : "Dashboard"),
    [adminUser?.accountId]
  );

  return (
    <div className="space-y-4">
      <section className="dp-glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="dp-content-title">Dashboard de métricas</h1>
            <p className="text-sm text-[var(--dp-on-surface-soft)]">{title}</p>
          </div>
          <div className="dp-pill-toggle flex items-center gap-2 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--dp-on-surface-soft)]">Periodo</span>
            <input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-24 bg-transparent text-xs font-semibold text-[var(--dp-on-surface)] outline-none"
              placeholder="YYYY-MM"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && <div className="text-sm text-[var(--dp-on-surface-soft)]">Cargando…</div>}

      {!loading && !error && snapshot && (
        <div className="dp-soft-panel rounded-2xl p-6 text-sm text-[var(--dp-on-surface-soft)]">
          Snapshot cargado: <code>{snapshot.period}</code> (cards: {snapshot.cards.length})
        </div>
      )}

      {!loading && !error && !snapshot && (
        <div className="dp-soft-panel rounded-2xl p-6 text-sm text-[var(--dp-on-surface-soft)]">
          Aún no hay snapshot (o falta `accountId` en la membresía).
        </div>
      )}
    </div>
  );
}

