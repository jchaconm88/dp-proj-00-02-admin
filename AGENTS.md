# Guía para el agente — dp-proj-00-02-admin

Este documento define convenciones **solo** para el proyecto `dp-proj-00-02-admin` (SPA Admin).

## Objetivo de arquitectura

El **backend (Cloud Run)** es el **medio de comunicación** para datos del dominio, autorización y scoping por `accountId`.

En el frontend Admin:

- **No leer/escribir Firestore directamente** para CRUD/listados/permisos/progreso de onboarding.
- **Sí usar Firebase Auth** en el frontend únicamente para obtener el **Firebase ID token** (Bearer) y firmar requests al backend.

## Regla principal: Backend-first

### ✅ Correcto

- Usar `adminFetch` (`app/lib/backend-client.ts`) para todo acceso a datos del Admin:
  - `GET /admin/me` para obtener el contexto del usuario autenticado (`accountId`, roles).
  - `GET/POST/PUT/DELETE /admin/platform/*` para CRUD de plataforma (en el backend se aplica el scope por `accountId`).
  - Helpers de UI vía backend (p. ej. check de TaxId/RUC).

### ❌ Incorrecto

- Inventar compatibilidad con datos huérfanos o esquemas antiguos: el proyecto se trata como **greenfield**; el backend y este frontend deben usar solo el modelo y contratos actuales (sin “legacy”).
- Importar `firebase/firestore` en páginas/servicios del Admin para cargar o mutar datos de:
  - `users`, `roles`, `accounts`, `companies`, `subscriptions`, `saas-plans`, etc.
- Basar redirecciones (p. ej. `/onboarding`) en lecturas directas del cliente a Firestore que pueden fallar por reglas/permisos.

## Endpoints disponibles (Admin Backend)

> Nota: las rutas expuestas por Express viven bajo el router `adminRouter`. En el frontend, se consumen como `/admin/...` a través del proxy (`/admin-backend`) o un `VITE_ADMIN_BACKEND_BASE_URL`.

### Contexto / sesión

- `GET /admin/me`: contexto del usuario autenticado (fuente para `accountId` y roles).

### Platform (CRUD vía backend)

- `GET /admin/platform/accounts`
- `POST /admin/platform/accounts`
- `PUT /admin/platform/accounts/:id`
- `DELETE /admin/platform/accounts/:id`

- `GET /admin/platform/companies`
- `GET /admin/platform/companies/:id`
- `POST /admin/platform/companies`
- `PUT /admin/platform/companies/:id`
- `DELETE /admin/platform/companies/:id`
- `GET /admin/platform/companies/check-taxid?taxId=...`

> **Firestore Web (proyecto app):** `companies`, `company-users`, usuarios/roles de la app y miembros por empresa viven en el **mismo Firestore Web** que consume la SPA Web. El Firestore **Admin** ya no debe usarse como fuente de verdad para `companies` ni `company-users` (migrar o purgar datos legacy si existían).

- `GET /admin/platform/company-users` (opcional: `?companyId=` para filtrar por empresa) — colección **`company-users`** en **Firestore Web**
- `POST /admin/platform/company-users`
- `PUT /admin/platform/company-users/:id`
- `DELETE /admin/platform/company-users/:id`

- `GET /admin/platform/web-users` — usuarios de la app (`users` en Firestore Web, filtrados por `accountId`)
- `GET /admin/platform/web-users/:id`
- `POST /admin/platform/web-users`
- `PUT /admin/platform/web-users/:id`
- `DELETE /admin/platform/web-users/:id`

- `GET /admin/platform/web-roles?companyId=` — roles por empresa (`roles` en Firestore Web)
- `GET /admin/platform/web-roles/:id`
- `POST /admin/platform/web-roles`
- `PUT /admin/platform/web-roles/:id`
- `DELETE /admin/platform/web-roles/:id`

- `GET /admin/platform/plans`
- `POST /admin/platform/plans`
- `PUT /admin/platform/plans/:id`
- `DELETE /admin/platform/plans/:id`

