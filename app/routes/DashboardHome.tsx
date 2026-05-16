import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminUserRecord } from "~/lib/admin-user.service";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { listAdminRoles, type AdminRoleRecord } from "~/lib/admin-roles.service";
import { getEffectivePermissions } from "~/lib/effective-permissions";
import { useAuth } from "~/lib/auth-context";
import { AdminDashboardRenderer, recomposeSnapshot } from "~/features/admin-dashboard";

export default function DashboardHome() {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUserRecord | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomposing, setRecomposing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const me = await getMyAdminUser();
        if (cancelled) return;
        setAdminUser(me);
        if (!me?.accountId) return;
        const roles = await listAdminRoles(me.accountId);
        if (cancelled) return;
        const perms = getEffectivePermissions({
          roleIds: me.adminRoleIds ?? [],
          roleNames: me.adminRoleNames ?? [],
          roles,
        });
        setEffectivePermissions(perms);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleRecompose = useCallback(async () => {
    if (!adminUser?.accountId) return;
    try {
      setRecomposing(true);
      await recomposeSnapshot({ accountId: adminUser.accountId });
      setRefreshKey((k) => k + 1);
    } catch {
      // Error is non-critical; snapshot will eventually update
    } finally {
      setRecomposing(false);
    }
  }, [adminUser?.accountId]);

  const title = useMemo(
    () => (adminUser?.accountId ? `Cuenta: ${adminUser.accountId}` : "Dashboard"),
    [adminUser?.accountId]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <section className="dp-glass-panel rounded-3xl p-6">
          <h1 className="dp-content-title">Dashboard de métricas</h1>
          <p className="text-sm text-[var(--dp-on-surface-soft)]">Cargando…</p>
        </section>
      </div>
    );
  }

  if (!adminUser?.accountId) {
    return (
      <div className="space-y-4">
        <section className="dp-glass-panel rounded-3xl p-6">
          <h1 className="dp-content-title">Dashboard de métricas</h1>
          <p className="text-sm text-[var(--dp-on-surface-soft)]">
            Aún no hay datos (o falta <code>accountId</code> en la membresía).
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="dp-glass-panel rounded-3xl p-6">
        <h1 className="dp-content-title">Dashboard de métricas</h1>
        <p className="text-sm text-[var(--dp-on-surface-soft)]">{title}</p>
      </section>

      <AdminDashboardRenderer
        key={refreshKey}
        accountId={adminUser.accountId}
        effectivePermissions={effectivePermissions}
        onRecompose={handleRecompose}
        recomposing={recomposing}
      />
    </div>
  );
}
