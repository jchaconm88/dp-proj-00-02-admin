# dp-proj-00-02-admin

Aplicación de administración (React Router + Vite + PrimeReact + Tailwind).

## Requisitos

- Node 22+
- Firebase CLI (para deploy a Hosting)

## Configuración

1) Copiar variables de entorno:

```bash
copy .env.example .env
```

2) Rellenar `VITE_ADMIN_FIREBASE_*` con los valores del proyecto Firebase del Admin.

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

