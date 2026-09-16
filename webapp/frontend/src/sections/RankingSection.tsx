import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { ChartCard } from "../components/ChartCard";
import { buildTooltip } from "../components/ChartTooltip";
import { formatBRL, formatBRLShort } from "../format";
import { filterDeps, useFetch } from "../hooks";
import { AXIS_COLOR, COLORS, GRID_COLOR } from "../theme";
import { METRIC_LABELS, type FilterState, type MoneyMetric } from "../types";

const METRICS: MoneyMetric[] = ["gmv", "margem_rs", "comissao_rs", "cashback_rs"];

export function RankingSection({ filters }: { filters: FilterState }) {
  const [metric, setMetric] = useState<MoneyMetric>("gmv");
  const [topN, setTopN] = useState(15);

  const { data, loading } = useFetch(() => api.ranking(filters, metric, topN), [...filterDeps(filters), metric, topN]);

  const rows = (data ?? [])
    .slice()
    .sort((a, b) => a.value - b.value)
    .map((r) => ({ ...r, label: r.label.length > 22 ? r.label.slice(0, 21) + "…" : r.label }));

  const tooltip = buildTooltip([{ key: "value", label: METRIC_LABELS[metric], color: COLORS.blue, format: (v: number) => formatBRL(v) }]);

  const groupLevel = filters.viewLevel === "Grupo somado" ? "grupo" : "categoria";

  return (
    <ChartCard
      title={`Ranking por ${groupLevel}`}
      subtitle={`Top ${topN} por ${METRIC_LABELS[metric].toLowerCase()}`}
      loading={loading}
      empty={rows.length === 0}
      controls={
        <>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MoneyMetric)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] outline-none"
          >
            {METRICS.map((m) => (
              <option key={m} value={m} className="bg-[var(--color-surface-hi)]">
                {METRIC_LABELS[m]}
              </option>
            ))}
          </select>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] outline-none"
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n} className="bg-[var(--color-surface-hi)]">
                Top {n}
              </option>
            ))}
          </select>
        </>
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(320, rows.length * 26)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" stroke={AXIS_COLOR} tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickFormatter={(v) => formatBRLShort(v)} tickLine={false} axisLine={{ stroke: AXIS_COLOR }} />
          <YAxis type="category" dataKey="label" stroke={AXIS_COLOR} tick={{ fill: COLORS.textSecondary, fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
          <Tooltip content={tooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {rows.map((r) => (
              <Cell key={r.label} fill={r.value >= 0 ? COLORS.blue : COLORS.red} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
