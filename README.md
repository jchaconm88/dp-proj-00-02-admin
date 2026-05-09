# dp-proj-00-02-admin

Aplicación de administración (React Router + Vite + PrimeReact + Tailwind).

## Requisitos

- Node 22+
- Firebase CLI (para deploy a Hosting)

## Requisitos de Firebase Auth (para que el login/registro funcione)

En el **proyecto Firebase unificado por ambiente** (mismo `project_id` que web y backend en ese entorno), habilita en:
**Firebase Console → Authentication → Sign-in method**:

- **Email/Password**
- **Google**

Nota: este toggle normalmente se habilita desde la consola (no es algo que se “active” con Firebase CLI de forma estándar).

## Configuración

1) Copiar variables de entorno:

```bash
copy .env.example .env
```

2) Rellenar `VITE_FIREBASE_*` con los valores del proyecto Firebase unificado del ambiente (consola o outputs de `dp-proj-00-02-infra`).

## CI / despliegue Hosting

Workflow: `.github/workflows/deploy.yml`. Usa **GitHub Environments** (`dev` / `qa` / `prd`) con variables `GCP_PROJECT_ID`, `FIREBASE_HOSTING_SITE_ID_ADMIN`, `BACKEND_BASE_URL` (URL pública del backend en ese ambiente) y secretos de build (`VITE_*`, `FIREBASE_SERVICE_ACCOUNT`). El deploy usa `firebase deploy --site "$FIREBASE_HOSTING_SITE_ID_ADMIN"` para apuntar al **segundo** sitio creado por Terraform (`firebase_hosting_site_id_admin`).

## Backend (Cloud Run) — CORS / desarrollo local

### Por qué ves errores de CORS en `localhost`

Si el Admin corre en `http://localhost:5173` y el backend en `https://...run.app`, el navegador hace un **preflight `OPTIONS`**. Ese preflight **no lleva** `Authorization`, así que si Cloud Run está configurado como **requiere autenticación IAM** (`--no-allow-unauthenticated`), Google puede responder **403** antes de tu app Express. En ese caso el navegador suele reportar algo como “falta `Access-Control-Allow-Origin`”, aunque el problema real sea **IAM**, no CORS.

Para un SPA que llama directo a Cloud Run, lo habitual en MVP es:

- **`--allow-unauthenticated`** en Cloud Run
- y **validar Firebase ID token** en el backend (como ya hace `requireAdminAuth`)

### Opción recomendada en DEV (evita CORS sin tocar IAM)

En `.env` (dev):

- Deja `VITE_ADMIN_BACKEND_BASE_URL` vacío
- Define `VITE_ADMIN_BACKEND_PROXY_TARGET` con tu URL de Cloud Run (sin `/` final)

Vite proxyeará `http://localhost:5173/admin-backend/*` hacia Cloud Run, así el browser ve **mismo origin**.

## Local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (Firebase Hosting)

- Edita `.firebaserc` y reemplaza `REPLACE_WITH_ADMIN_FIREBASE_PROJECT_ID`.

```bash
npm run deploy
```

## CI/CD (opcional) — Service Account para deploy

Si vas a desplegar desde CI (GitHub Actions/Cloud Build) usando una **Service Account** en vez de `firebase login`, esa SA debe tener permisos para:

- Deploy de **Hosting**: `roles/firebasehosting.admin`
- (Opcional) si más adelante despliegas reglas/índices desde este proyecto: `roles/datastore.securityAdmin`

Además, el pipeline suele usar un token o key de servicio (evitar keys largas si puedes; preferir Workload Identity Federation).

