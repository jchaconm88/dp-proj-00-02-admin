import { useMemo } from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router";
import { DpCard, DpContent, DpTable } from "~/components/ui";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";
import { adminFetch } from "~/lib/backend-client";
import type { AccountRecord } from "~/features/platform/accounts/accounts.types";
import type { SubscriptionRecord } from "~/features/platform/subscriptions/subscriptions.types";
import type { SaasPlanRecord } from "~/features/platform/saas-plans/saas-plans.types";
import type { UserRecord } from "~/features/system/users/users.types";

type AccountDetailsLoaderData = {
  account: AccountRecord | null;
  subscription: SubscriptionRecord | null;
  plan: SaasPlanRecord | null;
  users: UserRecord[];
};

const USERS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Email", column: "email", order: 1, display: true, filter: true, sort: true },
  { header: "Nombre", column: "displayName", order: 2, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 3,
    display: true,
    filter: true,
    type: "status",
    typeOptions: {
      active: { label: "Activo", severity: "success" as StatusSeverity },
      inactive: { label: "Inactivo", severity: "secondary" as StatusSeverity },
    },
  },
];

export function meta() {
  return [{ title: "Cuenta" }];
}

export async function clientLoader(): Promise<AccountDetailsLoaderData> {
  const [accounts, subs, plans, users] = await Promise.all([
    adminFetch<AccountRecord[]>("/admin/platform/accounts"),
    adminFetch<SubscriptionRecord[]>("/admin/platform/subscriptions"),
    adminFetch<SaasPlanRecord[]>("/admin/platform/plans"),
    adminFetch<UserRecord[]>("/admin/platform/users"),
  ]);

  const account = accounts[0] ?? null;
  const subscription = subs[0] ?? null;
  const planId = subscription?.planId?.trim() ?? "";
  const plan =
    plans.find((p) => String((p as any).planId ?? p.id).trim() === planId) ??
    plans.find((p) => String(p.id).trim() === planId) ??
    null;

  return {
    account,
    subscription,
    plan,
    users: Array.isArray(users) ? users : [],
  };
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="text-[var(--dp-on-surface-soft)]">{label}</div>
      <div className="font-semibold text-[var(--dp-on-surface)]">{value}</div>
    </div>
  );
}

export default function AccountPage() {
  const { account, subscription, plan, users } = useLoaderData<typeof clientLoader>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const accountName = account?.name?.trim() || "Cuenta";
  const accountStatus = account?.status ?? "inactive";

  const planName = plan?.name?.trim() || (subscription?.planId?.trim() ? subscription.planId.trim() : "Sin plan");
  const planStatus = subscription?.status ?? "inactive";

  const usersActiveCount = useMemo(
    () => users.filter((u) => String(u.status ?? "active") === "active").length,
    [users]
  );

  return (
    <DpContent title="CUENTA" breadcrumbItems={["PLATAFORMA", "CUENTA"]} contentSurface={false}>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <DpCard kicker="CUENTA" title={accountName} titleSize="2xl">
            <div className="space-y-2">
              <StatRow label="ID" value={account?.id ?? "—"} />
              <StatRow label="Estado" value={accountStatus} />
              <StatRow label="Usuarios" value={`${usersActiveCount} activos / ${users.length}`} />
            </div>
          </DpCard>

          <DpCard
            kicker="PLAN ACTIVO"
            title={planName}
            titleSize="xl"
            headerRight={
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em]",
                  planStatus === "active"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-500/15 text-[var(--dp-on-surface-soft)]",
                ].join(" ")}
              >
                {planStatus === "active" ? "Activo" : planStatus}
              </span>
            }
          >
            <div className="space-y-2">
              <StatRow label="Subscription ID" value={subscription?.id ?? "—"} />
              <StatRow label="Plan ID" value={subscription?.planId ?? "—"} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="dp-btn-neon w-full rounded-xl px-4 py-2 text-sm font-extrabold"
                onClick={() => {
                  window.location.href = "/subscriptions";
                }}
              >
                Editar suscripción
              </button>
            </div>
          </DpCard>
        </div>

        <div className="lg:col-span-2">
          <DpCard
            kicker="USUARIOS ASOCIADOS"
            title={null}
            subtitle={
              <>
                Actualmente hay <b>{users.length}</b> usuarios en esta cuenta.
              </>
            }
            headerRight={
              <button
                type="button"
                className="dp-btn-soft rounded-xl px-4 py-2 text-sm font-extrabold"
                onClick={() => {
                  window.location.href = "/users";
                }}
              >
                Gestionar usuarios
              </button>
            }
          >
            <DpTable<UserRecord>
              data={users}
              loading={isLoading}
              tableDef={USERS_TABLE_DEF}
              showFilterInHeader={false}
              emptyMessage='No hay usuarios en la colección "users".'
              emptyFilterMessage="No hay resultados para el filtro."
            />
          </DpCard>
        </div>
      </div>
    </DpContent>
  );
}
