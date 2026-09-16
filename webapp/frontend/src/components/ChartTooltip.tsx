interface TooltipRow {
  key: string;
  label: string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format: (raw: any) => string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTooltipProps = any;

/** Fábrica de tooltip: cada gráfico declara quais campos do payload bruto
 * (a linha de dado original, não o valor plotado) mostrar e como formatar.
 * Tipado frouxamente porque os genéricos de `TooltipContentProps` do Recharts
 * não compõem de forma sã com uma função de conteúdo compartilhada como esta. */
export function buildTooltip(rows: TooltipRow[], labelFormatter?: (label: string) => string) {
  return function CustomTooltip({ active, label, payload }: AnyTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const raw = payload[0]?.payload ?? {};
    return (
      <div className="panel-solid rounded-xl px-3 py-2 text-xs shadow-xl shadow-black/40">
        {label !== undefined && (
          <p className="mb-1.5 font-medium text-[var(--color-text-primary)]">
            {labelFormatter ? labelFormatter(String(label)) : String(label)}
          </p>
        )}
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: r.color }} />
              <span className="text-[var(--color-text-muted)]">{r.label}:</span>
              <span className="ml-auto pl-3 font-medium text-[var(--color-text-primary)]">{r.format(raw[r.key])}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
}
