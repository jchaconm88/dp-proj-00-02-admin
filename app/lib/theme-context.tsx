import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

function applyPrimeReactTheme(t: Theme) {
  let link = document.getElementById("primereact-theme") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = "primereact-theme";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = t === "dark" ? "/themes/primereact-dark.css" : "/themes/primereact-light.css";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return readTheme();
  });

  useEffect(() => {
    const value = readTheme();
    setThemeState(value);
    document.documentElement.classList.toggle("dark", value === "dark");
    applyPrimeReactTheme(value);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
    applyPrimeReactTheme(t);
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

