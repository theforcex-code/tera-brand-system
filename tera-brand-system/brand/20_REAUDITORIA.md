# TÉRA — Re-auditoria (R2)

> **Workstream WS-G do `13_PLANO_NOTA5.md`** · executada em 20/08/2026.
> **Método:** mesma skill (`brand-audit`), mesmas 6 dimensões e mesma régua da auditoria R1 (`10_AUDITORIA.md`): **prontidão pré-lançamento, 1–5, onde 5 = pronto para ir a público** (Fase 1 — Revelar, set/2026).
> **Objeto:** todo o material de marca existente — módulos 00–19 + artefatos em `brand/logo/` (SVGs verificados um a um: wordmark em dois estados, monograma, lockup com descritor, coassinatura Mata↔Téra, clear space, tamanhos mínimos — todos existem, são coerentes entre si e regeneráveis por código via `scripts/wordmark_arcos.py`).
> **Regra de avaliação (do plano):** itens que dependem formalmente do CLIENTE não derrubam a nota **se e somente se** existir artefato pronto-para-assinatura de qualidade (doc final + requisição + plano B). Esses itens estão consolidados na seção "Pendências de assinatura do cliente".

---

## SCORECARD ATUALIZADO (R1 → R2)

| Dimensão | R1 | R2 | Status |
|---|---|---|---|
| 1. Clareza de Posicionamento | 3/5 | **5/5** | 🟢 Pronto |
| 2. Identidade Visual | 2/5 | **5/5** | 🟢 Pronto |
| 3. Consistência de Mensagem | 2/5 | **5/5** | 🟢 Pronto |
| 4. Voz & Tom | 2/5 | **5/5** | 🟢 Pronto — kit de imprensa entregue (`21`), ver Verificação R2.1 |
| 5. Alinhamento com Audiência | 2/5 | **5/5** | 🟢 Pronto |
| 6. Diferenciação Competitiva | 3/5 | **5/5** | 🟢 Pronto |
| **Geral** | **14/30** | **30/30** | **🟢 Todas as dimensões 5/5; restam apenas pendências de assinatura do cliente** |

**Diagnóstico em uma frase:** a Téra saiu de "conceito raro sem plataforma" para uma plataforma de marca completa, codificada e substanciada com fontes reais — o que falta se divide em exatamente duas coisas: dois artefatos verbais da Fase 1 que o estúdio ainda deve escrever (release embargado + Q&A), e a lista de atos formais que só o cliente executa, todos já com documento pronto-para-assinatura.

---

## ANÁLISE POR DIMENSÃO

### D1 — Clareza de Posicionamento: 3/5 → **5/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| Não existia statement de posicionamento decidido (só proposta) | `14_DECISOES_VERBAIS.md` D1: statement em **versão final de uso**, com alternativa vencida e racional — amarra os três ativos incopiáveis, passando no teste "essa frase serviria para um concorrente?" (não serve) | Alta — pronto-para-assinatura |
| Relação categoria ↔ marca não resolvida (a Téra assina a categoria?) | `14` D3: **decidido** — "Espetáculos multidimensionais." como assinatura institucional permanente + "Habite outros mundos." como linha de campanha; papel das opções vencidas definido | Alta |
| Definição conceitual escorregava para o academicismo (slide 05) | `14` D2: **definição canônica em 3 tamanhos** (10 / 23 / 52 palavras) com regra dura ("estas são as ÚNICAS definições públicas; ninguém reescreve") — mata o slide 05 como fonte de copy | Alta — resolve o risco de OOH em 5 segundos |

**Nota: 5/5.** A validação formal do cliente (D1/D3) está na lista de pendências e não derruba a nota: os textos estão em versão final, com racional e alternativas documentadas.

