import { useNavigate } from "react-router";
import { Dropdown } from "primereact/dropdown";
import type { CompanyRecord } from "~/features/platform/companies";

type Props = {
  companies: CompanyRecord[];
  companyId: string;
  basePath: string;
  className?: string;
};

export function IntegrationCompanySelect({ companies, companyId, basePath, className }: Props) {
  const navigate = useNavigate();
  const options = companies.map((c) => ({ label: c.name || c.code || c.id, value: c.id }));

  return (
    <div className={`flex flex-wrap items-center gap-3 mb-4 ${className ?? ""}`}>
      <label htmlFor="integration-company" className="font-medium text-sm">
        Empresa
      </label>
      <Dropdown
        inputId="integration-company"
        value={companyId || null}
        options={options}
        onChange={(e) => {
          const id = String(e.value ?? "").trim();
          navigate(id ? `${basePath}?companyId=${encodeURIComponent(id)}` : basePath);
        }}
        placeholder="Seleccione una empresa…"
        filter
        filterPlaceholder="Buscar empresa…"
        className="w-full md:w-96"
        showClear
      />
    </div>
  );
}
