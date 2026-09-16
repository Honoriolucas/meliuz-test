export type Granularity = "Diária" | "Semanal" | "Mensal";
export type ViewLevel = "Categoria" | "Grupo somado";

export interface MacroGrupo {
  nome: string;
  categorias: string[];
}

export interface Meta {
  date_min: string;
  date_max: string;
  macro_grupos: MacroGrupo[];
  ano_mes: string[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  granularity: Granularity;
  macroGrupos: string[];
  categorias: string[];
  viewLevel: ViewLevel;
}

export interface Metrics {
  gmv: number;
  comissao_rs: number;
  cashback_rs: number;
  margem_rs: number;
  pedidos: number;
  net_take_pp: number | null;
  taxa_comissao_pct: number | null;
  taxa_cashback_pct: number | null;
}

export interface KpisResponse {
  current: Metrics;
  prev: Metrics | null;
  yoy: Metrics | null;
}

export interface TimeseriesResponse {
  periodo: string[];
  gmv?: number[];
  comissao_rs?: number[];
  cashback_rs?: number[];
  margem_rs?: number[];
  pedidos?: number[];
  net_take_pp?: (number | null)[];
  taxa_cashback_pct?: (number | null)[];
}

export interface RankingRow {
  label: string;
  value: number;
}

export interface MultiSeriesRow {
  name: string;
  cashback_pct: (number | null)[];
  gmv: (number | null)[];
  margem_rs: (number | null)[];
}

export interface TimeseriesMultiResponse {
  periodo: string[];
  series: MultiSeriesRow[];
  truncated: boolean;
  total_groups: number;
}

export interface ScatterRow {
  label: string;
  sublabel: string;
  gmv: number;
  value: number;
  pedidos: number;
}

export type MoneyMetric = "gmv" | "margem_rs" | "comissao_rs" | "cashback_rs";

export const METRIC_LABELS: Record<MoneyMetric, string> = {
  gmv: "GMV",
  margem_rs: "Margem",
  comissao_rs: "Comissão",
  cashback_rs: "Cashback",
};
