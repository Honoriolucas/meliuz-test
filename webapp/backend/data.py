"""Carga da base fato (em memória, carregada uma vez no start do processo)."""
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent.parent
BASE_FATO_PATH = ROOT / "saidas" / "base_fato.csv"
PEDIDOS_PATH = ROOT / "dados" / "pedidos.csv"
TAXAS_PATH = ROOT / "dados" / "taxas_vigentes.csv"

_df_cache: pd.DataFrame | None = None


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
    return _apply_formulas(df)


def load_data() -> pd.DataFrame:
    global _df_cache
    if _df_cache is not None:
        return _df_cache
    if BASE_FATO_PATH.exists():
        df = pd.read_csv(BASE_FATO_PATH, parse_dates=["data"])
        if not {"comissao_rs", "cashback_rs", "net_take_pp", "margem_rs"}.issubset(df.columns):
            df = _apply_formulas(df)
    else:
        df = _rebuild_base_fato()
    if "ano_mes" not in df.columns:
        df["ano_mes"] = df["data"].dt.strftime("%Y-%m")
    df["categoria"] = df["categoria"].astype("category")
    df["macro_grupo"] = df["macro_grupo"].astype("category")
    _df_cache = df
    return df
