import type {
  FilterState,
  KpisResponse,
  Meta,
  Metrics,
  RankingRow,
  ScatterRow,
  TimeseriesMultiResponse,
  TimeseriesResponse,
} from "./types";

const BASE = "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} falhou (${res.status})`);
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} falhou (${res.status})`);
  return res.json() as Promise<T>;
}

function filtersPayload(f: FilterState) {
  return {
    start_date: f.startDate,
    end_date: f.endDate,
    granularity: f.granularity,
    macro_grupos: f.macroGrupos,
    categorias: f.categorias,
    view_level: f.viewLevel,
  };
}

export const api = {
  meta: () => get<Meta>("/meta"),
  kpis: (f: FilterState) => post<KpisResponse>("/kpis", filtersPayload(f)),
  timeseries: (f: FilterState) => post<TimeseriesResponse>("/timeseries", filtersPayload(f)),
  timeseriesMulti: (f: FilterState) => post<TimeseriesMultiResponse>("/timeseries-multi", filtersPayload(f)),
  ranking: (f: FilterState, metric: string, topN: number) =>
    post<RankingRow[]>("/ranking", { ...filtersPayload(f), metric, top_n: topN }),
  scatter: (f: FilterState, metricY: string) =>
    post<ScatterRow[]>("/scatter", { ...filtersPayload(f), metric_y: metricY }),
  compare: (a: FilterState, b: FilterState) =>
    post<{ a: Metrics; b: Metrics }>("/compare", { a: filtersPayload(a), b: filtersPayload(b) }),
};
