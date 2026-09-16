"""Dashboard analítico Méliuz x Atlas — entrypoint Streamlit.

Rodar com: venv\\Scripts\\python -m streamlit run dashboard/app.py
"""
import pandas as pd
import streamlit as st

import theme  # noqa: F401 - registra o template escuro do Plotly ao ser importado
import charts
from aggregate import aggregate_metrics, filter_df
from data import load_data
from filters import render_filters
from formatting import format_brl
from kpis import compute_kpis, render_kpi_row

st.set_page_config(page_title="Méliuz × Atlas — Inteligência Comercial", layout="wide", page_icon="📊")

st.markdown(
    """
    <style>
    .block-container {padding-top: 1.5rem; padding-bottom: 3rem;}
    </style>
    """,
    unsafe_allow_html=True,
)

df = load_data()

st.title("Méliuz × Atlas — Painel de Inteligência Comercial")
st.caption(
    "GMV é receita de venda do **parceiro (Atlas)**. Comissão é custo do Atlas / receita da Méliuz. "
    "Margem e net take são o lucro da **Méliuz** — não o lucro do Atlas (não temos o custo de produto do parceiro)."
)

filters = render_filters(df)
df_filtered = filter_df(df, filters)

if df_filtered.empty:
    st.warning("Nenhum dado para os filtros selecionados. Ajuste o período, o grupo ou a categoria acima.")
    st.stop()

kpis = compute_kpis(df, df_filtered, filters)
render_kpi_row(kpis)

st.divider()

st.subheader("Cashback, GMV e Margem ao longo do tempo")
fig_central, info = charts.central_chart(df_filtered, filters["granularity"], filters["view_level"])
nivel = "macro-grupos" if filters["view_level"] == "Grupo somado" else "categorias"
if info["truncated"]:
    st.caption(
        f"Eixo do tempo compartilhado nos 3 painéis · mostrando as {info['shown']} {nivel} com maior GMV, "
        f"de {info['total_groups']} selecionadas — refine o filtro para focar a comparação."
    )
else:
    st.caption("Eixo do tempo compartilhado nos 3 painéis: veja o salto de cashback e desça o olho para o efeito em GMV e margem, na mesma data.")
st.plotly_chart(fig_central, width="stretch")

st.divider()

col_scatter, col_compare = st.columns(2)

with col_scatter:
    st.subheader("Dispersão: GMV × margem")
    metric_scatter = st.selectbox(
        "Eixo Y", ["net_take_pp", "margem_rs"],
        format_func=lambda k: "Net take médio (pp)" if k == "net_take_pp" else "Margem (R$)",
        key="metric_scatter",
    )
    st.plotly_chart(
        charts.dispersao_categorias(df_filtered, metric_scatter, filters["view_level"]),
        width="stretch",
    )

with col_compare:
    st.subheader("Comparar dois períodos lado a lado")
    dataset_min, dataset_max = df["data"].min().date(), df["data"].max().date()

    length = filters["end_date"] - filters["start_date"]
    natural_b_end = (filters["start_date"] - pd.Timedelta(days=1)).date()
    natural_b_start = (filters["start_date"] - pd.Timedelta(days=1) - length).date()
    if natural_b_end >= dataset_min and natural_b_start >= dataset_min:
        default_a = (filters["start_date"].date(), filters["end_date"].date())
        default_b = (natural_b_start, natural_b_end)
    else:
        # sem espaço para um período B anterior de mesmo tamanho (ex: filtro global já
        # cobre o início dos dados): compara a 1ª metade do período A com a 2ª metade
        half = max(pd.Timedelta(days=1), length // 2)
        mid = (filters["start_date"] + half).date()
        default_a = (mid, filters["end_date"].date())
        default_b = (filters["start_date"].date(), mid - pd.Timedelta(days=1))

    a_range = st.date_input("Período A", value=default_a, min_value=dataset_min, max_value=dataset_max, key="periodo_a")
    b_range = st.date_input("Período B", value=default_b, min_value=dataset_min, max_value=dataset_max, key="periodo_b")

    a_ok = isinstance(a_range, (tuple, list)) and len(a_range) == 2
    b_ok = isinstance(b_range, (tuple, list)) and len(b_range) == 2
    if a_ok and b_ok:
        fa = {**filters, "start_date": pd.Timestamp(a_range[0]), "end_date": pd.Timestamp(a_range[1])}
        fb = {**filters, "start_date": pd.Timestamp(b_range[0]), "end_date": pd.Timestamp(b_range[1])}
        metrics_a = aggregate_metrics(filter_df(df, fa))
        metrics_b = aggregate_metrics(filter_df(df, fb))
        label_a, label_b = f"A: {a_range[0]} a {a_range[1]}", f"B: {b_range[0]} a {b_range[1]}"

        st.plotly_chart(charts.comparacao_periodos(metrics_a, metrics_b, label_a, label_b), width="stretch")

        cm1, cm2, cm3 = st.columns(3)
        cm1.metric("GMV — A vs B", format_brl(metrics_a["gmv"]), format_brl(metrics_a["gmv"] - metrics_b["gmv"]))
        cm2.metric("Margem — A vs B", format_brl(metrics_a["margem_rs"]),
                   format_brl(metrics_a["margem_rs"] - metrics_b["margem_rs"]))
        net_a, net_b = metrics_a["net_take_pp"], metrics_b["net_take_pp"]
        delta_net = f"{net_a - net_b:+.2f} pp" if pd.notna(net_a) and pd.notna(net_b) else None
        cm3.metric("Net take — A vs B", f"{net_a:.2f} pp" if pd.notna(net_a) else "—", delta_net)
    else:
        st.info("Selecione um intervalo de datas completo (início e fim) para os dois períodos.")

st.divider()

st.subheader("Ranking por categoria")
c1, c2 = st.columns([2, 1])
metric_rank = c1.selectbox(
    "Ordenar por", ["gmv", "margem_rs", "comissao_rs", "cashback_rs"],
    format_func=lambda k: charts.METRIC_LABELS[k], key="metric_rank",
)
top_n = c2.slider("Top N", 5, 30, 15, key="top_n_rank")
st.plotly_chart(
    charts.ranking_categorias(df_filtered, metric_rank, top_n, filters["view_level"]),
    width="stretch",
)

st.caption("Fonte: saidas/base_fato.csv. GMV pertence ao parceiro (Atlas); margem e net take pertencem à Méliuz.")
