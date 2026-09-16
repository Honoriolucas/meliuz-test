import { ChevronDown, GitCompare } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { buildTooltip } from "../components/ChartTooltip";
import { deltaPP, deltaPct, formatBRL, formatBRLShort, formatPP } from "../format";
import { useFetch } from "../hooks";
import { AXIS_COLOR, COLORS, GRID_COLOR } from "../theme";
import { METRIC_LABELS, type FilterState, type MoneyMetric } from "../types";
import clsx from "clsx";

const MONEY_METRICS: MoneyMetric[] = ["gmv", "comissao_rs", "cashback_rs", "margem_rs"];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86_400_000);
}

/** Período B por padrão = mesmo tamanho de A, imediatamente anterior. Quando A já
 * cobre o início dos dados (ex: "Período completo"), não sobra espaço antes dele —
 * nesse caso cai para comparar a 1ª metade de A vs a 2ª metade, em vez de colapsar
 * B num único dia (o que gerava deltas sem sentido como "+50000%"). */
function computeDefaultPeriods(aStart: string, aEnd: string, dateMin: string) {
  const len = daysBetween(aStart, aEnd);
  const naturalBEnd = addDays(aStart, -1);
  const naturalBStart = addDays(naturalBEnd, -len);
  if (naturalBEnd >= dateMin && naturalBStart >= dateMin) {
    return { aStart, aEnd, bStart: naturalBStart, bEnd: naturalBEnd };
  }
  const half = Math.max(1, Math.floor(len / 2));
  const mid = addDays(aStart, half);
  return { aStart: mid, aEnd, bStart: aStart, bEnd: addDays(mid, -1) };
}

interface CompareSectionProps {
  filters: FilterState;
  dateMin: string;
  dateMax: string;
}

export function CompareSection({ filters, dateMin, dateMax }: CompareSectionProps) {
  const [open, setOpen] = useState(true);
  const defaults = computeDefaultPeriods(filters.startDate, filters.endDate, dateMin);
  const [aStart, setAStart] = useState(defaults.aStart);
  const [aEnd, setAEnd] = useState(defaults.aEnd);
  const [bStart, setBStart] = useState(defaults.bStart);
  const [bEnd, setBEnd] = useState(defaults.bEnd);

  const filterA: FilterState = { ...filters, startDate: aStart, endDate: aEnd };
  const filterB: FilterState = { ...filters, startDate: bStart, endDate: bEnd };

  const { data, loading } = useFetch(
    () => (open ? api.compare(filterA, filterB) : Promise.resolve(null)),
    [open, aStart, aEnd, bStart, bEnd, filters.macroGrupos.join("|"), filters.categorias.join("|")],
  );

  const chartRows = useMemo(() => {
    if (!data) return [];
    return MONEY_METRICS.map((m) => ({ metric: METRIC_LABELS[m], a: data.a[m], b: data.b[m] }));
  }, [data]);

  const tooltip = buildTooltip([
    { key: "a", label: `A (${aStart} a ${aEnd})`, color: COLORS.blue, format: (v: number) => formatBRL(v) },
    { key: "b", label: `B (${bStart} a ${bEnd})`, color: COLORS.orange, format: (v: number) => formatBRL(v) },
  ]);

  return (
    <div className="glass rounded-2xl p-5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-[var(--color-text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Comparar dois períodos lado a lado</h3>
        </div>
        <ChevronDown size={16} className={clsx("text-[var(--color-text-muted)] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: COLORS.blue }} />
              <span className="text-xs text-[var(--color-text-muted)]">Período A</span>
              <input type="date" value={aStart} min={dateMin} max={aEnd} onChange={(e) => setAStart(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]" />
              <span className="text-[var(--color-text-muted)]">–</span>
              <input type="date" value={aEnd} min={aStart} max={dateMax} onChange={(e) => setAEnd(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: COLORS.orange }} />
              <span className="text-xs text-[var(--color-text-muted)]">Período B</span>
              <input type="date" value={bStart} min={dateMin} max={bEnd} onChange={(e) => setBStart(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]" />
              <span className="text-[var(--color-text-muted)]">–</span>
              <input type="date" value={bEnd} min={bStart} max={dateMax} onChange={(e) => setBEnd(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]" />
            </div>
          </div>

          {loading && <div className="flex h-64 items-center justify-center text-sm text-[var(--color-text-muted)]">Carregando…</div>}

          {!loading && data && (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartRows} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="metric" stroke={AXIS_COLOR} tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickLine={false} axisLine={{ stroke: AXIS_COLOR }} />
                  <YAxis stroke={AXIS_COLOR} tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => formatBRLShort(v)} />
                  <Tooltip content={tooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textSecondary }} formatter={(v) => (v === "a" ? "Período A" : "Período B")} />
                  <Bar dataKey="a" fill={COLORS.blue} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="b" fill={COLORS.orange} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(
                  [
                    { label: "GMV — A vs B", a: data.a.gmv, b: data.b.gmv, pp: false },
                    { label: "Margem — A vs B", a: data.a.margem_rs, b: data.b.margem_rs, pp: false },
                    { label: "Net take — A vs B", a: data.a.net_take_pp, b: data.b.net_take_pp, pp: true },
                  ] as const
                ).map((row) => {
                  const delta = row.pp ? deltaPP(row.a, row.b) : deltaPct(row.a, row.b);
                  const positive = delta !== null && delta >= 0;
                  return (
                    <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-xs text-[var(--color-text-muted)]">{row.label}</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">{row.pp ? formatPP(row.a) : formatBRL(row.a)}</p>
                      {delta !== null && (
                        <p className={clsx("mt-0.5 text-xs font-medium", positive ? "text-[var(--color-good)]" : "text-[var(--color-critical)]")}>
                          {positive ? "+" : ""}
                          {row.pp ? `${delta.toFixed(2)} pp` : `${delta.toFixed(1)}%`} vs B
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
