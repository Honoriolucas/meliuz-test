# Tarefa: construir um dashboard analítico (nível Power BI) para um case de Inteligência Comercial

Você vai construir uma aplicação de dashboard interativa, rodando em localhost, para eu **explorar** dados de uma parceria comercial e tomar decisões. O foco é análise visual rica, com filtros dinâmicos. Este dashboard é minha ferramenta de exploração — não é a entrega final, então priorize funcionalidade analítica e clareza sobre qualquer outra coisa.

Leia este documento inteiro antes de começar. A lógica de negócio abaixo é obrigatória: os números precisam sair exatamente como descrito, senão o dashboard fica bonito e errado.

---

## 1. Contexto do negócio (leia com atenção — isto define os cálculos)

A empresa (Méliuz) é uma plataforma de cashback. Um usuário sai dela e compra num marketplace parceiro (Atlas). O fluxo de dinheiro:

1. Usuário compra no Atlas → gera **GMV** (valor da compra em reais).
2. O Atlas paga à Méliuz uma **comissão** (% do GMV).
3. A Méliuz devolve parte ao usuário como **cashback** (% do GMV).
4. O que sobra é a **margem** da Méliuz.

Definições exatas das métricas:

- `net_take_pp` = `taxa_comissao_pct − taxa_cashback_pct`  (em pontos percentuais)
- `comissao_rs` = `gmv × taxa_comissao_pct / 100`
- `cashback_rs` = `gmv × taxa_cashback_pct / 100`
- `margem_rs`   = `comissao_rs − cashback_rs`

**Importante — natureza das métricas:**
- `gmv`, `taxa_comissao_pct`, `taxa_cashback_pct` são **primárias** (vêm direto dos dados).
- `net_take`, `comissao_rs`, `cashback_rs`, `margem_rs` são **secundárias** (calculadas).
- O **cashback %** é um input definido pelo parceiro. Quando ele sobe o cashback de uma categoria por alguns dias, isso é uma **campanha**. Portanto, campanha = salto temporário no `taxa_cashback_pct` de uma categoria. O dashboard deve permitir enxergar esses saltos.

**Importante — a quem pertence cada número:**
- `gmv` = receita de venda do **parceiro (Atlas)**.
- `comissao_rs` = custo do Atlas / receita da Méliuz.
- `margem_rs` e `net_take` = lucro da **Méliuz** (NÃO é o lucro do Atlas — não temos o custo de produto do Atlas).
- Deixe claro nos rótulos quando uma métrica é "da Méliuz" (margem, net take) vs "do parceiro" (GMV).

**Importante — o que NÃO usar no cálculo de dinheiro:**
- A coluna `itens` (quantidade) **não entra** em nenhum cálculo de faturamento. O GMV já é o valor final em reais da linha. `itens` só pode ser usada, se quiser, para métricas auxiliares (ex: ticket médio), nunca para compor GMV ou margem.

---

## 2. Os dados

Duas fontes na pasta `dados/`:

### `dados/pedidos.csv` — as compras (nível de linha, ~463 mil linhas)
| coluna | descrição |
|---|---|
| `pedido_id` | ID do pedido. Um pedido pode ocupar VÁRIAS linhas (categorias diferentes no mesmo pedido). |
| `data` | data da compra (AAAA-MM-DD) |
| `categoria` | código anonimizado da categoria (`CAT-01` … `CAT-49`) |
| `macro_grupo` | agrupamento da categoria (ex: "Casa & Construção", "Infantil", "Eletro & Tech") |
| `itens` | quantidade de itens (NÃO usar em cálculo de dinheiro) |
| `gmv` | valor da compra em reais |

### `dados/taxas_vigentes.csv` — condições comerciais por dia e categoria (~19 mil linhas)
| coluna | descrição |
|---|---|
| `data` | data (AAAA-MM-DD) |
| `categoria` | código da categoria |
| `taxa_comissao_pct` | comissão paga pelo parceiro naquele dia/categoria, em % |
| `taxa_cashback_pct` | cashback oferecido naquele dia/categoria, em % |

