"""Cálculo e renderização dos 6 cartões de KPI, com comparação vs período
anterior de mesma duração e vs mesmo período do ano anterior (YoY)."""
import pandas as pd
import streamlit as st

from aggregate import aggregate_metrics, filter_df
from formatting import format_brl, format_int, format_pp


def _shift_period(start: pd.Timestamp, end: pd.Timestamp, mode: str):
    length = end - start
    if mode == "prev":
        new_end = start - pd.Timedelta(days=1)
        new_start = new_end - length
    elif mode == "yoy":
        new_start = start - pd.DateOffset(years=1)
        new_end = end - pd.DateOffset(years=1)
    else:
        raise ValueError(mode)
    return new_start, new_end


def compute_kpis(df_all: pd.DataFrame, df_filtered: pd.DataFrame, filters: dict) -> dict:
    current = aggregate_metrics(df_filtered)

    def _metrics_for(mode: str):
        s, e = _shift_period(filters["start_date"], filters["end_date"], mode)
        sliced = filter_df(df_all, {**filters, "start_date": s, "end_date": e})
        if sliced.empty:
            return None
        return aggregate_metrics(sliced)

    return dict(current=current, prev=_metrics_for("prev"), yoy=_metrics_for("yoy"))


def _delta_str(cur, base, fmt: str = "pct"):
    if base is None or cur is None:
        return None
    if isinstance(cur, float) and pd.isna(cur):
        return None
    if isinstance(base, float) and pd.isna(base):
        return None
    if fmt == "pct":
        if base == 0:
            return None
        return f"{(cur - base) / abs(base) * 100:+.1f}%"
    if fmt == "pp":
        return f"{cur - base:+.2f} pp"
    return None


def render_kpi_row(kpis: dict) -> None:
    cur, prev, yoy = kpis["current"], kpis["prev"], kpis["yoy"]

    def help_text(key: str, fmt: str = "pct"):
        d = _delta_str(cur[key], yoy[key] if yoy else None, fmt)
        return f"vs mesmo período ano anterior: {d}" if d else "sem dado comparável no ano anterior"

    cols = st.columns(6)
    cols[0].metric("GMV total", format_brl(cur["gmv"]),
                    _delta_str(cur["gmv"], prev["gmv"] if prev else None), help=help_text("gmv"))
    cols[1].metric("Nº de pedidos", format_int(cur["pedidos"]),
                    _delta_str(cur["pedidos"], prev["pedidos"] if prev else None), help=help_text("pedidos"))
    cols[2].metric("Comissão total", format_brl(cur["comissao_rs"]),
                    _delta_str(cur["comissao_rs"], prev["comissao_rs"] if prev else None), help=help_text("comissao_rs"))
    cols[3].metric("Cashback total", format_brl(cur["cashback_rs"]),
                    _delta_str(cur["cashback_rs"], prev["cashback_rs"] if prev else None), help=help_text("cashback_rs"))
    cols[4].metric("Margem total (Méliuz)", format_brl(cur["margem_rs"]),
                    _delta_str(cur["margem_rs"], prev["margem_rs"] if prev else None), help=help_text("margem_rs"))
    cols[5].metric("Net take médio (Méliuz)", format_pp(cur["net_take_pp"]),
                    _delta_str(cur["net_take_pp"], prev["net_take_pp"] if prev else None, fmt="pp"),
                    help=help_text("net_take_pp", fmt="pp"))
    st.caption(
        "Comparação (delta do card) vs período anterior de mesma duração · "
        "passe o mouse sobre o card para ver a variação vs mesmo período do ano anterior (YoY)."
    )
