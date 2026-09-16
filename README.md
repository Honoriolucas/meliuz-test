# Méliuz × Atlas — Inteligência Comercial

Case de análise de uma parceria de cashback: um usuário compra no marketplace parceiro
(**Atlas**), gera **GMV**, o Atlas paga **comissão** à Méliuz, a Méliuz devolve parte como
**cashback** ao usuário, e o que sobra é a **margem** da Méliuz.

```
net_take_pp = taxa_comissao_pct − taxa_cashback_pct
comissao_rs = gmv × taxa_comissao_pct / 100
cashback_rs = gmv × taxa_cashback_pct / 100
margem_rs   = comissao_rs − cashback_rs
```

`gmv` é receita do **parceiro (Atlas)**. `margem_rs` e `net_take_pp` são lucro da **Méliuz**
(não do Atlas — não há visibilidade do custo de produto do parceiro).

## 🔗 Dashboard publicado

[link do Streamlit Community Cloud aqui depois do deploy]

## Estrutura do repositório

| Pasta | O que é |
|---|---|
| `dados/` | CSVs de origem: `pedidos.csv` (linha = item de pedido) e `taxas_vigentes.csv` (taxas por dia/categoria) |
| `saidas/base_fato.csv` | Base cruzada + métricas calculadas (fonte da verdade). **Não versionada** — é recriada automaticamente na primeira execução a partir de `dados/*.csv` |
| `notebooks/analise.ipynb` | Análise exploratória |
| `dashboard/` | **App Streamlit** (versão publicada no Streamlit Community Cloud) |
| `webapp/` | Versão alternativa em React + FastAPI, com filtros em dropdown e visual mais rico — roda só localmente (Streamlit Cloud não hospeda backend FastAPI) |

## Rodando localmente

### Dashboard Streamlit (`dashboard/`)

```bash
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r dashboard/requirements.txt
streamlit run dashboard/app.py
```

Abre em `http://localhost:8501`.

### Versão React + FastAPI (`webapp/`) — opcional

```bash
# backend
pip install -r requirements.txt
cd webapp/backend && python -m uvicorn app:app --port 8000

# frontend (outro terminal)
cd webapp/frontend && npm install && npm run build
```

Com o build feito, o próprio backend em `http://localhost:8000` já serve o frontend.

## Regras de agregação

- `gmv`, `comissao_rs`, `cashback_rs`, `margem_rs`: somam-se.
- Nº de pedidos: `pedido_id` **distintos** (um pedido pode ocupar várias linhas).
- `taxa_cashback_pct`, `taxa_comissao_pct`, `net_take_pp`: nunca somam — média ponderada por GMV.
- `itens` não entra em nenhum cálculo de dinheiro.

## Deploy no Streamlit Community Cloud

1. Em [share.streamlit.io](https://share.streamlit.io), aponte para este repositório.
2. **Main file path**: `dashboard/app.py`
3. **Requirements file** (em "Advanced settings"): `dashboard/requirements.txt`

A primeira execução recria `saidas/base_fato.csv` a partir de `dados/*.csv` (leva alguns
segundos) e fica em cache pelo restante da sessão.
