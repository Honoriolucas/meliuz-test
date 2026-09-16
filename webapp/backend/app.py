"""API do dashboard Méliuz x Atlas.

Roda com: venv\\Scripts\\python -m uvicorn webapp.backend.app:app --port 8000
(ou apenas `python webapp/backend/app.py` para subir com reload desligado).
Em produção serve também o build do frontend (webapp/frontend/dist) em "/".
"""
from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from aggregate import aggregate_by, aggregate_metrics, filter_df, time_series
from data import load_data

app = FastAPI(title="Méliuz x Atlas — API do dashboard")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DF = load_data()
DATE_MIN = DF["data"].min()
DATE_MAX = DF["data"].max()

MAX_SERIES = 15  # teto de linhas no gráfico central multi-série (nunca corta "todas as categorias do grupo": maior grupo tem 13)


# ---------------------------------------------------------------- helpers --

def _num(v):
    if v is None:
        return None
    if hasattr(v, "item"):
        v = v.item()
    if isinstance(v, float) and pd.isna(v):
        return None
    return v


def _clean(d: dict) -> dict:
    return {k: _num(v) for k, v in d.items()}


def _floats(series: pd.Series) -> list:
    return [None if pd.isna(v) else float(v) for v in series]


def _ints(series: pd.Series) -> list:
    return [int(v) for v in series]


def _shift_period(start: pd.Timestamp, end: pd.Timestamp, mode: str):
    length = end - start
    if mode == "prev":
        new_end = start - pd.Timedelta(days=1)
        new_start = new_end - length
    else:
        new_start = start - pd.DateOffset(years=1)
        new_end = end - pd.DateOffset(years=1)
    return new_start, new_end


# ----------------------------------------------------------------- models --

class Filters(BaseModel):
    start_date: date
    end_date: date
    granularity: str = "Mensal"
    macro_grupos: Optional[list[str]] = None
    categorias: Optional[list[str]] = None
    view_level: str = "Categoria"

    def to_dict(self) -> dict:
        return dict(
            start_date=pd.Timestamp(self.start_date),
            end_date=pd.Timestamp(self.end_date),
            macro_grupos=self.macro_grupos,
            categorias=self.categorias,
        )


class RankingRequest(Filters):
    metric: str = "gmv"
    top_n: int = 15


class ScatterRequest(Filters):
    metric_y: str = "net_take_pp"


class CompareRequest(BaseModel):
    a: Filters
    b: Filters


# ----------------------------------------------------------------- routes --

@app.get("/api/meta")
def meta():
    grupos: dict[str, set[str]] = {}
    for grupo, cat in DF[["macro_grupo", "categoria"]].drop_duplicates().itertuples(index=False):
        grupos.setdefault(str(grupo), set()).add(str(cat))
    macro_grupos = [{"nome": g, "categorias": sorted(cats)} for g, cats in sorted(grupos.items())]
    return {
        "date_min": DATE_MIN.date().isoformat(),
        "date_max": DATE_MAX.date().isoformat(),
        "macro_grupos": macro_grupos,
        "ano_mes": sorted(DF["ano_mes"].unique().tolist()),
    }


@app.post("/api/kpis")
def kpis(f: Filters):
    base = f.to_dict()
    current = aggregate_metrics(filter_df(DF, base))

    def metrics_for(mode: str):
        s, e = _shift_period(base["start_date"], base["end_date"], mode)
        sliced = filter_df(DF, {**base, "start_date": s, "end_date": e})
        return None if sliced.empty else aggregate_metrics(sliced)

    prev, yoy = metrics_for("prev"), metrics_for("yoy")
    return {
        "current": _clean(current),
        "prev": _clean(prev) if prev else None,
        "yoy": _clean(yoy) if yoy else None,
    }


