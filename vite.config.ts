import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = String(env.VITE_ADMIN_BACKEND_PROXY_TARGET ?? "").trim().replace(/\/$/, "");

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    ssr: {
      noExternal: ["primereact", "primeicons"],
    },
    server: {
      proxy: proxyTarget
        ? {
            "/admin-backend": {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p.replace(/^\/admin-backend/, ""),
            },
          }
        : undefined,
    },
  };
});

