import type { ReactNode } from "react";
import { Button } from "primereact/button";

export interface DpContentProps {
  title: string;
  breadcrumbItems?: string[];
  /** Si es true, no se renderiza la fila de breadcrumb (ni el subtítulo por defecto). Útil en paneles anidados. */
  hideBreadcrumb?: boolean;
  /** Si es true, no se renderiza el título (h1/h2). */
  hideTitle?: boolean;
  /** Tamaño del título (mantiene el diseño, solo ajusta font-size). */
  titleSize?: "sm" | "md" | "lg";
  /**
   * Si es false, el área de `children` no usa `dp-content-surface` (sin panel con fondo/borde del layout).
   * La cabecera (breadcrumb + título + acciones) se mantiene igual salvo `hideBreadcrumb`.
   */
  contentSurface?: boolean;
  /** Menos padding superior en la raíz; pensado para `DpContent` anidado dentro de una página. */
  embedded?: boolean;
  onFilterAction?: () => void;
  onCreate?: () => void;
  filterLabel?: string;
  createLabel?: string;
  showFilterButton?: boolean;
  showCreateButton?: boolean;
  children: ReactNode;
}

export default function DpContent({
  title,
  breadcrumbItems,
  hideBreadcrumb = false,
  hideTitle = false,
  titleSize = "md",
  contentSurface = true,
  embedded = false,
  onFilterAction,
  onCreate,
  filterLabel = "Filtrar",
  createLabel = "Nuevo",
  showFilterButton = true,
  showCreateButton = true,
  children,
}: DpContentProps) {
  const canShowFilter = showFilterButton && onFilterAction != null;
  const canShowCreate = showCreateButton && onCreate != null;

  const rootClass = embedded ? "space-y-3" : "space-y-4 pt-4";
  const titleStyle =
    titleSize === "sm"
      ? { fontSize: "clamp(1.05rem, 0.92rem + 0.55vw, 1.35rem)" }
      : titleSize === "lg"
        ? { fontSize: "clamp(1.35rem, 1.05rem + 1.15vw, 2.15rem)" }
        : undefined;

  return (
    <div className={rootClass}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-1">
        <div className="space-y-1">
          {!hideBreadcrumb &&
            (breadcrumbItems != null && breadcrumbItems.length > 0 ? (
              <p className="dp-content-breadcrumb">
                {breadcrumbItems.map((item, idx) => (
                  <span key={`${item}-${idx}`}>
                    {idx > 0 && <span className="dp-content-breadcrumb-sep">›</span>}
                    <span className={idx === breadcrumbItems.length - 1 ? "dp-content-breadcrumb-current" : ""}>
                      {item}
                    </span>
                  </span>
                ))}
              </p>
            ) : (
              <p className="dp-content-subtitle">Kinetic Observatory</p>
            ))}
          {!hideTitle ? (
            embedded ? (
              <h2 className="dp-content-title" style={titleStyle}>
                {title}
              </h2>
            ) : (
              <h1 className="dp-content-title" style={titleStyle}>
                {title}
              </h1>
            )
          ) : null}
        </div>
        {(canShowFilter || canShowCreate) && (
          <div className="flex flex-wrap items-center gap-2">
            {canShowFilter && (
              <Button
                type="button"
                label={filterLabel}
                icon="pi pi-filter"
                className="dp-btn-soft"
                onClick={onFilterAction}
              />
            )}
            {canShowCreate && (
              <Button
                type="button"
                label={createLabel}
                icon="pi pi-plus"
                className="dp-btn-neon"
                onClick={onCreate}
              />
            )}
          </div>
        )}
      </div>
      {contentSurface ? (
        <section className="dp-content-surface">
          <div className="relative">{children}</div>
        </section>
      ) : (
        <div className="relative">{children}</div>
      )}
    </div>
  );
}
