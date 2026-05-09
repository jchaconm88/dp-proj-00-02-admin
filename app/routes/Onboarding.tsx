import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { DpInput } from "~/components/ui";
import { useAuth } from "~/lib/auth-context";
import { getMyAdminUser } from "~/lib/admin-user.service";
import { adminFetch } from "~/lib/backend-client";
import { createSubscription } from "~/features/platform/subscriptions/subscriptions.service";
import { createPlan, getPlans } from "~/features/platform/saas-plans/saas-plans.service";
type OnboardingStatus = {
  ok: boolean;
  accountId: string;
  hasAccount: boolean;
  hasCompany: boolean;
  hasSubscription: boolean;
  completed: boolean;
  nextStep: number;
  companyId?: string;
  subscriptionId?: string;
};

interface SaasPlan {
  id: string;
  name: string;
  planId: string;
}

function onboardingDebugEnabled(): boolean {
  try {
    // En DEV lo dejamos siempre activo para acelerar troubleshooting.
    if (import.meta.env.DEV) return true;
    return localStorage.getItem("dp_admin_debug_onboarding") === "1";
  } catch {
    return false;
  }
}

function obLog(...args: any[]) {
  if (!onboardingDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.info("[onboarding]", ...args);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function checkTaxIdUnique(taxId: string): Promise<boolean> {
  const out = await adminFetch<{ ok: boolean; unique: boolean }>(
    `/admin/platform/companies/check-taxid?taxId=${encodeURIComponent(taxId.trim())}`
  );
  return Boolean(out.unique);
}

async function loadPlans(): Promise<SaasPlan[]> {
  const rows = await getPlans();
  return rows.map((d) => ({ id: d.id, name: d.name, planId: (d as any).planId ?? d.id }));
}

async function ensureDefaultPlan(): Promise<void> {
  const existing = await getPlans();
  if (existing.length > 0) return;
  await createPlan({
    id: "default",
    name: "Default",
    planId: "default",
    active: true,
  });
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stepperRef = useRef<Stepper>(null);
  const lastAppliedResumeIndexRef = useRef<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);

  // Estado core (persistido por backend / Firestore)
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [adminRoleId, setAdminRoleId] = useState<string | null>(null);

  // Empresa + primer usuario Web (Firestore Web, batch en backend)
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [code, setCode] = useState("");
  const [firstWebUserEmail, setFirstWebUserEmail] = useState("");
  const [firstWebUserDisplayName, setFirstWebUserDisplayName] = useState("");
  const [taxIdChecking, setTaxIdChecking] = useState(false);
  const [taxIdDuplicate, setTaxIdDuplicate] = useState(false);

  // Suscripción
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planId, setPlanId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");

  // Web invite
  const [webEmail, setWebEmail] = useState("");
  const [webDisplayName, setWebDisplayName] = useState("");
  const [webInviteResult, setWebInviteResult] = useState<{ inviteId: string; token: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        obLog("auth user:", { uid: user.uid, email: user.email });
        const me = await getMyAdminUser();
        if (cancelled) return;
        obLog("getMyAdminUser:", me);
        if (me?.status === "active" && me.accountId) {
          setAccountId(me.accountId);
        }
      } catch (e) {
        obLog("getMyAdminUser failed:", e);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  useEffect(() => {
    // Si `accountId` llega después (p.ej. por /admin/me), re-aplicamos el resume del stepper.
    obLog("accountId changed:", accountId);
    lastAppliedResumeIndexRef.current = null;
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    async function computeResume() {
      if (!user) return;
      try {
        // Fuente única: backend decide el estado del onboarding.
        const status = await adminFetch<OnboardingStatus>("/admin/onboarding/status");
        if (cancelled) return;
        obLog("computeResume: status", status);
        if (status?.accountId && status.accountId !== accountId) setAccountId(status.accountId);
        setResumeIndex(typeof status?.nextStep === "number" ? status.nextStep : 0);
      } catch (e) {
        obLog("computeResume failed:", e);
        if (!accountId) {
          setResumeIndex(0);
        }
      }
    }
    void computeResume();
    return () => {
      cancelled = true;
    };
  }, [user, accountId]);

  useEffect(() => {
    if (resumeIndex === null) return;
    if (!stepperRef.current) return;
    if (lastAppliedResumeIndexRef.current === resumeIndex) return;
    obLog("applyResume:", { resumeIndex });
    // Stepper inicia en 0 (Cuenta). Avanzamos N pasos al primer faltante.
    // Usamos microtask para evitar carreras con StrictMode / mount.
    queueMicrotask(() => {
      if (!stepperRef.current) return;
      for (let i = 0; i < resumeIndex; i++) {
        stepperRef.current.nextCallback();
      }
      lastAppliedResumeIndexRef.current = resumeIndex;
    });
  }, [resumeIndex]);

  useEffect(() => {
    if (!accountId) return;
    // Por defecto, la suscripción usa el mismo ID que la cuenta.
    setSubscriptionId((prev) => prev.trim() ? prev : accountId);
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    (async () => {
      try {
        // Si ya tenemos cuenta, aseguramos un plan default para que el select no quede vacío.
        if (accountId) await ensureDefaultPlan();
      } catch {
        // ignore
      }
      const rows = await loadPlans();
      if (cancelled) return;
      setPlans(rows);
      if (!planId && rows.length) setPlanId(rows[0]!.planId ?? rows[0]!.id);
      if (!planId && !rows.length) setPlanId("default");
    })()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const canAccount = accountName.trim().length > 1;
  const canCompany =
    companyName.trim().length > 1 &&
    taxId.trim().length > 0 &&
    !taxIdDuplicate &&
    !taxIdChecking &&
    isValidEmail(firstWebUserEmail);
  const canSubscription = Boolean(accountId); // se crea por defecto aunque no haya plan seleccionado
  const canWebInvite = isValidEmail(webEmail) && (webDisplayName.trim().length > 1);

  const handleTaxIdBlur = async () => {
    const val = taxId.trim();
    if (!val) return;
    setTaxIdChecking(true);
    setTaxIdDuplicate(false);
    try {
      const unique = await checkTaxIdUnique(val);
      setTaxIdDuplicate(!unique);
    } finally {
      setTaxIdChecking(false);
    }
  };

  const bootstrapAccount = async () => {
    if (!user?.uid) return;
    setSaving(true);
    setError(null);
    try {
      const out = await adminFetch<{ ok: boolean; accountId: string; adminRoleId: string }>("/admin/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          accountName: accountName.trim(),
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? "",
        }),
      });
      setAccountId(out.accountId);
      setAdminRoleId(out.adminRoleId);
      setSubscriptionId(out.accountId);
      stepperRef.current?.nextCallback();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo inicializar la cuenta");
    } finally {
      setSaving(false);
    }
  };

  const saveCompany = async () => {
    if (!accountId) return;
    setSaving(true);
    setError(null);
    try {
      const out = await adminFetch<{ generatedPassword?: string }>("/admin/onboarding/bootstrap-web-tenant", {
        method: "POST",
        body: JSON.stringify({
          companyId: accountId,
          name: companyName.trim(),
          companyName: companyName.trim(),
          taxId: taxId.trim() || undefined,
          code: code.trim() || undefined,
          webUserEmail: firstWebUserEmail.trim(),
          webUserDisplayName: firstWebUserDisplayName.trim(),
        }),
      });
      if (out.generatedPassword) {
        setError(null);
        alert(`Usuario creado. Contraseña generada: ${out.generatedPassword}\nGuárdala en un lugar seguro.`);
      }
      stepperRef.current?.nextCallback();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo crear la empresa ni el usuario Web inicial";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const saveSubscription = async () => {
    setSaving(true);
    setError(null);
    try {
      const subId = (subscriptionId.trim() || accountId || "").trim();
      if (!subId) throw new Error("No hay accountId para crear suscripción.");
      await createSubscription({
        id: subId,
        accountId: "current",
        planId: planId.trim() || "default",
        status: "active",
      });
      stepperRef.current?.nextCallback();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la suscripción");
    } finally {
      setSaving(false);
    }
  };

  const inviteFirstWebUser = async () => {
    if (!accountId) return;
    setSaving(true);
    setError(null);
    setWebInviteResult(null);
    try {
      const out = await adminFetch<{ ok: boolean; inviteId: string; token: string }>(
        "/admin/web/invites",
        {
          method: "POST",
          body: JSON.stringify({
            email: webEmail.trim(),
            displayName: webDisplayName.trim(),
            companyId: accountId,
          }),
        }
      );
      setWebInviteResult({ inviteId: out.inviteId, token: out.token });
      stepperRef.current?.nextCallback();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo invitar al usuario web");
    } finally {
      setSaving(false);
    }
  };

  const finish = () => navigate("/");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="dp-glass-panel rounded-2xl p-6">
        <h1 className="dp-content-title">Onboarding</h1>
        <p className="mt-2 text-sm text-[var(--dp-on-surface-soft)]">
          Wizard inicial obligatorio. Completa cada paso para activar tu cuenta.
        </p>
        <div className="mt-2 text-xs text-[var(--dp-on-surface-soft)]">
          {accountId ? (
            <>Cuenta: <code>{accountId}</code>{adminRoleId ? <> · Rol admin: <code>{adminRoleId}</code></> : null}</>
          ) : (
            <>Aún no hay cuenta creada.</>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="dp-soft-panel rounded-2xl p-6">
        <Stepper key={`resume-${String(resumeIndex ?? "x")}`} ref={stepperRef}>
          <StepperPanel header="Cuenta">
            <div className="space-y-4 pt-2">
              <DpInput type="input" label="Nombre de cuenta" name="accountName" value={accountName} onChange={setAccountName} placeholder="ej: ACME Corp" />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={!canAccount || saving}
                  onClick={bootstrapAccount}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  {saving ? "Creando…" : "Crear cuenta y continuar"}
                </button>
              </div>
            </div>
          </StepperPanel>

          <StepperPanel header="Empresa">
            <div className="space-y-4 pt-2">
              <DpInput type="input" label="Nombre de empresa" name="companyName" value={companyName} onChange={setCompanyName} placeholder="ej: ACME Logistics S.A.C." />
              <DpInput
                type="input"
                label="RUC / Tax ID"
                name="taxId"
                value={taxId}
                onChange={(v) => {
                  setTaxId(String(v));
                  setTaxIdDuplicate(false);
                }}
                placeholder="ej: 20123456789"
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  disabled={saving || !taxId.trim()}
                  onClick={handleTaxIdBlur}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-3 py-2 text-xs font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Verificar RUC
                </button>
              </div>
              {taxIdChecking && <div className="text-xs opacity-70">Verificando…</div>}
              {taxIdDuplicate && !taxIdChecking && <div className="text-xs text-red-400">Ya existe una empresa registrada con ese RUC</div>}
              <DpInput type="input" label="Código (opcional)" name="code" value={code} onChange={setCode} placeholder="ej: ACME-01" />
              <div className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-3 dark:bg-white/5">
                <div className="text-sm font-semibold text-[var(--dp-on-surface)]">Primer usuario Web</div>
                <p className="mt-1 text-xs text-[var(--dp-on-surface-soft)]">
                  Se crean en un solo paso la empresa, el usuario en la app, el rol admin de empresa y la membresía (Firestore Web).
                </p>
                <div className="mt-3 space-y-3">
                  <DpInput
                    type="input"
                    label="Email del primer usuario (obligatorio)"
                    name="firstWebUserEmail"
                    value={firstWebUserEmail}
                    onChange={setFirstWebUserEmail}
                    placeholder="usuario@empresa.com"
                  />
                  <DpInput
                    type="input"
                    label="Nombre (opcional)"
                    name="firstWebUserDisplayName"
                    value={firstWebUserDisplayName}
                    onChange={setFirstWebUserDisplayName}
                    placeholder="Nombre Apellido"
                  />
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => stepperRef.current?.prevCallback()}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-2 text-sm font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!accountId || !canCompany || saving}
                  onClick={saveCompany}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : "Guardar y continuar"}
                </button>
              </div>
            </div>
          </StepperPanel>

          <StepperPanel header="Suscripción">
            <div className="space-y-4 pt-2">
              <label className="block text-sm">
                <span className="text-[var(--dp-on-surface-soft)]">Plan</span>
                {plansLoading ? (
                  <div className="mt-1 text-xs opacity-70">Cargando planes…</div>
                ) : (
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-3 py-2 outline-none dark:bg-white/5"
                  >
                    <option value="">— Selecciona un plan —</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.planId ?? p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <DpInput type="input" label="Subscription ID" name="subscriptionId" value={subscriptionId} onChange={setSubscriptionId} placeholder="por defecto: accountId" />
              <div className="text-xs text-[var(--dp-on-surface-soft)]">
                Si no seleccionas plan, se creará una suscripción por defecto con <code>planId=default</code>.
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => stepperRef.current?.prevCallback()}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-2 text-sm font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!canSubscription || saving}
                  onClick={saveSubscription}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : "Guardar y continuar"}
                </button>
              </div>
            </div>
          </StepperPanel>

          <StepperPanel header="Invitar admins (opcional)">
            <div className="space-y-4 pt-2">
              <div className="text-sm text-[var(--dp-on-surface-soft)]">
                (Opcional) En esta iteración puedes invitar admins luego desde <code>/users</code>.
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => stepperRef.current?.prevCallback()}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-2 text-sm font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => stepperRef.current?.nextCallback()}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Omitir
                </button>
              </div>
            </div>
          </StepperPanel>

          <StepperPanel header="Invitación adicional (opcional)">
            <div className="space-y-4 pt-2">
              <p className="text-sm text-[var(--dp-on-surface-soft)]">
                El primer usuario Web ya se definió en el paso Empresa. Aquí puedes generar otra invitación (p. ej. otro email)
                o continuar sin invitar.
              </p>
              <DpInput type="input" label="Email (Web)" name="webEmail" value={webEmail} onChange={setWebEmail} placeholder="usuario@empresa.com" />
              <DpInput type="input" label="Nombre (Web)" name="webDisplayName" value={webDisplayName} onChange={setWebDisplayName} placeholder="Nombre Apellido" />
              {webInviteResult && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
                  Invitación creada. Invite ID: <code>{webInviteResult.inviteId}</code> · Token: <code>{webInviteResult.token}</code>
                </div>
              )}
              <div className="flex flex-wrap justify-between gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => stepperRef.current?.prevCallback()}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-2 text-sm font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                >
                  Atrás
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => stepperRef.current?.nextCallback()}
                    className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/30 px-4 py-2 text-sm font-bold hover:bg-white/50 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                  >
                    Continuar sin invitar más
                  </button>
                  <button
                    type="button"
                    disabled={!accountId || !canWebInvite || saving}
                    onClick={inviteFirstWebUser}
                    className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-60"
                  >
                    {saving ? "Invitando…" : "Invitar y continuar"}
                  </button>
                </div>
              </div>
            </div>
          </StepperPanel>

          <StepperPanel header="Finalizar">
            <div className="space-y-4 pt-2">
              <div className="text-sm text-[var(--dp-on-surface-soft)]">
                Wizard completado. Ya puedes usar el Admin.
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={finish}
                  className="rounded-xl border border-[var(--dp-outline-soft)] bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Ir al dashboard
                </button>
              </div>
            </div>
          </StepperPanel>
        </Stepper>
      </div>
    </div>
  );
}
