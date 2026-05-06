import type { Config } from "@react-router/dev/config";

export default {
  // Firebase Hosting sirve archivos estáticos. Para Admin (SPA),
  // necesitamos que el build genere `build/client/index.html`.
  ssr: false,
} satisfies Config;

