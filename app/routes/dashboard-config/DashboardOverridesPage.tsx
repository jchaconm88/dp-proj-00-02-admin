import { useCallback, useEffect, useMemo, useState } from "react";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import {
  DpContent,
  DpContentHeader,
  DpTable,
  DpTColumn,
} from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { listAdminRoles } from "~/lib/admin-roles.service";
import { getEffectivePermissions } from "~/lib/effective-permissions";
import { isGranted } from "~/lib/accessService";
import { getAdminOverrides, saveAdminOverrides } from "~/features/dashboard-config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardConfigItem {
  id: string;
  title: string;
  definitionType: "card";
  visible: boolean;
  order: number;
}

interface ChartConfigItem {
  id: string;
  title: string;
  definitionType: "chart";
  visible: boolean;
  order: number;
}

// ─── Table definitions ────────────────────────────────────────────────────────

const CARDS_TABLE_DEF = moduleTableDef("card-override").map((c) => {
  if (c.column === "visible") return c;
  return { ...c, sort: true };
});

const CHARTS_TABLE_DEF = moduleTableDef("chart-override").map((c) => {
  if (c.column === "visible") return c;
  return { ...c, sort: true };
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function clientLoader() {
  return {};
}

export default function DashboardOverridesPage() {
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

  const canView = useMemo(
    () => isGranted(effectivePermissions, "view", "dashboard-config"),
    [effectivePermissions]
  );
  const canEdit = useMemo(
    () => isGranted(effectivePermissions, "edit", "dashboard-config"),
    [effectivePermissions]
  );

  // ─── Data state ─────────────────────────────────────────────────────────────
  const [cardItems, setCardItems] = useState<CardConfigItem[]>([]);
  const [chartItems, setChartItems] = useState<ChartConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Load function ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOverrides();

      const overrideMap = new Map<string, { visible: boolean; order: number }>();
      if (data.overrides) {
        for (const ov of data.overrides) {
          overrideMap.set(`${ov.definitionType}:${ov.definitionId}`, ov);
        }
      }

      const cards: CardConfigItem[] = (data.cards ?? []).map((card: any, idx: number) => {
        const override = overrideMap.get(`card:${card.id}`);
        return {
          id: card.id,
          title: card.title ?? card.cardKey ?? card.id,
          definitionType: "card" as const,
          visible: override ? override.visible : (card.visible ?? true),
          order: override ? override.order : (card.order ?? (idx + 1) * 10),
        };
      });

      const charts: ChartConfigItem[] = (data.charts ?? []).map((chart: any, idx: number) => {
        const override = overrideMap.get(`chart:${chart.id}`);
        return {
          id: chart.id,
          title: chart.title ?? chart.chartKey ?? chart.id,
          definitionType: "chart" as const,
          visible: override ? override.visible : (chart.visible !== false),
          order: override ? override.order : (chart.order ?? (idx + 1) * 10),
        };
      });

      cards.sort((a, b) => a.order - b.order);
      charts.sort((a, b) => a.order - b.order);

      setCardItems(cards);
      setChartItems(charts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoading && canView) {
      void loadData();
    }
  }, [permissionsLoading, canView, loadData]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const toggleCardVisibility = useCallback((id: string) => {
    setCardItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
    setSuccess(null);
  }, []);

  const toggleChartVisibility = useCallback((id: string) => {
    setChartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
    setSuccess(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const entries = [
        ...cardItems.map((item, idx) => ({
          definitionId: item.id,
          definitionType: "card" as const,
          visible: item.visible,
          order: idx + 1,
        })),
        ...chartItems.map((item, idx) => ({
          definitionId: item.id,
          definitionType: "chart" as const,
          visible: item.visible,
          order: idx + 1,
        })),
      ];
      await saveAdminOverrides(entries);
      setSuccess("Configuración guardada correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }, [cardItems, chartItems]);

  // ─── Permission gate ────────────────────────────────────────────────────────
  if (!user) return null;

  if (permissionsLoading) {
    return (
      <DpContent title="ACCESOS DASHBOARD" breadcrumbItems={["SETUP", "ACCESOS DASHBOARD"]}>
        <div className="flex items-center justify-center py-8">
          <ProgressSpinner style={{ width: "40px", height: "40px" }} />
        </div>
      </DpContent>
    );
  }

  if (!canView) {
    return (
      <DpContent title="ACCESOS DASHBOARD" breadcrumbItems={["SETUP", "ACCESOS DASHBOARD"]}>
        <Message severity="error" text="No tiene permisos para acceder a esta pantalla." className="w-full" />
      </DpContent>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <DpContent title="ACCESOS DASHBOARD" breadcrumbItems={["SETUP", "ACCESOS DASHBOARD"]}>
      <DpContentHeader
        filterValue=""
        onFilter={() => {}}
        onLoad={() => void loadData()}
        showCreateButton={false}
        loading={loading}
        filterPlaceholder=""
      />

      {error && (
        <div className="mb-4">
          <Message severity="error" text={error} className="w-full" />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Message severity="success" text={success} className="w-full" />
        </div>
      )}

      {/* Cards Section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--dp-on-surface)]">Tarjetas</h2>
        <DpTable<CardConfigItem>
          data={cardItems}
          loading={loading}
          tableDef={CARDS_TABLE_DEF}
          paginator={false}
          showFilterInHeader={false}
          emptyMessage="No hay tarjetas disponibles."
        >
          <DpTColumn<CardConfigItem> name="visible">
            {(row) => (
              <InputSwitch
                checked={row.visible}
                onChange={() => toggleCardVisibility(row.id)}
                disabled={!canEdit}
              />
            )}
          </DpTColumn>
        </DpTable>
      </section>

      {/* Charts Section */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-[var(--dp-on-surface)]">Gráficos</h2>
        <DpTable<ChartConfigItem>
          data={chartItems}
          loading={loading}
          tableDef={CHARTS_TABLE_DEF}
          paginator={false}
          showFilterInHeader={false}
          emptyMessage="No hay gráficos disponibles."
        >
          <DpTColumn<ChartConfigItem> name="visible">
            {(row) => (
              <InputSwitch
                checked={row.visible}
                onChange={() => toggleChartVisibility(row.id)}
                disabled={!canEdit}
              />
            )}
          </DpTColumn>
        </DpTable>
      </section>

      {/* Save button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button
            label="Guardar"
            icon="pi pi-save"
            loading={saving}
            disabled={saving}
            onClick={handleSave}
          />
        </div>
      )}
    </DpContent>
  );
}
