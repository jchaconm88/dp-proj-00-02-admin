import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/OnboardingLayout";
import { getAuthUser } from "~/lib/get-auth-user";
import { adminFetch } from "~/lib/backend-client";

export async function clientLoader({}: Route.ClientLoaderArgs) {
  const user = await getAuthUser();
  if (!user) throw redirect("/login");

  try {
    const status = await adminFetch<{ completed: boolean }>("/admin/onboarding/status");
    if (status?.completed) throw redirect("/");
  } catch (e) {
    // `throw redirect()` lanza un `Response` 3xx; no debe tragarse aquí.
    if (e instanceof Response && e.status >= 300 && e.status < 400) throw e;
    // Si el backend no está disponible, permitir el onboarding (DEV).
  }

  return {};
}

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Outlet />
      </div>
    </div>
  );
}
