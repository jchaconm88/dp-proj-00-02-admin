import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { DpContent, DpContentHeader } from "~/components/ui";
import { getIntegrationApiMeta, getIntegrationOpenApiSpec } from "~/features/platform/api-docs";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export async function clientLoader(_args: LoaderFunctionArgs) {
  const [meta, spec] = await Promise.all([getIntegrationApiMeta(), getIntegrationOpenApiSpec()]);
  return { meta, spec };
}

function downloadOpenApiJson(spec: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "openapi.json";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ApiDocsPage() {
  const { meta, spec } = useLoaderData<typeof clientLoader>();
  return (
    <DpContent title="DOCUMENTACIÓN API V1" breadcrumbItems={["PLATAFORMA", "WEB", "INTEGRACIÓN"]}>
      <DpContentHeader showCreateButton={false} />
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className="p-button p-component p-button-outlined p-button-sm"
          onClick={() => downloadOpenApiJson(spec)}
        >
          Descargar OpenAPI JSON
        </button>
        <button
          type="button"
          className="p-button p-component p-button-text p-button-sm"
          onClick={() => navigator.clipboard.writeText(meta.openApiUrl)}
          title="URL pública para integradores (WooCommerce, scripts)"
        >
          Copiar URL pública del spec
        </button>
        <a
          href={meta.openApiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-button p-component p-button-text p-button-sm"
          title="Abre el endpoint público /api/v1/openapi.json (puede requerir CORS fuera del Admin)"
        >
          Ver URL pública
        </a>
      </div>
      <div className="surface-card border-round p-3">
        <SwaggerUI spec={spec} />
      </div>
    </DpContent>
  );
}
