import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api";
import { ChartCard } from "../components/ChartCard";
import { buildTooltip } from "../components/ChartTooltip";
import { formatBRL, formatBRLShort, formatDateLabel, formatPct } from "../format";
import { filterDeps, useFetch } from "../hooks";
import { AXIS_COLOR, CATEGORICAL, COLORS, GRID_COLOR } from "../theme";
import type { FilterState } from "../types";

function colorFor(i: number): string {
  return CATEGORICAL[i % CATEGORICAL.length];
}

/** O gráfico principal da tela: 3 painéis empilhados (cashback %, GMV, margem)
 * com eixo de tempo compartilhado e valores reais — sem indexação, sem detecção
 * automática de campanha. Uma linha por categoria (ou macro-grupo) selecionada,
 * para comparar quem teve salto de cashback na mesma janela de tempo. */
export function CentralChartSection({ filters }: { filters: FilterState }) {
  const { data, loading } = useFetch(() => api.timeseriesMulti(filters), filterDeps(filters));

  const groups = data?.series ?? [];

  const rows = useMemo(() => {
    if (!data || data.periodo.length === 0) return [];
    return data.periodo.map((p, i) => {
      const row: Record<string, string | number | null> = { label: formatDateLabel(p, filters.granularity) };
      for (const s of data.series) {
        row[`${s.name}__cashback`] = s.cashback_pct[i] ?? null;
        row[`${s.name}__gmv`] = s.gmv[i] ?? null;
        row[`${s.name}__margem`] = s.margem_rs[i] ?? null;
      }
      return row;
    });
  }, [data, filters.granularity]);

  const cashbackTooltip = useMemo(
    () =>
      buildTooltip(
        groups.map((s, i) => ({
          key: `${s.name}__cashback`,
          label: s.name,
          color: colorFor(i),
          format: (v: number | null) => (v === null || v === undefined ? "—" : formatPct(v, 2)),
        })),
      ),
    [groups],
  );
  const gmvTooltip = useMemo(
    () =>
      buildTooltip(
        groups.map((s, i) => ({
          key: `${s.name}__gmv`,
          label: s.name,
          color: colorFor(i),
          format: (v: number | null) => (v === null || v === undefined ? "—" : formatBRL(v)),
        })),
      ),
    [groups],
  );
  const margemTooltip = useMemo(
    () =>
      buildTooltip(
        groups.map((s, i) => ({
          key: `${s.name}__margem`,
          label: s.name,
          color: colorFor(i),
          format: (v: number | null) => (v === null || v === undefined ? "—" : formatBRL(v)),
        })),
      ),
    [groups],
  );

  const levelLabel = filters.viewLevel === "Grupo somado" ? "macro-grupos" : "categorias";
  const subtitle = data?.truncated
    ? `Eixo do tempo compartilhado nos 3 painéis · mostrando as ${groups.length} ${levelLabel} com maior GMV, de ${data.total_groups} selecionadas — refine o filtro para focar a comparação`
    : "Eixo do tempo compartilhado nos 3 painéis: veja o salto de cashback e desça o olho para o efeito em GMV e margem, na mesma data";

  const sharedXAxisProps = {
    dataKey: "label",
    stroke: AXIS_COLOR,
    tickLine: false,
    axisLine: { stroke: AXIS_COLOR },
    minTickGap: 28,
  } as const;

  return (
    <ChartCard
      title="Cashback, GMV e Margem ao longo do tempo"
      subtitle={subtitle}
      loading={loading}
      empty={rows.length === 0}
      className="p-6"
    >
      {groups.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 border-b border-white/5 pb-4">
          {groups.map((s, i) => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              <span className="size-2 rounded-full" style={{ background: colorFor(i) }} />
              {s.name}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={rows} syncId="central" margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis {...sharedXAxisProps} tick={false} />
            <YAxis
              stroke={AXIS_COLOR}
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              unit="%"
              label={{ value: "Cashback %", angle: -90, position: "insideLeft", fill: COLORS.textMuted, fontSize: 10 }}
            />
            <Tooltip content={cashbackTooltip} />
            {groups.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={`${s.name}__cashback`}
                stroke={colorFor(i)}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={rows} syncId="central" margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis {...sharedXAxisProps} tick={false} />
            <YAxis
              stroke={AXIS_COLOR}
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => formatBRLShort(v)}
              label={{ value: "GMV (parceiro)", angle: -90, position: "insideLeft", fill: COLORS.textMuted, fontSize: 10 }}
            />
            <Tooltip content={gmvTooltip} />
            {groups.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={`${s.name}__gmv`}
                stroke={colorFor(i)}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={rows} syncId="central" margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis {...sharedXAxisProps} tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
            <YAxis
              stroke={AXIS_COLOR}
              tick={{ fill: COLORS.textMuted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => formatBRLShort(v)}
              label={{ value: "Margem (Méliuz)", angle: -90, position: "insideLeft", fill: COLORS.textMuted, fontSize: 10 }}
            />
            <Tooltip content={margemTooltip} />
            {groups.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={`${s.name}__margem`}
                stroke={colorFor(i)}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
