"""Formatação de números no padrão pt-BR para os cartões e gráficos."""
import pandas as pd


def _is_missing(value) -> bool:
    return value is None or (isinstance(value, float) and pd.isna(value))


def format_brl(value, decimals: int = 0) -> str:
    if _is_missing(value):
        return "—"
    s = f"{value:,.{decimals}f}"
    s = s.replace(",", "§").replace(".", ",").replace("§", ".")
    return f"R$ {s}"


def format_brl_short(value) -> str:
    if _is_missing(value):
        return "—"
    sign = "-" if value < 0 else ""
    v = abs(value)
    if v >= 1_000_000:
        s = f"{v / 1_000_000:.1f}".replace(".", ",") + " mi"
    elif v >= 1_000:
        s = f"{v / 1_000:.1f}".replace(".", ",") + " mil"
    else:
        s = f"{v:.0f}"
    return f"{sign}R$ {s}"


def format_int(value) -> str:
    if _is_missing(value):
        return "—"
    s = f"{value:,.0f}"
    return s.replace(",", ".")


def format_pp(value, decimals: int = 2) -> str:
    if _is_missing(value):
        return "—"
    return f"{value:.{decimals}f} pp"


def format_pct(value, decimals: int = 1) -> str:
    if _is_missing(value):
        return "—"
    return f"{value:.{decimals}f}%"
