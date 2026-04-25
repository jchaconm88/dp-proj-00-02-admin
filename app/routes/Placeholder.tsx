import { useLocation } from "react-router";

export default function PlaceholderPage() {
  const loc = useLocation();
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-black tracking-tight">En construcción</h2>
      <p className="text-sm text-white/70">
        Ruta: <code>{loc.pathname}</code>
      </p>
    </div>
  );
}

