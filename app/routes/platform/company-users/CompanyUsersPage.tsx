import { useMemo } from "react";
import { useNavigation, useLoaderData, useRevalidator } from "react-router";
import { DpContent, DpContentHeader, DpTColumn } from "~/components/ui";
import { DpTable } from "~/components/ui";
import { getCompanyUsers } from "~/features/platform/company-users/company-users.service";
import type { CompanyUserRecord } from "~/features/platform/company-users/company-users.types";
import type { DpTableDefColumn, StatusSeverity } from "~/components/ui";

// ─── Table definition ────────────────────────────────────────────────────────

const STATUS_OPTIONS: Record<string, { label: string; severity: StatusSeverity }> = {
  active: { label: "Activo", severity: "success" },
  inactive: { label: "Inactivo", severity: "secondary" },
};

const COMPANY_USERS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "ID", column: "id", order: 1, display: true, filter: true, sort: true },
  { header: "Company ID", column: "companyId", order: 2, display: true, filter: true, sort: true },
  { header: "User ID", column: "userId", order: 3, display: true, filter: true, sort: true },
  { header: "Usuario", column: "userDisplay", order: 4, display: true, filter: true, sort: true },
  {
    header: "Estado",
    column: "status",
    order: 5,
    display: true,
    filter: true,
    type: "status",
    typeOptions: STATUS_OPTIONS,
  },
];

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function clientLoader() {
  const items = await getCompanyUsers();
  return { items };
}

// ─── CompanyUsersPage ─────────────────────────────────────────────────────────

export default function CompanyUsersPage() {
  const { items } = useLoaderData<typeof clientLoader>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";

  const rows = useMemo(
    () =>
      items.map((u) => {
        const name = u.userDisplayName?.trim() || "";
        const email = u.userEmail?.trim() || "";
        const userDisplay = name && email ? `${name} (${email})` : name || email || u.userId;
        return { ...u, userDisplay };
      }),
    [items]
  );

  return (
    <DpContent
      title="COMPANY USERS"
      breadcrumbItems={["PLATAFORMA", "COMPANY USERS"]}
    >
      <DpContentHeader
        onLoad={() => revalidator.revalidate()}
        loading={isLoading}
      />

      <DpTable<CompanyUserRecord & { userDisplay: string }>
        data={rows}
        loading={isLoading}
        tableDef={COMPANY_USERS_TABLE_DEF}
        emptyMessage='No hay usuarios en la colección "company-users".'
        emptyFilterMessage="No hay resultados para el filtro."
      >
        <DpTColumn name="userDisplay">
          {(row: unknown) => {
            const r = row as CompanyUserRecord & { userDisplay: string };
            const name = r.userDisplayName?.trim() || "";
            const email = r.userEmail?.trim() || "";
            if (name && email) {
              return (
                <div>
                  <div>{name}</div>
                  <div className="text-xs text-[var(--dp-on-surface-soft)]">{email}</div>
                </div>
              );
            }
            return <span>{name || email || r.userId}</span>;
          }}
        </DpTColumn>
      </DpTable>
    </DpContent>
  );
}