### Já existe uma base pronta: `saidas/base_fato.csv`
Esta é a base já cruzada e com as métricas calculadas (fonte da verdade). Ela é o merge de `pedidos` + `taxas_vigentes` pela chave `(data, categoria)`, com as colunas `comissao_rs`, `cashback_rs`, `net_take_pp`, `margem_rs` e `ano_mes` já adicionadas. **Prefira usar `saidas/base_fato.csv` como fonte principal do dashboard** — ela já tem tudo calculado no nível de linha. Se ela não existir ou você quiser reconstruir, refaça o merge exatamente pelas fórmulas da seção 1.

Período coberto: **agosto/2025 a agosto/2026** (13 meses). A base é limpa: sem vendas sem taxa correspondente, sem taxas duplicadas, sem GMV nulo/negativo. 49 categorias, cada uma pertence a exatamente um macro_grupo.

---

## 3. Hierarquia (crítica para os filtros)

Existem DOIS níveis:
- **macro_grupo** (o balde grande): ex "Casa & Construção", "Infantil", "Eletro & Tech".
- **categoria** (o item específico dentro do grupo): ex `CAT-09`, `CAT-03`.

Cada macro_grupo contém várias categorias. A análise mais importante acontece no nível de **categoria**, mas eu preciso poder subir para o nível de **grupo** e descer de volta. O dashboard precisa permitir:
- filtrar por um ou vários macro_grupos;
- dentro do grupo escolhido, filtrar por uma ou várias categorias;
- ver o grupo somado (todas as categorias juntas) OU categoria por categoria;
- um botão "selecionar todas as categorias do grupo".

---

## 4. Como agregar (a lógica dos números)

- **GMV, comissao_rs, cashback_rs, margem_rs**: são valores em reais → **somam-se** (por dia, por mês, por categoria, por grupo).
- **Número de pedidos**: contar `pedido_id` **DISTINTOS** (não contar linhas — um pedido ocupa várias linhas).
- **taxa_cashback_pct, taxa_comissao_pct, net_take_pp**: são percentuais/taxas → **NÃO somar**. Ao agregar no tempo, use média (idealmente média ponderada pelo GMV, quando fizer sentido) ou mostre a taxa vigente do dia. Deixe claro no rótulo qual foi usada.
- **Granularidade de tempo**: permitir alternar entre **diária**, **semanal** e **mensal**. A série é calculada no nível diário e agregada para cima conforme a escolha.

---

## 5. O que o dashboard precisa ter (layout e componentes)

Inspiração: um relatório executivo de Power BI — cartões de KPI no topo (visão macro), gráficos detalhados embaixo (visão micro), painel de filtros lateral ou no topo. Visual moderno, espaçoso, tema escuro elegante (fundo escuro, acentos em cores vivas mas harmônicas), tipografia clara. NÃO quero apenas gráficos de linha x/y — quero variedade de visualizações.

### Barra de filtros (sempre visível, afeta o dashboard todo)
- Seletor de **período** (intervalo de datas, com atalhos: mês específico, trimestre, ano inteiro).
- Seletor de **granularidade**: diária / semanal / mensal.
- Filtro de **macro_grupo** (múltipla escolha).
- Filtro de **categoria** (múltipla escolha, filtrado pelo grupo selecionado) + botão "todas do grupo".
- Toggle "ver por categoria" vs "ver grupo somado".

### Topo — cartões de KPI (macro, respondem aos filtros)
Grandes, com o número e uma comparação (ex: vs mês anterior, vs mesmo mês do ano anterior — a comparação é essencial, número solto não diz nada):
- GMV total
- Nº de pedidos (distintos)
- Comissão total (R$)
- Cashback total (R$)
- Margem total (R$) — Méliuz
- Net take médio (pp)