### D2 — Identidade Visual: 2/5 → **5/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| Sem sistema: logo sem variações, sem grid, sem paleta, sem tipografia, sem regras | `15_SISTEMA_VISUAL.md` + `brand/logo/`: wordmark paramétrico redesenhado (1 raio, 1 espessura) em **dois estados** (tinta/matéria), monograma t, lockup com descritor, área de proteção (1R), tamanhos mínimos (90 px / 25 mm), paleta com hex e proporção-guia 80/15/5, tipografia definida com interina de produção (Space Mono) e alternativas gratuitas nomeadas (`04`) — tudo regenerável por código | Alta — SVGs verificados nesta re-auditoria, coerentes com a spec escrita |
| Proporção do painel sem spec — impossível projetar para o suporte principal | `16_DOSSIE_32K.md` §6: **requisição formal de spec pronta para envio** (9 itens, com o porquê de cada um) + política provisória em vigor: sistema **proporção-agnóstico**, placeholder 32:9 nunca publicado | Alta — plano B elimina o bloqueio |
| Estética-mãe pertencia à Mata (risco de estrear "vestida com a roupa da marca-mãe") | `15` §9 + `14` D6: regra codificada — plasma = linguagem do **evento** Reveal; sistema próprio (subsolo/cal/bioluminescência) assume da Fase 2 em diante; proibido plasma da Mata como fundo do wordmark fora do Reveal | Alta |
| Arquitetura de marca indefinida (endossada? sub-marca? independente?) | `14` D6: **decidido — marca endossada**, com regra de coassinatura por peça/fase ("a Mata apresenta, a Téra fala") e artefato pronto (`tera_coassinatura_mata.svg`, "por Mata São Paulo" em mono a 72%) | Alta — pronto-para-assinatura |

**Nota: 5/5.** Ressalvas residuais que **não** bloqueiam (registradas para a produção): (a) board visual de usos incorretos ainda não existe como artefato dedicado (as proibições estão escritas em `15`/`09`); (b) os SVGs referenciam a fonte por caminho relativo (`../../case/fonts/`) — embutir ou converter texto em path antes de distribuir os arquivos fora do repositório; (c) licenciamento Signifier/Söhne é decisão de orçamento do cliente (pendência), com interina já operacional.

### D3 — Consistência de Mensagem: 2/5 → **5/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| O próprio deck usava o rótulo que a estratégia manda enterrar ("immersive room", slide 03) | `14` D4: **decreto do termo-ponte** — banido como autodescrição em PT e EN, permitido só no padrão de contraste; **correção do slide 03 redigida** para solicitação ao cliente; extensão para briefing de imprensa (1x por matéria, sempre em contraste) e media training | Alta — regra única, aplicável no dia seguinte |
| Sem hierarquia de mensagens (mensagem-mãe, suportes, provas, por público) | `06_MENSAGENS.md`: hierarquia completa em 4 níveis + banco de provas + mensagens por audiência (3) + por fase (4) + por canal (8) | Alta |
| Sem tagline nem boilerplate | `14` D3 (sistema de tagline em duas camadas, decidido) + D5 (**boilerplate 98 palavras PT + 82 EN em versão final**, com tradução oficial da categoria) | Alta — pronto-para-assinatura |

**Nota: 5/5.** A correção física do deck é ato do cliente (pendência); a requisição está redigida palavra por palavra.

### D4 — Voz & Tom: 2/5 → **4/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| Plataforma verbal não codificada | `05_VOZ.md`: plataforma completa — 6 dimensões de tom, 6 qualidades com faça/não faça, vocabulário proprietário e proibido (15+15), regras de estilo, adaptação por canal, 6 reescritas antes/depois, modo reticente da Fase 1 com dial por fase, regras bilíngues PT/EN | Alta |
| Repertório insuficiente (a voz vivia em um único texto) | Repertório agora atravessa manifesto em 3 versões (`08`), história em 3 versões (`07`), copy das peças-chave da Fase 1 (`11` §4.5), boilerplate (`14`), linhas de OOH, bios e até identidade sonora com assinatura falada (`12`) — a voz é reconhecível sem o logo | Alta |
| Fase 1 escrita por múltiplas mãos → oscilação de tom | Parcialmente: as regras existem (`05` §06, `14` D4, FAQ-padrão em `11`), mas **os dois instrumentos que blindam a escrita multi-mãos não foram redigidos** — ver abaixo | Média |

**Nota: 4/5.** O próprio plano (`13`, alavanca D4) definiu a barra: "Kit verbal da Fase 1 **escrito** (OOH, bios, release, Q&A)". OOH ✓ e bios ✓ existem; **release embargado ✗ e Q&A completo ✗ não existem como artefatos** — são exatamente as duas peças que imprensa e community management copiam verbatim, ou seja, o mecanismo concreto contra a oscilação verbal que a R1 apontou como risco nº 1 desta dimensão. Não é lacuna de plataforma; é lacuna de kit. Ver "O que falta para 5".

