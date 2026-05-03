import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { useGlobalLoading } from "~/lib/loading-context";

export default function PaceLoader() {
  const navigation = useNavigation();
  const { loading: dataLoading } = useGlobalLoading();
  const isLoading = navigation.state !== "idle" || dataLoading;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setFading(false);
      setProgress(10);

      let current = 10;
      timerRef.current = setInterval(() => {
        current =
          current < 70
            ? current + Math.random() * 12
            : current < 90
              ? current + Math.random() * 3
              : current + Math.random() * 0.5;
        setProgress(Math.min(current, 94));
      }, 180);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setProgress(100);
      fadeTimerRef.current = setTimeout(() => {
        setFading(true);
        fadeTimerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
          setFading(false);
        }, 400);
      }, 200);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      aria-label="Cargando..."
      role="progressbar"
      aria-valuenow={progress}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: "3px",
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 0.4s ease" : "none",
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(59,130,246,0.12)" }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #3b82f6, #6366f1)",
          transition: progress === 100 ? "width 0.15s ease" : "width 0.18s ease-out",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 8px 1px rgba(99,102,241,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-2px",
          left: `calc(${progress}% - 6px)`,
          width: 12,
          height: 7,
          borderRadius: "50%",
          background: "#818cf8",
          boxShadow: "0 0 10px 4px rgba(129,140,248,0.8)",
          opacity: progress < 98 ? 1 : 0,
          transition: "left 0.18s ease-out, opacity 0.15s",
        }}
      />
    </div>
  );
}

