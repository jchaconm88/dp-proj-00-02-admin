import { useState } from "react";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Link, useNavigate } from "react-router";
import { auth } from "~/lib/firebase";

export default function RegistroPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const registerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const registerGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <form
        onSubmit={registerEmail}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <div>
          <h1 className="text-xl font-black tracking-tight">Crear usuario</h1>
          <p className="text-sm text-white/70">
            Crea un usuario del proyecto Admin (email/password o Google).
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

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
            autoComplete="new-password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          {loading ? "Creando…" : "Crear con email"}
        </button>

        <button
          type="button"
          onClick={registerGoogle}
          disabled={loading}
          className="w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-sm font-bold disabled:opacity-50"
        >
          Crear / continuar con Google
        </button>

        <div className="text-center text-sm text-white/70">
          ¿Ya tienes usuario?{" "}
          <Link to="/login" className="text-white underline underline-offset-4 hover:opacity-90">
            Volver a login
          </Link>
        </div>
      </form>
    </div>
  );
}

