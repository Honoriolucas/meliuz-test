import { Calendar } from "lucide-react";
import { useMemo } from "react";
import clsx from "clsx";
import { Dropdown } from "./Dropdown";
import type { Meta } from "../types";

interface Preset {
  label: string;
  start: string;
  end: string;
}

function lastDayOfMonth(year: number, month1to12: number): string {
  const d = new Date(year, month1to12, 0);
  return d.toISOString().slice(0, 10);
}

function clamp(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function buildPresets(meta: Meta): Preset[] {
  const presets: Preset[] = [{ label: "Período completo", start: meta.date_min, end: meta.date_max }];

  for (const am of meta.ano_mes) {
    const [y, m] = am.split("-").map(Number);
    presets.push({
      label: `Mês: ${am}`,
      start: clamp(`${am}-01`, meta.date_min, meta.date_max),
      end: clamp(lastDayOfMonth(y, m), meta.date_min, meta.date_max),
    });
  }

  const quarters = new Map<string, Preset>();
  for (const am of meta.ano_mes) {
    const [y, m] = am.split("-").map(Number);
    const q = Math.floor((m - 1) / 3) + 1;
    const key = `${y}-T${q}`;
    if (quarters.has(key)) continue;
    const qStartMonth = (q - 1) * 3 + 1;
    quarters.set(key, {
      label: `Trimestre: ${key}`,
      start: clamp(`${y}-${String(qStartMonth).padStart(2, "0")}-01`, meta.date_min, meta.date_max),
      end: clamp(lastDayOfMonth(y, qStartMonth + 2), meta.date_min, meta.date_max),
    });
  }
  presets.push(...quarters.values());

  const years = Array.from(new Set(meta.ano_mes.map((am) => am.split("-")[0])));
  for (const y of years) {
    presets.push({
      label: `Ano: ${y}`,
      start: clamp(`${y}-01-01`, meta.date_min, meta.date_max),
      end: clamp(`${y}-12-31`, meta.date_min, meta.date_max),
    });
  }

  return presets;
}

interface PeriodDropdownProps {
  meta: Meta;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function PeriodDropdown({ meta, startDate, endDate, onChange }: PeriodDropdownProps) {
  const presets = useMemo(() => buildPresets(meta), [meta]);
  const activePreset = presets.find((p) => p.start === startDate && p.end === endDate);

  return (
    <Dropdown
      width={300}
      icon={<Calendar size={14} className="text-[var(--color-text-muted)]" />}
      label={<span className="font-medium">{activePreset ? activePreset.label : `${startDate} — ${endDate}`}</span>}
    >
      {() => (
        <div className="flex flex-col gap-1">
          <p className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Atalhos</p>
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.start, p.end)}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-white/5",
                  p.start === startDate && p.end === endDate
                    ? "bg-[var(--color-blue)]/15 font-medium text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-white/10 pt-2">
            <p className="px-1 pb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Personalizado</p>
            <div className="flex items-center gap-2 px-1">
              <input
                type="date"
                value={startDate}
                min={meta.date_min}
                max={endDate}
                onChange={(e) => onChange(e.target.value, endDate)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]"
              />
              <span className="text-[var(--color-text-muted)]">–</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={meta.date_max}
                onChange={(e) => onChange(startDate, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-[var(--color-text-primary)] [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}
    </Dropdown>
  );
}
