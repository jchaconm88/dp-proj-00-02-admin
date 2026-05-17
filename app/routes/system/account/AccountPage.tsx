import { useMemo } from "react";
import { useLoaderData, useNavigation, useRevalidator } from "react-router";
import { DpCard, DpContent, DpTable } from "~/components/ui";
import type { StatusSeverity } from "~/components/ui";
import { moduleTableDef } from "~/data/system-modules";
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

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const USERS_TABLE_DEF = moduleTableDef("account-user", { status: STATUS_OPTIONS }).map((c) => ({ ...c, sort: true }));

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

function StatRow({ label, value, inverse = false }: { label: string; value: string; inverse?: boolean }) {
  const labelClass = inverse ? "text-white/70" : "text-[var(--dp-on-surface-soft)]";
  const valueClass = inverse ? "text-white" : "text-[var(--dp-on-surface)]";

  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className={labelClass}>{label}</div>
      <div className={`font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function normalizeText(value: unknown): string {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed.length > 0 ? parsed : "—";
}

function formatBillingCycle(value: unknown): string {
  if (value === "annual") return "Anual";
  if (value === "monthly") return "Mensual";
  return "—";
}

function formatDateLabel(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatMoney(amountCents: unknown, currency: unknown): string {
  const cents = typeof amountCents === "number" ? amountCents : Number(amountCents);
  const currencyCode = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  if (!Number.isFinite(cents) || cents < 0 || currencyCode.length !== 3) return "—";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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
  const planAmount = formatMoney(subscription?.amountCents, subscription?.currency);
  const billingCycle = formatBillingCycle(subscription?.billingCycle);
  const nextRenewal = formatDateLabel(subscription?.nextRenewalAt);

  const accountStatusLabel = accountStatus === "active" ? "Activa" : "Inactiva";
  const accountStatusBadgeClass =
    accountStatus === "active"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-zinc-500/15 text-[var(--dp-on-surface-soft)]";

  const planStatusLabel =
    planStatus === "active"
      ? "Activo"
      : planStatus === "suspended"
        ? "Suspendido"
        : planStatus === "cancelled"
          ? "Cancelado"
          : "Inactivo";
  const planStatusBadgeClass =
    planStatus === "active"
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-white/15 text-white/80";

  const usersActiveCount = useMemo(
    () => users.filter((u) => String(u.status ?? "active") === "active").length,
    [users]
  );

  return (
    <DpContent title="CUENTA" breadcrumbItems={["ADMIN", "CUENTA"]} contentSurface={false}>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <DpCard
            kicker="PERFIL DE CUENTA"
            title={accountName}
            titleSize="2xl"
            subtitle="Información principal de la cuenta y su tenant activo."
            headerRight={
              <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em] ${accountStatusBadgeClass}`}>
                {accountStatusLabel}
              </span>
            }
          >
            <div className="space-y-3">
              <StatRow label="ID" value={account?.id ?? "—"} />
              <StatRow label="Sitio web" value={normalizeText(account?.website)} />
              <StatRow label="Industria" value={normalizeText(account?.industry)} />
              <StatRow label="Ubicación" value={normalizeText(account?.location)} />
              <StatRow label="Usuarios activos" value={`${usersActiveCount} de ${users.length}`} />
            </div>
          </DpCard>

          <DpCard
            kicker="PLAN ACTIVO"
            title={planName}
            titleSize="xl"
            tone="emphasis"
            headerRight={
              <span
                className={[
                  "rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em]",
                  planStatusBadgeClass,
                ].join(" ")}
              >
                {planStatusLabel}
              </span>
            }
            className="text-white"
            bodyClassName="space-y-3"
            footer={
              <button
                type="button"
                className="dp-btn-neon w-full rounded-xl px-4 py-2.5 text-sm font-extrabold"
                onClick={() => {
                  window.location.href = "/subscriptions";
                }}
              >
                Editar suscripción
              </button>
            }
          >
            <div className="space-y-3">
              <StatRow label="Subscription ID" value={subscription?.id ?? "—"} inverse />
              <StatRow label="Plan ID" value={subscription?.planId ?? "—"} inverse />
              <StatRow label="Ciclo de facturación" value={billingCycle} inverse />
              <StatRow label="Próxima renovación" value={nextRenewal} inverse />
              <StatRow label="Monto" value={planAmount} inverse />
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