- `GET /admin/platform/subscriptions`
- `POST /admin/platform/subscriptions`
- `PUT /admin/platform/subscriptions/:id`
- `DELETE /admin/platform/subscriptions/:id`

- `GET /admin/platform/roles`
- `GET /admin/platform/roles/:id`
- `POST /admin/platform/roles`
- `PUT /admin/platform/roles/:id`
- `DELETE /admin/platform/roles/:id`

- `GET /admin/platform/users`
- `GET /admin/platform/users/:id`
- `POST /admin/platform/users`
- `PUT /admin/platform/users/:id`
- `DELETE /admin/platform/users/:id`

### Onboarding

- `POST /admin/onboarding/complete` — cuenta + usuario **staff** en Firestore Admin
- `POST /admin/onboarding/bootstrap-web-tenant` — en un **batch** en Firestore Web: empresa inicial, usuario app (`users` con `accountId`), rol admin de empresa y `company-users`

## Estructura de rutas (archivos)

Alineada con **`dp-proj-00-02-web`**: dominio bajo **carpetas**, no un único `*Page.tsx` suelto en `platform/`.

- **`app/routes/platform/<dominio>/`**: una carpeta por área (ej. `companies/`, `account/`, `plans/`, `subscriptions/`, `company-users/`, `accounts/`).
- **Sub-recursos** como en Web: ej. empresas → miembros: `companies/CompanyMembersPage.tsx` + rutas hija `CompanyMemberAdd.tsx` / `CompanyMemberEdit.tsx`, registradas en `app/routes.ts` bajo `companies/:id/company-users`.
- **`app/routes/system/`**: pantallas de sistema (usuarios, roles).

## Convención de implementación (frontend)

- Los `*.service.ts` de `app/features/**` deben hablar con backend usando `adminFetch`.
- Los componentes/rutas importan **solo** desde `features/...` (no hablan HTTP directo).
- Global search admin: consumir `GET /admin/system/entity-search-index?accountId=...` y `POST /admin/system/entity-search-index/rebuild?accountId=...`.
- Dashboard admin: consumir `GET /admin/dashboard/snapshot?accountId=...&period=YYYY-MM` y usar `POST /admin/dashboard/recompose` solo para recomposicion manual/operativa.
- Nuevos modulos: seguir `../MODULOS_NUEVOS_COMPATIBILIDAD.md` para mantener compatibilidad con search/dashboard existentes.

## Convenciones de código (alineadas con Web)

### Import paths — barrel único `~/components/ui`

Todos los componentes Dp* (DpContent, DpTable, DpInput, DpConfirmDialog, DpCodeInput, DpContentSet, etc.) se importan desde el barrel `~/components/ui`. **No** importar desde rutas individuales (`~/components/DpInput`, `~/components/DpContent`, etc.).

```tsx
// ✅ Correcto
import { DpContent, DpContentHeader, DpTable, DpConfirmDialog, DpInput, DpContentSet } from "~/components/ui";
import type { DpTableRef, StatusSeverity } from "~/components/ui";

// ❌ Incorrecto
import { DpInput } from "~/components/DpInput";
import { DpContent } from "~/components/DpContent";
```

### moduleTableDef — fuente única de columnas

**NUNCA** definir `TABLE_DEF` manualmente en las páginas. Usar siempre `moduleTableDef` desde `~/data/system-modules`. El catálogo `SYSTEM_MODULES_CATALOG` en ese archivo es la única fuente de verdad para las columnas de cada módulo.

```ts
import { moduleTableDef } from "~/data/system-modules";

// Sin typeOptions (columnas sin status/label)
const TABLE_DEF = moduleTableDef("admin-user");

// Con typeOptions para columnas con format: "status"
const TABLE_DEF = moduleTableDef("subscription", { status: STATUS_OPTIONS });

// Con sort habilitado por defecto
const TABLE_DEF = moduleTableDef("plan", { active: ACTIVE_OPTIONS }).map((c) => ({ ...c, sort: true }));
```

### Diálogos — patrón de montaje con `{condition && <Component>}`

Todos los diálogos de formulario (create/edit) deben envolverse con `{condition && <Component>}` para que se desmonten al cerrar, reseteando automáticamente su estado interno.

