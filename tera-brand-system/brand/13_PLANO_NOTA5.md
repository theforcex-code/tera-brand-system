# TÉRA — Plano Nota 5 (remediação da auditoria)

> Objetivo: levar o scorecard da auditoria (10_AUDITORIA.md) de **14/30 para 30/30** — "pronto para ir a público" em todas as dimensões. Régua: cada item vira nota 5 quando existe artefato pronto, decisão recomendada por escrito e, onde couber, substanciação com fonte real. Itens que dependem formalmente do cliente ficam **prontos-para-assinatura** (o máximo que prontidão pré-validação permite).

## Estado → Alvo

| Dimensão | Nota | Alvo | Alavanca |
|---|---|---|---|
| 1. Posicionamento | 3/5 | 5/5 | Statement decidido + definição canônica da categoria em 3 tamanhos |
| 2. Identidade Visual | 2/5 | 5/5 | Sistema completo gerado (lockups, clear space, mínimos, coassinatura) + dossiê 32K |
| 3. Mensagem | 2/5 | 5/5 | Política do termo-ponte decretada + tagline escolhida + boilerplate |
| 4. Voz & Tom | 2/5 | 5/5 | Kit verbal da Fase 1 escrito (OOH, bios, release, Q&A) |
| 5. Audiência | 2/5 | 5/5 | Público de entrada priorizado + dados públicos de referência |
| 6. Diferenciação | 3/5 | 5/5 | Mapa competitivo com dados reais + dossiê de proteção do nome |

## Workstreams

### WS-A · Decisões verbais (local) → D1, D3
1. **Statement de posicionamento final** (1 frase, ativos amarrados) — pronto p/ validação.
2. **Definição canônica de "espetáculo multidimensional" em 3 tamanhos:** 5s/OOH (≤ 12 palavras), bio (≤ 25), release (≤ 60). Mata o academicismo do slide 05.
3. **Decisão categoria-assina:** "Espetáculos multidimensionais." como assinatura institucional; "Habite outros mundos." como linha de campanha.
4. **Política do termo-ponte (decreto):** "immersive room"/"sala imersiva" banidos como autodescrição; permitidos só como contraste. Inclui a correção a solicitar no deck do cliente (legenda slide 03).
5. **Boilerplate institucional** (100 palavras) + versão EN.
→ Artefato: `14_DECISOES_VERBAIS.md`

### WS-B · Sistema visual completo (local, código) → D2
1. Gerar via `wordmark_arcos.py` (estendido): **lockup com descritor**, **clear space** (unidade = diâmetro do arco), **tamanhos mínimos**, **coassinatura Mata ↔ Téra** (modelo endossado: Téra protagonista, "por Mata São Paulo" em mono), monograma t como favicon/avatar.
2. **Regra de convivência com o plasma da Mata:** plasma = linguagem do evento Reveal; identidade permanente = sistema próprio (subsolo/cal/bioluminescência). Codificar no guidelines.
3. **Arquitetura de marca decidida (recomendação): endossada.** Regra de quem assina o quê por peça/fase.
→ Artefatos: SVGs/PNGs em `brand/logo/` + `15_SISTEMA_VISUAL.md` + atualização do 09_GUIDELINES.

### WS-C · Substanciação técnica (pesquisa web) → D2, D6
1. **Dossiê 32K:** levantar os maiores painéis de LED indoor da América Latina com fontes; formular a alegação defensável (maior em quê: área? resolução?) + fallback prudente se não substanciável.
2. **Requisição de spec do painel** ao cliente (documento pronto: o que precisamos, por quê, formato) + política provisória (sistema proporção-agnóstico, placeholder 32:9).
→ Artefato: `16_DOSSIE_32K.md`

### WS-D · Proteção do nome (pesquisa web + checagens) → D6
1. INPI: busca de anterioridade "Téra"/"Tera" nas classes 41 (entretenimento/cultura) e 43.
2. Domínio: status de tera.art.br e alternativas; DNS/whois.
3. Handles: disponibilidade @tera.sp e variações (Instagram/TikTok/X/YouTube).
4. Colisão "Terra": análise de SERP e recomendação de mitigação (grafia acentuada + descritor + SEO de categoria).
→ Artefato: `17_PROTECAO_NOME.md`

### WS-E · Concorrência com dados (pesquisa web) → D6
Validar/aprofundar o mapa da R1 com dados reais: MIS Experience, exposições imersivas itinerantes no Brasil, teamLab (planos LATAM?), Sphere, salas/arenas com LED gigante na América Latina, instituições culturais SP. Preço médio, público/ano quando público, posicionamento declarado.
→ Artefato: `18_CONCORRENCIA_DADOS.md`

### WS-F · Audiência priorizada (pesquisa web + decisão) → D5
1. Dados públicos do mercado cultural SP (público de museus/experiências imersivas: MIS, Pinacoteca, CCBB, Japan House; bilheteria de imersivos no Brasil).
2. **Decisão de público de entrada da Fase 1** (recomendação: o público cultural-criativo — a Marina — porque é quem funda vocabulário; tech e institucional entram nas Fases 2–3 pelas suas portas).
3. Roteiro de validação com o cliente (10 perguntas).
→ Artefato: `19_AUDIENCIA_DADOS.md`

### WS-G · Re-auditoria (loop)
Rodar a skill `brand-audit` de novo com TODO o material (briefing + 00–19). Critério de parada: **todas as dimensões 5/5**, com pendências exclusivamente de assinatura do cliente listadas em separado. Se alguma dimensão < 5: corrigir o gap apontado e repetir.

## Pendências que só o cliente fecha (ficam "prontas-para-assinatura")
- Validação formal do statement, tagline e arquitetura de marca (docs prontos).
- Spec real do painel (requisição pronta).
- Registro INPI (a busca de anterioridade nós fazemos; o depósito é ato do cliente).
- Dados internos de audiência/concorrência (roteiro de validação pronto).
