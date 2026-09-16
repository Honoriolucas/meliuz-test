import clsx from "clsx";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  controls,
  loading,
  empty,
  emptyMessage = "Sem dados para os filtros selecionados.",
  className,
  children,
}: ChartCardProps) {
  return (
    <div className={clsx("glass rounded-2xl p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
        {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--color-surface)]/40 backdrop-blur-sm">
            <div className="size-6 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-blue)]" />
          </div>
        )}
        {empty && !loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">{emptyMessage}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