```tsx
// ✅ Correcto — se desmonta al ocultar
const dialogVisible = isAdd || !!editId;

{dialogVisible && (
  <MyDialog
    visible={dialogVisible}
    item={dialogItem}
    onHide={handleHide}
    onSaved={handleSaved}
  />
)}

// ❌ Incorrecto — el diálogo permanece montado
<MyDialog visible={dialogVisible} ... />
```

### Diálogos — archivos separados

Cada formulario modal debe vivir en un archivo `*Dialog.tsx` separado. **No** definir diálogos inline en el mismo archivo que la página.

### Routes — uso de `layout()` en lugar de `route("")`

Las rutas agrupadas bajo el shell autenticado deben usar `layout("routes/Dashboard.tsx", [...])` en lugar de `route("", "routes/Dashboard.tsx", [...])`.

```ts
// ✅ Correcto
import { route, index, layout } from "@react-router/dev/routes";
export default [
  // public routes: login, registro, onboarding
  layout("routes/Dashboard.tsx", [
    index("routes/DashboardHome.tsx"),
    route("roles", "routes/system/RolesPage.tsx"),
    // ...
  ]),
];

// ❌ Incorrecto
route("", "routes/Dashboard.tsx", [ /* ... */ ]);
```

### Routes — `{ id }` para desambiguación

Cuando dos rutas apuntan al mismo componente (p. ej. `plans` + `plans/add`), usar la propiedad `id` para desambiguar:

```ts
route("plans", "routes/system/plans/PlansPage.tsx"),
route("plans/add", "routes/system/plans/PlansPage.tsx", { id: "routes/system/plans/PlansPage/add" }),
```

### Componentes disponibles

| Componente | Uso |
|---|---|
| `DpContent` | Contenedor de página de lista |
| `DpContentHeader` | Barra de herramientas (filtro, crear, eliminar, recargar) |
| `DpContentInfo` | Contenedor de página de detalle (con botón back) |
| `DpContentSet` | Dialog/modal para formularios (create/edit) |
| `DpConfirmDialog` | Modal de confirmación antes de eliminar |
| `DpTable<T>` | Tabla con selección, filtro, acciones |
| `DpInput` | Campo de formulario unificado (type: input, select, check, number, date) |
| `DpCodeInput` | Campo de código con secuencia automática |

### DpContentSet — carga y errores centralizados

```tsx
<DpContentSet
  title="..."
  visible={visible}
  onHide={onHide}
  onCancel={onHide}
  onSave={save}
  saving={saving || isNavigating}
  saveDisabled={!valid || isNavigating}
  showLoading={loading}
  showError={!!error}
  errorMessage={error ?? ""}
>
  {/* solo campos del formulario */}
</DpContentSet>
```

### DpInput

```tsx
<DpInput type="input" label="Nombre" name="name" value={name} onChange={setName} />
<DpInput type="select" label="Estado" name="status" value={status} onChange={setStatus} options={opts} />
<DpInput type="check" label="Activo" name="active" value={active} onChange={setActive} />
```

### Reglas Generales

- **Alias `~/`** apunta a `app/` — usar siempre paths con `~/` en imports
- **`useNavigation` en todos los diálogos** — `saving={saving || isNavigating}`
- **TypeScript estricto** — tipar todos los parámetros y retornos de servicios
- **Rutas configuradas en `routes.ts`** — NUNCA dependas del naming del archivo para el routing
- **Páginas de Detalle / Sub-módulos** — usa `<DpContentInfo>` (con prop `onBack`) para navegación de retroceso estándar
- **Confirmar borrado** — usar siempre `DpConfirmDialog`; nunca `confirm()` del navegador
- **`meta()` en todas las rutas** — incluidas las rutas hijo (add/edit)
- **Tests**: el proyecto usa vitest; correr `npm run test` después de cambios en `routes.ts`

## Notas de DEV (CORS/proxy)

Ver `README.md` del proyecto Admin para la explicación de CORS/IAM y el proxy recomendado con:

- `VITE_ADMIN_BACKEND_PROXY_TARGET`
- `adminFetch` apuntando a `/admin-backend` en dev

