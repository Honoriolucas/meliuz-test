import { CreditCard, Gift, Percent, Receipt, ShoppingCart, Wallet } from "lucide-react";
import { deltaPP, deltaPct, formatBRL, formatInt, formatPP } from "../format";
import { KPI_GRADIENTS } from "../theme";
import type { KpisResponse, TimeseriesResponse } from "../types";
import { KpiCard } from "./KpiCard";

interface KpiRowProps {
  kpis: KpisResponse | null;
  timeseries: TimeseriesResponse | null;
}

export function KpiRow({ kpis, timeseries }: KpiRowProps) {
  const cur = kpis?.current;
  const prev = kpis?.prev ?? null;
  const yoy = kpis?.yoy ?? null;

  type NumericField = "gmv" | "comissao_rs" | "cashback_rs" | "margem_rs" | "pedidos" | "net_take_pp";
  const spark = (key: NumericField): number[] => {
    const arr = timeseries?.[key] ?? [];
    return arr.map((v) => v ?? 0);
  };

  const cards = [
    {
      title: "GMV total (parceiro)",
      value: formatBRL(cur?.gmv),
      deltaPct: deltaPct(cur?.gmv, prev?.gmv),
      yoyPct: deltaPct(cur?.gmv, yoy?.gmv),
      spark: spark("gmv"),
      icon: ShoppingCart,
    },
    {
      title: "Nº de pedidos",
      value: formatInt(cur?.pedidos),
      deltaPct: deltaPct(cur?.pedidos, prev?.pedidos),
      yoyPct: deltaPct(cur?.pedidos, yoy?.pedidos),
      spark: spark("pedidos"),
      icon: Receipt,
    },
    {
      title: "Comissão total",
      value: formatBRL(cur?.comissao_rs),
      deltaPct: deltaPct(cur?.comissao_rs, prev?.comissao_rs),
      yoyPct: deltaPct(cur?.comissao_rs, yoy?.comissao_rs),
      spark: spark("comissao_rs"),
      icon: CreditCard,
    },
    {
      title: "Cashback total",
      value: formatBRL(cur?.cashback_rs),
      deltaPct: deltaPct(cur?.cashback_rs, prev?.cashback_rs),
      yoyPct: deltaPct(cur?.cashback_rs, yoy?.cashback_rs),
      spark: spark("cashback_rs"),
      icon: Gift,
    },
    {
      title: "Margem total (Méliuz)",
      value: formatBRL(cur?.margem_rs),
      deltaPct: deltaPct(cur?.margem_rs, prev?.margem_rs),
      yoyPct: deltaPct(cur?.margem_rs, yoy?.margem_rs),
      spark: spark("margem_rs"),
      icon: Wallet,
    },
    {
      title: "Net take médio (Méliuz)",
      value: formatPP(cur?.net_take_pp),
      deltaPP: deltaPP(cur?.net_take_pp, prev?.net_take_pp),
      yoyPP: deltaPP(cur?.net_take_pp, yoy?.net_take_pp),
      spark: spark("net_take_pp"),
      icon: Percent,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((c, i) => {
        const usesPP = "deltaPP" in c;
        const deltaVal = usesPP ? c.deltaPP : c.deltaPct;
        const yoyVal = usesPP ? c.yoyPP : c.yoyPct;
        const deltaLabel = deltaVal === null || deltaVal === undefined ? null : usesPP ? `${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(2)} pp` : `${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(1)}%`;
        const helpText =
          yoyVal === null || yoyVal === undefined
            ? "sem dado comparável no ano anterior"
            : `vs mesmo período ano anterior: ${yoyVal >= 0 ? "+" : ""}${yoyVal.toFixed(usesPP ? 2 : 1)}${usesPP ? " pp" : "%"}`;
        return (
          <KpiCard
            key={c.title}
            title={c.title}
            value={c.value}
            deltaLabel={deltaLabel}
            deltaPositive={deltaVal === null || deltaVal === undefined ? null : deltaVal >= 0}
            helpText={helpText}
            sparkData={c.spark}
            gradient={KPI_GRADIENTS[i % KPI_GRADIENTS.length]}
            icon={c.icon}
          />
        );
      })}
    </div>
  );
}
