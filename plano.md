# Plano de Ataque — Case Méliuz (Inteligência Comercial)

> Base: 2 CSVs (`pedidos.csv`, `taxas_vigentes.csv`), 13 meses (ago/25 a ago/26), ~400k linhas.
> Entrega: 1 PDF — Parte 1 (resultados ago/26, até 10 pág) + Parte 2 (executivo, até 5 pág).
> Ordem de dependência: 0 → 1 → 2 → 3 → 4 → 5 → 6, sem pular.

---

## FASE 0 — Setup
- [ ] Subir os dois CSVs
- [ ] Carregar em pandas e conferir tipos (data = data, taxas = número, gmv = número)

## FASE 1 — Python: base fato (fonte da verdade)
- [ ] Merge `pedidos` + `taxas_vigentes` pela chave (data + categoria)
- [ ] Criar colunas de dinheiro: `comissao_rs`, `cashback_rs`, `net_take_pp`, `margem_rs`
- [ ] Criar colunas de tempo: `ano_mes` (+ flag dia útil/fim de semana se precisar)
- [ ] Salvar base fato enriquecida (não mexer mais nela)

## FASE 2 — Python: detectar campanhas (campanha = salto de cashback)
- [ ] Montar série diária de `taxa_cashback_pct` por categoria
- [ ] Definir cashback "normal" (baseline) de cada categoria
- [ ] Marcar dias de campanha (cashback acima do baseline) com início e fim
- [ ] Gerar tabela: categoria | data_início | data_fim | cashback_normal | cashback_campanha

## FASE 3 — Python: tabelas agregadas
- [ ] Mensal geral (13 linhas) → Parte 1
- [ ] Mensal × macro_grupo → o que subiu/caiu por família
- [ ] Mensal × categoria → onde as campanhas aparecem
- [ ] Diária × categoria → janela fina das campanhas e eixo de tempo
- [ ] Em todas: GMV, pedidos (id DISTINTOS), comissão, cashback, margem, net take

## FASE 4 — Python: análise das 3 perguntas
- [ ] **P1** — campanha set/25 (casa/cozinha/construção): venda subiu vs margem; quanto de net take a campanha comeu
- [ ] **P2** — out/25 infantil (Dia das Crianças): campanha vs sazonalidade, com categoria-controle + baseline
- [ ] **P3** — verba Q4/26: ranking de eficiência (margem extra por R$ de cashback) → proposta categoria + momento + intensidade

## FASE 5 — Geração dos gráficos
- [ ] Parte 1: séries mensais (GMV, margem, net take) + comparativos julho e ago/25
- [ ] Campanhas: diário com janela marcada; linha campanha vs controle
- [ ] Recomendação Q4: onde alocar a verba
- [ ] Padronizar visual (cores, títulos que afirmam algo)

## FASE 6 — Montagem do PDF final
- [ ] Parte 1 (até 10 pág) — time operacional Atlas
- [ ] Parte 2 (até 5 pág) — executivo, termina na recomendação Q4
- [ ] Anexar materiais de apoio (código + planilhas)

---

### Notas de atenção
- Contar pedidos = `pedido_id` DISTINTOS, nunca somar linhas.
- Campanha e data comemorativa acontecem juntas → estimar FAIXA de cada efeito, não valor cirúrgico.
- GMV subir ≠ margem subir. Sempre cruzar as duas.
- Toda venda precisa achar sua taxa no merge (checar linhas órfãs).