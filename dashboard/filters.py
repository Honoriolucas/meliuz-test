"""Barra de filtros em popovers (clique para abrir) no topo da página: período,
granularidade, macro_grupo, categoria e nível de visão."""
import pandas as pd
import streamlit as st

GRANULARITIES = ["Diária", "Semanal", "Mensal"]


def _build_presets(df: pd.DataFrame) -> dict:
    dmin, dmax = df["data"].min(), df["data"].max()
    presets = {"Período completo": (dmin, dmax)}

    for am in sorted(df["ano_mes"].unique()):
        start = pd.Timestamp(f"{am}-01")
        end = start + pd.offsets.MonthEnd(0)
        presets[f"Mês: {am}"] = (max(start, dmin), min(end, dmax))

    for q in sorted(df["data"].dt.to_period("Q").astype(str).unique()):
        period = pd.Period(q, freq="Q")
        presets[f"Trimestre: {q}"] = (max(period.start_time, dmin), min(period.end_time.normalize(), dmax))

    for yr in sorted(df["data"].dt.year.unique()):
        start, end = pd.Timestamp(f"{yr}-01-01"), pd.Timestamp(f"{yr}-12-31")
        presets[f"Ano: {yr}"] = (max(start, dmin), min(end, dmax))

    return presets


def render_filters(df: pd.DataFrame) -> dict:
    dmin, dmax = df["data"].min().date(), df["data"].max().date()
    presets = _build_presets(df)
    preset_names = ["Personalizado"] + list(presets.keys())
    all_groups = sorted(df["macro_grupo"].astype(str).unique())

    if "macro_grupos_ms" not in st.session_state:
        st.session_state["macro_grupos_ms"] = all_groups
    else:
        st.session_state["macro_grupos_ms"] = [g for g in st.session_state["macro_grupos_ms"] if g in all_groups]

    period_choice_now = st.session_state.get("periodo_preset", "Período completo")
    granularity_now = st.session_state.get("granularidade_radio", "Diária")
    grupos_now = st.session_state["macro_grupos_ms"]
    grupo_summary = (
        "Todos" if set(grupos_now) == set(all_groups) else (f"{len(grupos_now)} de {len(all_groups)}" if grupos_now else "Nenhum")
    )

    col_period, col_gran, col_grupo, col_cat, col_view = st.columns([1.5, 1.1, 1.2, 1.3, 1.4])

    with col_period:
        with st.popover(f"📅  {period_choice_now}"):
            idx = preset_names.index(period_choice_now) if period_choice_now in preset_names else preset_names.index("Período completo")
            choice = st.selectbox("Atalho de período", preset_names, index=idx, key="periodo_preset")
            if choice == "Personalizado":
                default_range = st.session_state.get("periodo_range", (dmin, dmax))
            else:
                s, e = presets[choice]
                default_range = (s.date(), e.date())
            date_range = st.date_input("Intervalo", value=default_range, min_value=dmin, max_value=dmax, key="periodo_range")

    if isinstance(date_range, (tuple, list)) and len(date_range) == 2:
        start_date, end_date = date_range
    else:
        start_date, end_date = default_range

    with col_gran:
        with st.popover(f"⏱️  {granularity_now}"):
            granularity = st.radio("Granularidade", GRANULARITIES, index=GRANULARITIES.index(granularity_now), key="granularidade_radio")

    with col_grupo:
        with st.popover(f"🗂️  Grupo: {grupo_summary}"):
            bc1, bc2 = st.columns(2)
            if bc1.button("Selecionar todos", key="grupo_all_btn", width="stretch"):
                st.session_state["macro_grupos_ms"] = all_groups
            if bc2.button("Limpar", key="grupo_clear_btn", width="stretch"):
                st.session_state["macro_grupos_ms"] = []
            macro_grupos = st.multiselect("Macro-grupo", all_groups, key="macro_grupos_ms")

    pool = df[df["macro_grupo"].astype(str).isin(macro_grupos)] if macro_grupos else df.iloc[0:0]
    all_categorias = sorted(pool["categoria"].astype(str).unique())

    cat_key = "categorias_sel"
    if cat_key not in st.session_state:
        st.session_state[cat_key] = all_categorias
    else:
        st.session_state[cat_key] = [c for c in st.session_state[cat_key] if c in all_categorias]

    cats_now = st.session_state[cat_key]
    cat_summary = (
        "Todas" if all_categorias and set(cats_now) == set(all_categorias) else (f"{len(cats_now)} de {len(all_categorias)}" if cats_now else "Nenhuma")
    )

    with col_cat:
        with st.popover(f"🏷️  Categoria: {cat_summary}"):
            if st.button("Todas as categorias do grupo", key="cats_all_btn", width="stretch"):
                st.session_state[cat_key] = all_categorias
            categorias = st.multiselect("Categoria", all_categorias, key=cat_key)

    with col_view:
        view_level = st.radio("Visão", ["Categoria", "Grupo somado"], horizontal=True, key="view_level_radio")

    return dict(
        start_date=pd.Timestamp(start_date),
        end_date=pd.Timestamp(end_date),
        granularity=granularity,
        macro_grupos=macro_grupos,
        categorias=categorias,
        view_level=view_level,
    )
