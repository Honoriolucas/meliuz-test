import type { FilterState, Granularity, Meta, ViewLevel } from "../types";
import { Dropdown } from "./Dropdown";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import { PeriodDropdown } from "./PeriodDropdown";
import { SegmentedControl } from "./SegmentedControl";
import { LayoutGrid } from "lucide-react";

interface TopBarProps {
  meta: Meta;
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

const GRANULARITIES: Granularity[] = ["Diária", "Semanal", "Mensal"];
const VIEW_LEVELS: ViewLevel[] = ["Categoria", "Grupo somado"];

export function TopBar({ meta, filters, onChange }: TopBarProps) {
  const allGroups = meta.macro_grupos.map((g) => g.nome);
  const categoriasDoGrupo = meta.macro_grupos
    .filter((g) => filters.macroGrupos.includes(g.nome))
    .flatMap((g) => g.categorias);

  function setMacroGrupos(vals: string[]) {
    // categorias de grupos que continuam selecionados são preservadas; categorias de
    // grupos recém-adicionados entram automaticamente; categorias de grupos removidos saem.
    const prevGroups = new Set(filters.macroGrupos);
    const addedGroups = new Set(vals.filter((g) => !prevGroups.has(g)));
    const pool = new Set(meta.macro_grupos.filter((g) => vals.includes(g.nome)).flatMap((g) => g.categorias));
    const addedCategorias = meta.macro_grupos.filter((g) => addedGroups.has(g.nome)).flatMap((g) => g.categorias);
    const keptCategorias = filters.categorias.filter((c) => pool.has(c));
    const categorias = Array.from(new Set([...keptCategorias, ...addedCategorias]));
    onChange({ ...filters, macroGrupos: vals, categorias });
  }

  return (
    <div className="glass sticky top-4 z-40 flex flex-wrap items-center gap-2 rounded-2xl p-2.5 shadow-lg shadow-black/20">
      <PeriodDropdown
        meta={meta}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onChange={(startDate, endDate) => onChange({ ...filters, startDate, endDate })}
      />

      <Dropdown
        width={180}
        label={<span className="font-medium">{filters.granularity}</span>}
      >
        {() => (
          <div className="flex flex-col gap-1">
            {GRANULARITIES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ ...filters, granularity: g })}
                className={
                  "rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-white/5 " +
                  (g === filters.granularity ? "bg-[var(--color-blue)]/15 font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]")
                }
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <div className="h-6 w-px bg-white/10" />

      <MultiSelectDropdown label="Grupo" options={allGroups} selected={filters.macroGrupos} onChange={setMacroGrupos} />

      <MultiSelectDropdown
        label="Categoria"
        options={categoriasDoGrupo}
        selected={filters.categorias}
        onChange={(categorias) => onChange({ ...filters, categorias })}
        extraAction={{ label: "Todas as categorias do grupo", onClick: () => onChange({ ...filters, categorias: categoriasDoGrupo }) }}
      />

      <div className="h-6 w-px bg-white/10" />

      <div className="flex items-center gap-2">
        <LayoutGrid size={14} className="text-[var(--color-text-muted)]" />
        <SegmentedControl options={VIEW_LEVELS} value={filters.viewLevel} onChange={(viewLevel) => onChange({ ...filters, viewLevel })} size="sm" />
      </div>
    </div>
  );
}
