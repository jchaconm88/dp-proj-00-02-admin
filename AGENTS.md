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

## Notas de DEV (CORS/proxy)

Ver `README.md` del proyecto Admin para la explicación de CORS/IAM y el proxy recomendado con:

- `VITE_ADMIN_BACKEND_PROXY_TARGET`
- `adminFetch` apuntando a `/admin-backend` en dev

