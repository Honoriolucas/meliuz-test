"""Visualizações do dashboard.

Regra de ouro da skill de dataviz: nunca eixo duplo. O gráfico central usa 3
painéis empilhados com eixo de tempo compartilhado (cashback %, GMV, margem)
em vez de um único eixo — cada métrica tem escala própria, nenhuma achata a
outra, e não há indexação (valores reais em R$ e em %).

Sem detecção automática de campanha: a leitura do salto de cashback é visual,
feita pelo usuário — o código não classifica nada como "campanha".
"""
from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

import theme
from aggregate import aggregate_by, time_series

METRIC_LABELS = {
    "gmv": "GMV",
    "margem_rs": "Margem",
    "comissao_rs": "Comissão",
    "cashback_rs": "Cashback",
}

MAX_SERIES = 15  # teto de linhas no gráfico central (nunca corta "todas as categorias do grupo": maior grupo tem 13)


def _empty_fig(msg: str) -> go.Figure:
    fig = go.Figure()
    fig.add_annotation(text=msg, showarrow=False, font=dict(color=theme.TEXT_MUTED, size=14))
    fig.update_layout(height=300, xaxis=dict(visible=False), yaxis=dict(visible=False))
    return fig


# 1) Gráfico central: cashback % / GMV / margem, empilhados -----------------------

def central_chart(df: pd.DataFrame, granularity: str, view_level: str) -> tuple[go.Figure, dict]:
    group_col = "macro_grupo" if view_level == "Grupo somado" else "categoria"
    info = {"truncated": False, "total_groups": 0, "shown": 0}

    if df.empty:
        return _empty_fig("Sem dados para os filtros selecionados"), info

    totals = aggregate_by(df, [group_col]).sort_values("gmv", ascending=False)
    total_groups = len(totals)
    keep = totals[group_col].astype(str).head(MAX_SERIES).tolist()
    info["total_groups"] = total_groups
    info["truncated"] = total_groups > MAX_SERIES

    sub_df = df[df[group_col].astype(str).isin(keep)]
    ts = time_series(sub_df, granularity, extra_group_cols=[group_col])
    if ts.empty:
        return _empty_fig("Sem dados para os filtros selecionados"), info

    present = set(ts[group_col].astype(str).unique())
    ordered_groups = [g for g in keep if g in present]
    info["shown"] = len(ordered_groups)

    fig = make_subplots(
        rows=3, cols=1, shared_xaxes=True, row_heights=[0.26, 0.32, 0.42], vertical_spacing=0.05,
        subplot_titles=("Cashback % (diário)", "GMV — parceiro (R$)", "Margem — Méliuz (R$)"),
    )

    for i, g in enumerate(ordered_groups):
        color = theme.CATEGORICAL[i % len(theme.CATEGORICAL)]
        sub = ts[ts[group_col].astype(str) == g].sort_values("periodo")
        fig.add_trace(go.Scatter(
            x=sub["periodo"], y=sub["taxa_cashback_pct"], name=g, legendgroup=g, mode="lines",
            line=dict(color=color, width=1.8),
            hovertemplate=f"{g}<br>" + "%{x|%d/%m/%Y}<br>Cashback: %{y:.2f}%<extra></extra>",
        ), row=1, col=1)
        fig.add_trace(go.Scatter(
            x=sub["periodo"], y=sub["gmv"], name=g, legendgroup=g, showlegend=False, mode="lines",
            line=dict(color=color, width=1.8),
            hovertemplate=f"{g}<br>" + "%{x|%d/%m/%Y}<br>GMV: R$ %{y:,.0f}<extra></extra>",
        ), row=2, col=1)
        fig.add_trace(go.Scatter(
            x=sub["periodo"], y=sub["margem_rs"], name=g, legendgroup=g, showlegend=False, mode="lines",
            line=dict(color=color, width=1.8),
            hovertemplate=f"{g}<br>" + "%{x|%d/%m/%Y}<br>Margem: R$ %{y:,.0f}<extra></extra>",
        ), row=3, col=1)

    fig.update_yaxes(title_text="%", row=1, col=1)
    fig.update_yaxes(title_text="R$", row=2, col=1)
    fig.update_yaxes(title_text="R$", row=3, col=1)
    fig.update_layout(
        height=700, hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.04, x=0),
        margin=dict(t=60),
    )
    return fig, info


# 2) Ranking de categorias/grupos -------------------------------------------------