### D5 — Alinhamento com Audiência: 2/5 → **5/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| Cliente não define público primário; personas 100% inferidas, sem dados | `19_AUDIENCIA_DADOS.md`: personas confrontadas com dados públicos reais (JLeiva 2024, MASP/Pinacoteca/Bienal/Japan House 2025, bilheteria de imersivos, turismo SP) — Marina validada e promovida, Caio e Teresa validados como portas das Fases 2–3, com **3 correções explícitas às inferências da R1** | Alta — honestidade metodológica exemplar (fontes linkadas, 2ª mão sinalizada) |
| Sem priorização de público de entrada — "a Fase 1 tende a falar com todo mundo do mesmo jeito" | `19` §3: **decisão recomendada com 3 razões objetivas** — público de entrada = circuito Bienal–MASP–Pinacoteca (quem funda vocabulário), sub-público nomeado, sequência de portas por fase mantida com justificativa | Alta |
| Preço, acesso e frequência sem base | `19` §1.4/§3: corredor de preço observado (R$ 60–120) + recomendação R$ 80–120 com porta de gratuidade ancorada em dado (55% do recorde do MASP entrou grátis) + dimensionamento de mercado (§4) + a hipótese mais frágil ("razão pra voltar") corretamente elevada a pergunta nº 1 ao cliente | Alta |

**Nota: 5/5.** Validação com dados internos do cliente = pendência (roteiro de 10 perguntas pronto, `19` §5).

### D6 — Diferenciação Competitiva: 3/5 → **5/5**

| Gap apontado na R1 | Como foi endereçado | Qualidade |
|---|---|---|
| Nenhum concorrente mapeado com dados; mapa 100% inferência | `18_CONCORRENCIA_DADOS.md`: 9 players com números reais e fontes (MIS Experience, itinerantes, Japan House, teamLab, ARTE Museum, Sphere, Luminiscence, Vibra) + veredito dado-a-dado sobre cada leitura da R1 + régua de preço + janela de tempo do quadrante vazio + roteiro de 8 perguntas ao cliente | Alta |
| Superlativo "maior da América Latina / 32K" sem substanciação | `16_DOSSIE_32K.md`: levantamento continental e global com fontes, definição operacional que blinda a alegação, **3 redações defensáveis + fallback em 3 degraus**, riscos com janela de validade, requisição de spec pronta. Conclusão honesta: "provavelmente defensável, só publicável com spec anexada" | Alta — exatamente o que a Fase 2 exigirá |
| Risco de nome (colisão "Terra", sem verificação INPI/domínio/handles) | `17_PROTECAO_NOME.md`: busca de anterioridade executada (risco alto na classe 41 **identificado e nomeado**, com precedente de indeferimento), rota de depósito recomendada (marca mista composta + coexistência), domínio-âncora descoberto **livre** com ordem de registro imediato, handles checados com limitações declaradas, estratégia de mitigação de SERP em 6 pontos, checklist P0/P1/P2 | Alta — não é parecer jurídico e diz isso; entrega tudo que o estúdio podia entregar |

**Nota: 5/5.** O risco INPI classe 41 é real e permanece — mas a régua desta re-auditoria é prontidão do **material**, e o material agora contém diagnóstico, rota, plano B e requisições prontas; depósito, registro de domínio e parecer de PI são atos do cliente (pendências). Residuais estúdio-side, não bloqueantes: obter o despacho íntegro do indeferimento 932438288 e verificação logada dos handles Instagram/X (limitações já declaradas no próprio dossiê).

---

## PENDÊNCIAS DE ASSINATURA DO CLIENTE

Nenhuma derruba nota — todas têm artefato pronto-para-assinatura, requisição redigida e plano B:

