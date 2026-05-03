import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

interface LoadingContextValue {
  start: () => void;
  stop: () => void;
  loading: boolean;
}

const LoadingContext = createContext<LoadingContextValue>({
  start: () => {},
  stop: () => {},
  loading: false,
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const countRef = useRef(0);
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => {
    countRef.current += 1;
    setLoading(true);
  }, []);

  const stop = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) setLoading(false);
  }, []);

  const value = useMemo(() => ({ start, stop, loading }), [start, stop, loading]);
  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useGlobalLoading() {
  return useContext(LoadingContext);
}

