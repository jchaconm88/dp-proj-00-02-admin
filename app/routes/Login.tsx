import { useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router";
import { auth } from "~/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h1 className="text-xl font-black tracking-tight">Admin</h1>
          <p className="text-sm text-white/70">Inicia sesión con tu usuario del proyecto Admin.</p>
        </div>

        {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        <label className="block text-sm">
          <span className="text-white/80">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 outline-none"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm">
          <span className="text-white/80">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 outline-none"
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>

        <button
          type="button"
          onClick={signInGoogle}
          disabled={loading}
          className="w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          Continuar con Google
        </button>

        <div className="text-center text-sm text-white/70">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-white underline underline-offset-4 hover:opacity-90">
            Crear usuario
          </Link>
        </div>
      </form>
    </div>
  );
}

