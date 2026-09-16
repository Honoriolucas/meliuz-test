"""Tema visual escuro compartilhado por todos os gráficos Plotly do dashboard.

Paleta e regras vêm da skill de dataviz (references/palette.md e color-formula.md):
oito hues categóricas em ordem fixa (nunca cicladas), fundo/tinta pensados para
superfície escura, e nunca eixo duplo (duas escalas -> dois painéis, ou indexação
a uma base comum).
"""
import plotly.graph_objects as go
import plotly.io as pio

SURFACE = "#1a1a19"
PAGE = "#0d0d0d"
TEXT_PRIMARY = "#ffffff"
TEXT_SECONDARY = "#c3c2b7"
TEXT_MUTED = "#898781"
GRIDLINE = "#2c2c2a"
BASELINE = "#383835"
BORDER = "rgba(255,255,255,0.10)"

CATEGORICAL = [
    "#3987e5",  # 1 blue
    "#d95926",  # 2 orange
    "#199e70",  # 3 aqua
    "#c98500",  # 4 yellow
    "#d55181",  # 5 magenta
    "#008300",  # 6 green
    "#9085e9",  # 7 violet
    "#e66767",  # 8 red
]
BLUE = CATEGORICAL[0]
ORANGE = CATEGORICAL[1]
RED = "#e66767"
GOOD = "#0ca30c"
WARNING = "#fab219"
OTHER_GRAY = "#5a5a57"

FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', sans-serif"


def register_template() -> None:
    template = go.layout.Template(
        layout=go.Layout(
            paper_bgcolor=SURFACE,
            plot_bgcolor=SURFACE,
            font=dict(family=FONT_FAMILY, color=TEXT_SECONDARY, size=13),
            title=dict(font=dict(color=TEXT_PRIMARY, size=16), x=0.01, xanchor="left"),
            colorway=CATEGORICAL,
            legend=dict(
                bgcolor="rgba(0,0,0,0)",
                font=dict(color=TEXT_SECONDARY),
                orientation="h",
                yanchor="bottom",
                y=1.02,
                xanchor="left",
                x=0,
            ),
            hoverlabel=dict(bgcolor=SURFACE, bordercolor=BORDER, font=dict(color=TEXT_PRIMARY, family=FONT_FAMILY)),
            xaxis=dict(
                gridcolor=GRIDLINE, zeroline=False, linecolor=BASELINE,
                tickfont=dict(color=TEXT_MUTED), title=dict(font=dict(color=TEXT_MUTED)),
            ),
            yaxis=dict(
                gridcolor=GRIDLINE, zeroline=False, linecolor=BASELINE,
                tickfont=dict(color=TEXT_MUTED), title=dict(font=dict(color=TEXT_MUTED)),
            ),
            margin=dict(l=10, r=10, t=60, b=10),
        )
    )
    pio.templates["meliuz_dark"] = template
    pio.templates.default = "meliuz_dark"


register_template()