def ranking_categorias(df: pd.DataFrame, metric: str, top_n: int, view_level: str) -> go.Figure:
    group_col = "macro_grupo" if view_level == "Grupo somado" else "categoria"
    agg = aggregate_by(df, [group_col])
    if agg.empty:
        return _empty_fig("Sem dados para os filtros selecionados")

    agg[group_col] = agg[group_col].astype(str)
    agg = agg.sort_values(metric, ascending=False).head(top_n).sort_values(metric, ascending=True)
    colors = [theme.BLUE if v >= 0 else theme.RED for v in agg[metric]]

    fig = go.Figure(go.Bar(
        x=agg[metric], y=agg[group_col], orientation="h", marker_color=colors,
        hovertemplate="%{y}<br>" + METRIC_LABELS[metric] + ": R$ %{x:,.0f}<extra></extra>",
    ))
    fig.update_layout(
        height=max(360, 28 * len(agg)),
        title=f"Top {top_n} por {METRIC_LABELS[metric]} ({'grupo' if group_col == 'macro_grupo' else 'categoria'})",
        xaxis_title="R$", yaxis_title=None, showlegend=False,
    )
    return fig


# 3) Dispersão GMV x net take -------------------------------------------------------

def dispersao_categorias(df: pd.DataFrame, metric_y: str, view_level: str) -> go.Figure:
    if view_level == "Grupo somado":
        agg = aggregate_by(df, ["macro_grupo"])
        if agg.empty:
            return _empty_fig("Sem dados para os filtros selecionados")
        agg["label"] = agg["macro_grupo"].astype(str)
        agg["sublabel"] = ""
    else:
        agg = aggregate_by(df, ["categoria", "macro_grupo"])
        if agg.empty:
            return _empty_fig("Sem dados para os filtros selecionados")
        agg["label"] = agg["categoria"].astype(str)
        agg["sublabel"] = " · " + agg["macro_grupo"].astype(str)

    y_label = "Net take médio (pp)" if metric_y == "net_take_pp" else "Margem (R$)"
    max_pedidos = max(agg["pedidos"].max(), 1)

    fig = go.Figure(go.Scatter(
        x=agg["gmv"], y=agg[metric_y], mode="markers",
        marker=dict(
            size=agg["pedidos"], sizemode="area", sizeref=2.0 * max_pedidos / (42.0 ** 2), sizemin=6,
            color=agg[metric_y], colorscale=[[0, theme.RED], [0.5, theme.OTHER_GRAY], [1, theme.BLUE]],
            cmid=0, showscale=True,
            colorbar=dict(title=y_label, tickfont=dict(color=theme.TEXT_MUTED), title_font=dict(color=theme.TEXT_MUTED)),
            line=dict(color=theme.SURFACE, width=1),
        ),
        text=agg["label"] + agg["sublabel"],
        customdata=agg["pedidos"],
        hovertemplate="%{text}<br>GMV: R$ %{x:,.0f}<br>" + y_label + ": %{y:,.2f}<br>Pedidos: %{customdata:,.0f}<extra></extra>",
    ))
    fig.add_hline(y=0, line=dict(color=theme.TEXT_MUTED, width=1, dash="dot"))
    fig.update_layout(
        height=520, xaxis_title="GMV (R$)", yaxis_title=y_label,
        title="GMV × " + y_label + " (tamanho = pedidos)",
    )
    return fig


# Extra: comparação de dois períodos -----------------------------------------------

def comparacao_periodos(metrics_a: dict, metrics_b: dict, label_a: str, label_b: str) -> go.Figure:
    keys = ["gmv", "comissao_rs", "cashback_rs", "margem_rs"]
    fig = go.Figure()
    fig.add_trace(go.Bar(name=label_a, x=[METRIC_LABELS[k] for k in keys], y=[metrics_a[k] for k in keys],
                          marker_color=theme.BLUE,
                          hovertemplate="%{x}<br>R$ %{y:,.0f}<extra>" + label_a + "</extra>"))
    fig.add_trace(go.Bar(name=label_b, x=[METRIC_LABELS[k] for k in keys], y=[metrics_b[k] for k in keys],
                          marker_color=theme.ORANGE,
                          hovertemplate="%{x}<br>R$ %{y:,.0f}<extra>" + label_b + "</extra>"))
    fig.update_layout(barmode="group", height=380, yaxis_title="R$", title="Comparação de períodos")
    return fig