@app.post("/api/timeseries")
def timeseries(f: Filters):
    dff = filter_df(DF, f.to_dict())
    ts = time_series(dff, f.granularity)
    if ts.empty:
        return {"periodo": []}
    return {
        "periodo": ts["periodo"].dt.strftime("%Y-%m-%d").tolist(),
        "gmv": _floats(ts["gmv"]),
        "comissao_rs": _floats(ts["comissao_rs"]),
        "cashback_rs": _floats(ts["cashback_rs"]),
        "margem_rs": _floats(ts["margem_rs"]),
        "pedidos": _ints(ts["pedidos"]),
        "net_take_pp": _floats(ts["net_take_pp"]),
        "taxa_cashback_pct": _floats(ts["taxa_cashback_pct"]),
    }


@app.post("/api/ranking")
def ranking(r: RankingRequest):
    dff = filter_df(DF, r.to_dict())
    group_col = "macro_grupo" if r.view_level == "Grupo somado" else "categoria"
    agg = aggregate_by(dff, [group_col])
    if agg.empty:
        return []
    agg[group_col] = agg[group_col].astype(str)
    agg = agg.sort_values(r.metric, ascending=False).head(r.top_n)
    return [{"label": row[group_col], "value": _num(row[r.metric])} for _, row in agg.iterrows()]


@app.post("/api/timeseries-multi")
def timeseries_multi(f: Filters):
    """Série diária/semanal/mensal por categoria (ou macro-grupo, se view_level =
    'Grupo somado') — alimenta o gráfico central de cashback/GMV/margem. Sem
    indexação: valores reais em R$ e em %. Sem detecção de campanha — a leitura
    do salto de cashback é visual, feita pelo usuário."""
    dff = filter_df(DF, f.to_dict())
    group_col = "macro_grupo" if f.view_level == "Grupo somado" else "categoria"
    empty = {"periodo": [], "series": [], "truncated": False, "total_groups": 0}
    if dff.empty:
        return empty

    totals = aggregate_by(dff, [group_col]).sort_values("gmv", ascending=False)
    total_groups = len(totals)
    keep = totals[group_col].astype(str).head(MAX_SERIES).tolist()
    truncated = total_groups > MAX_SERIES

    sub_df = dff[dff[group_col].astype(str).isin(keep)]
    ts = time_series(sub_df, f.granularity, extra_group_cols=[group_col])
    if ts.empty:
        return {**empty, "truncated": truncated, "total_groups": total_groups}

    periods = sorted(ts["periodo"].unique())
    present = set(ts[group_col].astype(str).unique())
    ordered_groups = [g for g in keep if g in present]

    series = []
    for g in ordered_groups:
        sub = ts[ts[group_col].astype(str) == g].set_index("periodo").reindex(periods)
        series.append({
            "name": g,
            "cashback_pct": _floats(sub["taxa_cashback_pct"]),
            "gmv": _floats(sub["gmv"]),
            "margem_rs": _floats(sub["margem_rs"]),
        })

    return {
        "periodo": [pd.Timestamp(p).strftime("%Y-%m-%d") for p in periods],
        "series": series,
        "truncated": truncated,
        "total_groups": total_groups,
    }


@app.post("/api/scatter")
def scatter(r: ScatterRequest):
    dff = filter_df(DF, r.to_dict())
    if r.view_level == "Grupo somado":
        agg = aggregate_by(dff, ["macro_grupo"])
        if agg.empty:
            return []
        agg = agg.assign(label=agg["macro_grupo"].astype(str), sublabel="")
    else:
        agg = aggregate_by(dff, ["categoria", "macro_grupo"])
        if agg.empty:
            return []
        agg = agg.assign(label=agg["categoria"].astype(str), sublabel=agg["macro_grupo"].astype(str))
    return [
        {
            "label": row["label"],
            "sublabel": row["sublabel"],
            "gmv": _num(row["gmv"]),
            "value": _num(row[r.metric_y]),
            "pedidos": int(row["pedidos"]),
        }
        for _, row in agg.iterrows()
    ]


@app.post("/api/compare")
def compare(r: CompareRequest):
    ma = aggregate_metrics(filter_df(DF, r.a.to_dict()))
    mb = aggregate_metrics(filter_df(DF, r.b.to_dict()))
    return {"a": _clean(ma), "b": _clean(mb)}


# ------------------------------------------------------- frontend estático --

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
