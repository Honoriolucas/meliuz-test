import { ArrowDownRight, ArrowUpRight, Info, type LucideIcon } from "lucide-react";
import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import clsx from "clsx";

interface KpiCardProps {
  title: string;
  value: string;
  deltaLabel: string | null;
  deltaPositive: boolean | null;
  helpText?: string;
  sparkData: number[];
  gradient: [string, string];
  icon: LucideIcon;
}

export function KpiCard({ title, value, deltaLabel, deltaPositive, helpText, sparkData, gradient, icon: Icon }: KpiCardProps) {
  const gradId = useId();
  const chartData = sparkData.map((y, i) => ({ i, y }));

  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5">
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-35"
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-medium text-[var(--color-text-muted)]">{title}</p>
            {helpText && (
              <span title={helpText} className="shrink-0 cursor-help text-[var(--color-text-muted)]">
                <Info size={11} />
              </span>
            )}
          </div>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{value}</p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `linear-gradient(135deg, ${gradient[0]}2e, ${gradient[1]}2e)`, color: gradient[0] }}
        >
          <Icon size={17} />
        </div>
      </div>

      {deltaLabel && (
        <div
          className={clsx(
            "relative mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            deltaPositive ? "bg-[var(--color-good)]/15 text-[var(--color-good)]" : "bg-[var(--color-critical)]/15 text-[var(--color-critical)]",
          )}
        >
          {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {deltaLabel}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="relative -mx-1 mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradient[0]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={gradient[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="y"
                stroke={gradient[0]}
                strokeWidth={2}
                fill={`url(#spark-${gradId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
