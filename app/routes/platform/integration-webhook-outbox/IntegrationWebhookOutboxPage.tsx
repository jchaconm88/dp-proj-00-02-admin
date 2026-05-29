import { useState } from "react";
import { useLoaderData, useRevalidator, type LoaderFunctionArgs } from "react-router";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { DpContent, DpContentHeader } from "~/components/ui";
import { IntegrationCompanySelect } from "~/components/platform/IntegrationCompanySelect";
import { getCompanies } from "~/features/platform/companies";
import { getFailedWebhooks, retryWebhookOutbox } from "~/features/platform/integration-webhook-outbox";
import type { WebhookOutboxRecord } from "~/features/platform/integration-webhook-outbox";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? "";
  const [companies, items] = await Promise.all([
    getCompanies(),
    companyId ? getFailedWebhooks(companyId) : Promise.resolve([]),
  ]);
  return { items, companyId, companies };
}

export default function IntegrationWebhookOutboxPage() {
  const { items, companyId, companies } = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (row: WebhookOutboxRecord) => {
    setRetryingId(row.id);
    try {
      await retryWebhookOutbox(row.id);
      revalidator.revalidate();
    } finally {
      setRetryingId(null);
    }
  };

  const actionBody = (row: WebhookOutboxRecord) => (
    <Button
      label="Reintentar"
      size="small"
      loading={retryingId === row.id}
      onClick={() => handleRetry(row)}
    />
  );

  return (
    <DpContent title="WEBHOOKS FALLIDOS" breadcrumbItems={["PLATAFORMA", "INTEGRACIÓN"]}>
      <IntegrationCompanySelect
        companies={companies}
        companyId={companyId}
        basePath="/platform/integration-webhook-outbox"
      />
      <DpContentHeader filterPlaceholder="Filtrar eventos..." showCreateButton={false} onLoad={() => revalidator.revalidate()} />
      <DataTable value={items} dataKey="id" emptyMessage="No hay webhooks fallidos" size="small">
        <Column field="event" header="Evento" />
        <Column field="status" header="Estado" />
        <Column field="attempts" header="Intentos" />
        <Column field="lastError" header="Error" style={{ maxWidth: 320 }} />
        <Column header="Acción" body={actionBody} />
      </DataTable>
    </DpContent>
  );
}
