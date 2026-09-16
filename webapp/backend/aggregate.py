"""Regras de agregação da seção 4 do PROMPT-DASHBOARD.md (mesma lógica do
dashboard Streamlit em dashboard/aggregate.py, reaproveitada aqui):

- GMV, comissao_rs, cashback_rs, margem_rs: somam-se.
- Pedidos: conta pedido_id DISTINTOS (nunca linhas).
- taxa_cashback_pct, taxa_comissao_pct, net_take_pp: nunca somar — média
  ponderada por GMV.
- Granularidade de tempo: calculada sempre a partir do nível diário.
"""
from __future__ import annotations

import pandas as pd

FREQ_MAP = {"Diária": "D", "Semanal": "W-MON", "Mensal": "MS"}

RATE_COLS = ["net_take_pp", "taxa_comissao_pct", "taxa_cashback_pct"]
MONEY_COLS = ["gmv", "comissao_rs", "cashback_rs", "margem_rs"]


def filter_df(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """`None` em macro_grupos/categorias significa "sem filtro" (usa tudo); uma
    lista - mesmo vazia - é aplicada literalmente, para que desmarcar todas as
    opções no multiselect resulte em zero linhas, não em "mostrar tudo"."""
    mask = (df["data"] >= filters["start_date"]) & (df["data"] <= filters["end_date"])
    if filters.get("macro_grupos") is not None:
        mask &= df["macro_grupo"].isin(filters["macro_grupos"])
    if filters.get("categorias") is not None:
        mask &= df["categoria"].isin(filters["categorias"])
    return df.loc[mask]


def _weighted_avg(values: pd.Series, weights: pd.Series) -> float:
    w = weights.sum()
    if w == 0:
        return float("nan")
    return float((values * weights).sum() / w)


def aggregate_metrics(df: pd.DataFrame) -> dict:
    if df.empty:
        return dict(
            gmv=0.0, comissao_rs=0.0, cashback_rs=0.0, margem_rs=0.0, pedidos=0,
            net_take_pp=float("nan"), taxa_comissao_pct=float("nan"), taxa_cashback_pct=float("nan"),
        )
    return dict(
        gmv=df["gmv"].sum(),
        comissao_rs=df["comissao_rs"].sum(),
        cashback_rs=df["cashback_rs"].sum(),
        margem_rs=df["margem_rs"].sum(),
        pedidos=df["pedido_id"].nunique(),
        net_take_pp=_weighted_avg(df["net_take_pp"], df["gmv"]),
        taxa_comissao_pct=_weighted_avg(df["taxa_comissao_pct"], df["gmv"]),
        taxa_cashback_pct=_weighted_avg(df["taxa_cashback_pct"], df["gmv"]),
    )


def aggregate_by(df: pd.DataFrame, group_cols: list[str]) -> pd.DataFrame:
    cols = group_cols + MONEY_COLS + ["pedidos"] + RATE_COLS
    if df.empty:
        return pd.DataFrame(columns=cols)
    tmp = df.copy()
    tmp["_w_net_take"] = tmp["net_take_pp"] * tmp["gmv"]
    tmp["_w_comissao_pct"] = tmp["taxa_comissao_pct"] * tmp["gmv"]
    tmp["_w_cashback_pct"] = tmp["taxa_cashback_pct"] * tmp["gmv"]
    out = tmp.groupby(group_cols, as_index=False, observed=True).agg(
        gmv=("gmv", "sum"),
        comissao_rs=("comissao_rs", "sum"),
        cashback_rs=("cashback_rs", "sum"),
        margem_rs=("margem_rs", "sum"),
        pedidos=("pedido_id", "nunique"),
        _w_net_take=("_w_net_take", "sum"),
        _w_comissao_pct=("_w_comissao_pct", "sum"),
        _w_cashback_pct=("_w_cashback_pct", "sum"),
    )
    safe_gmv = out["gmv"].replace(0, pd.NA)
    out["net_take_pp"] = out["_w_net_take"] / safe_gmv
    out["taxa_comissao_pct"] = out["_w_comissao_pct"] / safe_gmv
    out["taxa_cashback_pct"] = out["_w_cashback_pct"] / safe_gmv
    return out.drop(columns=["_w_net_take", "_w_comissao_pct", "_w_cashback_pct"])


def time_series(df: pd.DataFrame, granularity: str, extra_group_cols: list[str] | None = None) -> pd.DataFrame:
    """Agrega no nível diário e sobe para semana/mês conforme `granularity`."""
    extra_group_cols = extra_group_cols or []
    cols = ["periodo"] + extra_group_cols + MONEY_COLS + ["pedidos"] + RATE_COLS
    if df.empty:
        return pd.DataFrame(columns=cols)

    freq = FREQ_MAP.get(granularity, "MS")
    tmp = df.copy()
    tmp["_w_net_take"] = tmp["net_take_pp"] * tmp["gmv"]
    tmp["_w_comissao_pct"] = tmp["taxa_comissao_pct"] * tmp["gmv"]
    tmp["_w_cashback_pct"] = tmp["taxa_cashback_pct"] * tmp["gmv"]

    group_cols = [pd.Grouper(key="data", freq=freq)] + extra_group_cols
    out = tmp.groupby(group_cols, observed=True).agg(
        gmv=("gmv", "sum"),
        comissao_rs=("comissao_rs", "sum"),
        cashback_rs=("cashback_rs", "sum"),
        margem_rs=("margem_rs", "sum"),
        pedidos=("pedido_id", "nunique"),
        _w_net_take=("_w_net_take", "sum"),
        _w_comissao_pct=("_w_comissao_pct", "sum"),
        _w_cashback_pct=("_w_cashback_pct", "sum"),
    ).reset_index()
    out = out.rename(columns={"data": "periodo"})

    safe_gmv = out["gmv"].replace(0, pd.NA)
    out["net_take_pp"] = out["_w_net_take"] / safe_gmv
    out["taxa_comissao_pct"] = out["_w_comissao_pct"] / safe_gmv
    out["taxa_cashback_pct"] = out["_w_cashback_pct"] / safe_gmv
    out = out.drop(columns=["_w_net_take", "_w_comissao_pct", "_w_cashback_pct"])
    return out.sort_values("periodo")