### Meio e base — gráficos (respondem aos filtros)
Quero variedade, incluindo pelo menos:
1. **Série temporal multi-métrica**: linha do tempo (dia/semana/mês) mostrando GMV e margem juntos, para ver o descolamento entre venda e lucro. Cashback % pode entrar como eixo secundário ou painel próprio (cuidado com escalas muito diferentes — não achatar uma métrica).
2. **Barras — ranking de categorias**: top categorias por GMV e por margem (poder ordenar por qualquer métrica). Serve para ver quem puxa faturamento vs quem puxa lucro.
3. **Barras empilhadas ou 100%**: composição do GMV (ou margem) por macro_grupo ao longo do tempo.
4. **Pizza/rosca**: participação de cada macro_grupo no GMV / na margem do período filtrado.
5. **Visão de campanha**: um gráfico que mostre, para a(s) categoria(s) selecionada(s), o `taxa_cashback_pct` diário ao longo do tempo, de modo que os saltos (campanhas) fiquem visíveis. Idealmente sobreposto/alinhado com o GMV e a margem no mesmo período, para eu ver o efeito da campanha.
6. **Scatter / dispersão**: cada categoria como um ponto, eixo X = GMV, eixo Y = net take médio (ou margem), tamanho = pedidos. Serve para ver quem vende muito com boa margem vs quem vende muito com margem ruim.

Todos os gráficos com tooltip mostrando valores exatos ao passar o mouse. Todos devem reagir aos filtros da barra.

### Extra desejável (se viável)
- Comparação lado a lado de dois períodos (ex: agosto/2026 vs agosto/2025).
- Destaque visual automático de períodos com campanha ativa (quando o cashback de uma categoria estiver acima do seu nível normal — pode usar a mediana da própria categoria como referência de "normal").
- Poder exportar/baixar um gráfico como imagem (vou usar alguns na apresentação final).

---

## 6. Stack técnica (sugestão — decida o que for mais robusto)

- Python. Sugiro **Streamlit** ou **Dash (Plotly)** pela rapidez de montar dashboards analíticos com filtros. Se preferir um front-end mais rico (React + biblioteca de gráficos), tudo bem, desde que rode local e leia os CSVs.
- Já existe um ambiente virtual `venv/` no projeto e um `requirements.txt`. Adicione as dependências novas ao `requirements.txt`.
- O dashboard deve **carregar os dados de `saidas/base_fato.csv`** (ou reconstruir a partir de `dados/*.csv` se necessário). Não hardcode nenhum número — tudo vem dos dados.
- Deixe o comando de execução claro no final (ex: `streamlit run app.py`), e me diga exatamente o que rodar.

## 7. Estrutura de pastas atual do projeto
```
case-meliuz/
├── dados/
│   ├── pedidos.csv
│   └── taxas_vigentes.csv
├── notebooks/
│   └── analise.ipynb          (a análise exploratória já feita)
├── saidas/
│   ├── base_fato.csv          (base já cruzada e calculada — USE ESTA)
│   ├── tabelas/
│   └── graficos/
├── venv/
└── requirements.txt
```
Coloque o código do dashboard numa pasta nova, ex `dashboard/`, sem bagunçar o resto.

## 8. Prioridades (nesta ordem)
1. **Corretude dos números** (siga as fórmulas e regras de agregação da seção 1 e 4 à risca).
2. **Filtros dinâmicos funcionando** (grupo, categoria, período, granularidade) afetando tudo.
3. **Riqueza analítica** (variedade de gráficos da seção 5).
4. **Visual bonito** (tema escuro, moderno, espaçoso).

Antes de escrever muito código, me mostre um plano curto: qual stack você vai usar, a estrutura de arquivos do dashboard, e como vai organizar os filtros e componentes. Depois construa. Se algo nos dados não bater com o que descrevi, me avise em vez de improvisar.