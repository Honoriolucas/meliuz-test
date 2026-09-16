export function formatBRL(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatBRLShort(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `${sign}R$ ${(abs / 1_000).toFixed(1).replace(".", ",")} mil`;
  return `${sign}R$ ${abs.toFixed(0)}`;
}

export function formatInt(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("pt-BR");
}

export function formatPP(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v.toFixed(decimals)} pp`;
}

export function formatPct(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v.toFixed(decimals)}%`;
}

export function deltaPct(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur === null || cur === undefined || base === null || base === undefined || base === 0) return null;
  return ((cur - base) / Math.abs(base)) * 100;
}

export function deltaPP(cur: number | null | undefined, base: number | null | undefined): number | null {
  if (cur === null || cur === undefined || base === null || base === undefined) return null;
  return cur - base;
}

export function formatDateLabel(iso: string, granularity: "Diária" | "Semanal" | "Mensal"): string {
  const d = new Date(iso + "T00:00:00");
  if (granularity === "Mensal") {
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
