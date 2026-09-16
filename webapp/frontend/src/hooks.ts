import { useEffect, useRef, useState } from "react";
import type { FilterState } from "./types";

/** Deps estáveis (primitivos) para useEffect/useFetch a partir do FilterState —
 * evita refetch em todo render por causa de arrays com nova referência. */
export function filterDeps(f: FilterState): unknown[] {
  return [f.startDate, f.endDate, f.granularity, f.macroGrupos.join("|"), f.categorias.join("|"), f.viewLevel];
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Busca dados via `fn`, re-executando quando algo em `deps` muda. Ignora
 * respostas que chegam depois que os deps já mudaram de novo (evita race). */
export function useFetch<T>(fn: () => Promise<T>, deps: unknown[]): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (requestId.current === id) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (requestId.current === id) {
          setState({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
