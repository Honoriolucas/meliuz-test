import { useMemo, useState } from "react";
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { api } from "../api";
import { ChartCard } from "../components/ChartCard";
import { buildTooltip } from "../components/ChartTooltip";
import { formatBRL, formatBRLShort, formatInt, formatPP } from "../format";
import { filterDeps, useFetch } from "../hooks";
import { AXIS_COLOR, COLORS, GRID_COLOR, divergingColor } from "../theme";
import type { FilterState } from "../types";

type MetricY = "net_take_pp" | "margem_rs";

export function ScatterSection({ filters }: { filters: FilterState }) {
  const [metricY, setMetricY] = useState<MetricY>("net_take_pp");
  const { data, loading } = useFetch(() => api.scatter(filters, metricY), [...filterDeps(filters), metricY]);

  const rows = data ?? [];
  const maxAbs = useMemo(() => rows.reduce((m, r) => Math.max(m, Math.abs(r.value)), 0.0001), [rows]);
  const maxPedidos = useMemo(() => rows.reduce((m, r) => Math.max(m, r.pedidos), 1), [rows]);

  const yLabel = metricY === "net_take_pp" ? "Net take médio (pp)" : "Margem (R$)";
  const yFormat = metricY === "net_take_pp" ? (v: number) => formatPP(v) : (v: number) => formatBRL(v);

  const tooltip = buildTooltip([
    { key: "label", label: "Categoria", color: COLORS.textMuted, format: (v: string) => v },
    { key: "gmv", label: "GMV", color: COLORS.blue, format: (v: number) => formatBRL(v) },
    { key: "value", label: yLabel, color: COLORS.violet, format: yFormat },
    { key: "pedidos", label: "Pedidos", color: COLORS.textMuted, format: (v: number) => formatInt(v) },
  ]);

  return (
    <ChartCard
      title="GMV × margem — quem vende muito com margem boa?"
      subtitle={`Cada ponto é ${filters.viewLevel === "Grupo somado" ? "um macro-grupo" : "uma categoria"}; tamanho = pedidos`}
      loading={loading}
      empty={rows.length === 0}
      controls={
        <select
          value={metricY}
          onChange={(e) => setMetricY(e.target.value as MetricY)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] outline-none"
        >
          <option value="net_take_pp" className="bg-[var(--color-surface-hi)]">
            Net take (pp)
          </option>
          <option value="margem_rs" className="bg-[var(--color-surface-hi)]">
            Margem (R$)
          </option>
        </select>
      }
    >
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} />
          <XAxis type="number" dataKey="gmv" name="GMV" stroke={AXIS_COLOR} tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickFormatter={(v) => formatBRLShort(v)} tickLine={false} axisLine={{ stroke: AXIS_COLOR }} />
          <YAxis type="number" dataKey="value" name={yLabel} stroke={AXIS_COLOR} tick={{ fill: COLORS.textMuted, fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
          <ZAxis type="number" dataKey="pedidos" range={[60, 900]} domain={[0, maxPedidos]} />
          <Tooltip content={tooltip} cursor={{ strokeDasharray: "3 3", stroke: AXIS_COLOR }} />
          <Scatter data={rows} fillOpacity={0.85}>
            {rows.map((r) => (
              <Cell key={r.label} fill={divergingColor(r.value, maxAbs)} stroke={COLORS.surface} strokeWidth={1} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
