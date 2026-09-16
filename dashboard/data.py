"""Carga da base fato (cacheada)."""
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent.parent
BASE_FATO_PATH = ROOT / "saidas" / "base_fato.csv"
PEDIDOS_PATH = ROOT / "dados" / "pedidos.csv"
TAXAS_PATH = ROOT / "dados" / "taxas_vigentes.csv"

DTYPES = {
    "pedido_id": "int64",
    "categoria": "category",
    "macro_grupo": "category",
    "itens": "int32",
    "gmv": "float64",
    "taxa_comissao_pct": "float64",
    "taxa_cashback_pct": "float64",
}


@st.cache_data(show_spinner="Carregando base de dados...")
def load_data() -> pd.DataFrame:
    if BASE_FATO_PATH.exists():
        df = pd.read_csv(BASE_FATO_PATH, parse_dates=["data"], dtype=DTYPES)
        # colunas calculadas podem já vir prontas; se faltar alguma, recalcula pela fórmula oficial
        if not {"comissao_rs", "cashback_rs", "net_take_pp", "margem_rs"}.issubset(df.columns):
            df = _apply_formulas(df)
    else:
        df = _rebuild_base_fato()
    if "ano_mes" not in df.columns:
        df["ano_mes"] = df["data"].dt.strftime("%Y-%m")
    return df


def _apply_formulas(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["comissao_rs"] = df["gmv"] * df["taxa_comissao_pct"] / 100
    df["cashback_rs"] = df["gmv"] * df["taxa_cashback_pct"] / 100
    df["net_take_pp"] = df["taxa_comissao_pct"] - df["taxa_cashback_pct"]
    df["margem_rs"] = df["comissao_rs"] - df["cashback_rs"]
    return df


def _rebuild_base_fato() -> pd.DataFrame:
    pedidos = pd.read_csv(PEDIDOS_PATH, parse_dates=["data"])
    taxas = pd.read_csv(TAXAS_PATH, parse_dates=["data"])
    df = pedidos.merge(taxas, on=["data", "categoria"], how="inner")
    df = _apply_formulas(df)
    return df
