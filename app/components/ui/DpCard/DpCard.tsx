import type { CSSProperties, ReactNode } from "react";

export type DpCardTitleSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface DpCardProps {
  /** Texto pequeño en mayúsculas (ej: CUENTA, PLAN ACTIVO). */
  kicker?: ReactNode;
  /** Título principal del card. */
  title?: ReactNode;
  /** Texto secundario debajo del título. */
  subtitle?: ReactNode;
  /** Contenido a la derecha del header (badge / botón). */
  headerRight?: ReactNode;
  /** Ancho del card (style). */
  width?: CSSProperties["width"];
  /** Tamaño del título (clase Tailwind). */
  titleSize?: DpCardTitleSize;
  /** Clases extra para el contenedor. */
  className?: string;
  /** Clases extra para el body (debajo del header). */
  bodyClassName?: string;
  children?: ReactNode;
}

function titleClassBySize(size: DpCardTitleSize): string {
  switch (size) {
    case "sm":
      return "text-sm font-black tracking-tight";
    case "md":
      return "text-base font-black tracking-tight";
    case "lg":
      return "text-lg font-black tracking-tight";
    case "xl":
      return "text-xl font-black tracking-tight";
    case "2xl":
      return "text-2xl font-black tracking-tight";
  }
}

export default function DpCard({
  kicker,
  title,
  subtitle,
  headerRight,
  width,
  titleSize = "xl",
  className = "",
  bodyClassName = "",
  children,
}: DpCardProps) {
  const hasTitle = title != null && title !== false;
  const hasHeaderText = kicker != null || hasTitle || subtitle != null;
  const hasHeader = kicker != null || title != null || subtitle != null || headerRight != null;

  return (
    <div
      className={`dp-soft-panel rounded-2xl p-5 ${className}`.trim()}
      style={width != null ? { width } : undefined}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {kicker != null ? (
              <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--dp-on-surface-soft)]">
                {kicker}
              </div>
            ) : null}
            {hasTitle ? (
              <div className={`mt-1 ${titleClassBySize(titleSize)} min-w-0 truncate`}>
                {title}
              </div>
            ) : null}
            {subtitle != null ? (
              <div className={`${hasTitle ? "mt-1" : kicker != null ? "mt-2" : ""} text-sm text-[var(--dp-on-surface-soft)]`}>
                {subtitle}
              </div>
            ) : null}
          </div>
          {headerRight != null ? <div className="flex-shrink-0">{headerRight}</div> : null}
        </div>
      )}

      {children != null ? (
        <div className={`${hasHeaderText ? "mt-4" : ""} ${bodyClassName}`.trim()}>{children}</div>
      ) : null}
    </div>
  );
}