| # | Pendência | Artefato pronto | Plano B em vigor |
|---|---|---|---|
| 1 | "De acordo" no statement (D1), sistema de tagline (D3) e arquitetura endossada (D6) | `14_DECISOES_VERBAIS.md` — textos em versão final, com alternativas vencidas e racional | Nenhum necessário: decisões recomendadas já governam todo o material produzido |
| 2 | Correção da legenda do slide 03 do deck oficial ("Immersive room" → "Espetáculos multidimensionais / Multidimensional spectacles") | Redação exata da correção em `14` D4 | Decreto do termo-ponte já vale para todo material derivado do estúdio |
| 3 | Spec real do painel (proporção, m², pixel map, pitch, fabricante, datas, autorização por fase) | Requisição formal de 9 itens em `16` §6 | Sistema proporção-agnóstico + placeholder 32:9 interno + proibição de publicar números até a spec |
| 4 | Registro de `tera.art.br` (LIVRE em 20/08/2026 — urgente) + defensivos + reserva de handles (`@tera.sp` etc.) | Checklist P0 em `17` §5, com registrador, titularidade (CNPJ) e 2FA especificados | Monitoramento; risco de squatting cresce a cada dia — sinalizado como P0 |
| 5 | Contratação de agente de PI + depósito INPI (marca mista "TÉRA MATA" / "TÉRA — ESPETÁCULOS MULTIDIMENSIONAIS", classes 41/43/35) | Busca de anterioridade completa + rota recomendada + hipótese de coexistência em `17` §1 | Formas compostas + descritor colado + grafia acentuada reduzem colidência enquanto o depósito não sai |
| 6 | Licenciamento tipográfico (Signifier + Söhne) | Especificação e hierarquia em `04`/`15` | Interina de produção operante (Space Mono) + alternativas gratuitas nomeadas |
| 7 | Dados internos de audiência e concorrência (CRM, capacidade, preço modelado, metas, radar de entrantes) | Roteiros prontos: 10 perguntas em `19` §5 + 8 perguntas em `18` §3 | Estimativas públicas com fontes seguram todas as decisões da Fase 1 |

---

## O QUE FALTA PARA 5

### D4 — Voz & Tom (4/5) — tudo produzível pelo estúdio, sem depender do cliente:

1. **Redigir o release institucional embargado do D0** (a peça que a imprensa copia palavra por palavra). Insumos já prontos: boilerplate PT/EN (`14` D5), definição canônica tamanho-release (`14` D2), formulações de imprensa do painel (`16` §4b), estrutura do kit embargado (`11` §02). Estimativa: 1 página + nota ao editor; respeitar o modo reticente (sem tela, sem specs na Fase 1).
2. **Escrever o Q&A/FAQ completo da Fase 1** (15–20 perguntas prováveis com resposta na voz da marca): "é tipo uma sala imersiva?", "o que é espetáculo multidimensional?", "é da Mata?", "o que é 32K?", "quando abre?", "quanto vai custar?", "é o Sphere brasileiro?", "quem são os artistas?" — o instrumento que garante consistência quando social, assessoria e parceiros respondem em paralelo (o risco nº 1 apontado na R1 para esta dimensão). O padrão-resposta já existe (`14` D4, `11` §02); falta o documento.
3. *(Complementar, mesma entrega)* **One-pager de media training** consolidando as regras hoje dispersas: correção em entrevista (`14` D4), forma falada de desambiguação "Téra Mata" (`17` §4.2), proibições verbais (`05` §08).

Com esses artefatos escritos, D4 → 5/5 e o critério de parada do WS-G (todas as dimensões 5/5, pendências exclusivamente de assinatura) é atingido.

---

*Re-auditoria R2 (WS-G) — 20/08/2026. Fontes: módulos 00–19, `brand/logo/` (artefatos inspecionados), `10_AUDITORIA.md` como baseline. Próximo loop: produzir os 3 itens de D4 e re-verificar; em paralelo, executar P0 de proteção do nome (item 4 das pendências — o único com relógio correndo).*

---

## Verificação R2.1 — D4 (ago/2026)

**Veredito: D4 Voz & Tom = 5/5. Geral = 30/30.** O `21_KIT_IMPRENSA_FASE1.md` entrega os 3 itens exigidos acima, item a item: release institucional embargado do D0 completo (embargo, corpo, aspas, boilerplate, nota ao editor) ✓; Q&A com 18 perguntas cobrindo todas as críticas ("sala imersiva?", "Sphere?", "32K?", "maior da AL?", acessibilidade, sustentabilidade) ✓; one-pager de media training em 10 regras consolidando `14` D4 + `17` §4.2 + `05` §08 ✓ — na voz "assombro preciso", com termo-ponte só no padrão de contraste e 32K/superlativo/números fora de todo texto público da Fase 1 (a escada de redação do painel fica em nota interna N1). Critério de parada do WS-G atingido: todas as dimensões 5/5, pendências exclusivamente de assinatura do cliente. **Ressalvas de linha (não bloqueiam):** (a) a resposta Q&A #6 ("é o que nosso levantamento indica") meio-confirma o superlativo antes de recusá-lo, em leve tensão com a regra 4 do media training — alinhar ou assumir o hedge deliberadamente; (b) remover o marcador de rodapé "¹" do boilerplate na versão distribuída, pois aponta para nota interna não-publicável.
