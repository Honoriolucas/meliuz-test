import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./api";
import { KpiRow } from "./components/KpiRow";
import { TopBar } from "./components/TopBar";
import { filterDeps, useFetch } from "./hooks";
import { CentralChartSection } from "./sections/CentralChartSection";
import { CompareSection } from "./sections/CompareSection";
import { RankingSection } from "./sections/RankingSection";
import { ScatterSection } from "./sections/ScatterSection";
import type { FilterState, Meta } from "./types";

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    api
      .meta()
      .then((m) => {
        setMeta(m);
        const allGroups = m.macro_grupos.map((g) => g.nome);
        const allCategorias = m.macro_grupos.flatMap((g) => g.categorias);
        setFilters({
          startDate: m.date_min,
          endDate: m.date_max,
          granularity: "Diária",
          macroGrupos: allGroups,
          categorias: allCategorias,
          viewLevel: "Categoria",
        });
      })
      .catch((e: unknown) => setMetaError(e instanceof Error ? e.message : String(e)));
  }, []);

  const stableDeps = filters
    ? filterDeps(filters)
    : ["", "", "", "", "", ""];
  const { data: kpis, loading: kpisLoading } = useFetch(() => (filters ? api.kpis(filters) : Promise.resolve(null)), stableDeps);
  const { data: timeseries } = useFetch(() => (filters ? api.timeseries(filters) : Promise.resolve(null)), stableDeps);

  if (metaError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-[var(--color-text-secondary)]">
        <div>
          <p className="font-medium text-[var(--color-critical)]">Não foi possível carregar os dados.</p>
          <p className="mt-1 text-sm">{metaError}</p>
          <p className="mt-3 text-xs text-[var(--color-text-muted)]">Confirme que a API está rodando (uvicorn) e que saidas/base_fato.csv existe.</p>
        </div>
      </div>
    );
  }

  if (!meta || !filters) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-[var(--color-blue)]" />
      </div>
    );
  }

  const isEmpty = !kpisLoading && kpis && kpis.current.gmv === 0 && kpis.current.pedidos === 0;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-blue)] to-[var(--color-violet)]">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Méliuz × Atlas</h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              GMV é receita do <span className="text-[var(--color-text-secondary)]">parceiro (Atlas)</span>; margem e net take são lucro da{" "}
              <span className="text-[var(--color-text-secondary)]">Méliuz</span>.
            </p>
          </div>
        </div>
      </header>

      <TopBar meta={meta} filters={filters} onChange={setFilters} />

      {isEmpty ? (
        <div className="glass flex h-40 items-center justify-center rounded-2xl text-sm text-[var(--color-text-muted)]">
          Nenhum dado para os filtros selecionados. Ajuste o período, o grupo ou a categoria acima.
        </div>
      ) : (
        <>
          <KpiRow kpis={kpis} timeseries={timeseries} />

          <CentralChartSection filters={filters} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ScatterSection filters={filters} />
            <CompareSection filters={filters} dateMin={meta.date_min} dateMax={meta.date_max} />
          </div>

          <RankingSection filters={filters} />
        </>
      )}

      <footer className="py-4 text-center text-xs text-[var(--color-text-muted)]">
        Fonte: saidas/base_fato.csv — GMV pertence ao parceiro (Atlas); margem e net take pertencem à Méliuz.
      </footer>
    </div>
  );
}
