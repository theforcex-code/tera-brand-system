# Téra Brand System

Sistema de identidade da Téra (Mata São Paulo) construído como código. Tudo é gerado por script: o wordmark é uma lib paramétrica, as aplicações são geradores, o deck é build.

## Conceito

**Uma nova instituição cultural para espetáculos multidimensionais.** Téra aproxima artistas, tecnologias e públicos por meio de obras que atravessam imagem, som, espaço e presença. A linguagem pública parte da autoridade de uma instituição cultural contemporânea, conectando patrimônio, tecnologia, natureza e criação do Sul Global.

O sistema combina uma base institucional neutra — preto profundo, marfim e cinzas minerais — com um **plasma pixelado** que existe como matéria artística nas telas e no movimento. A cor não é uma assinatura corporativa fixa: varia dentro do plasma e dá a cada programa uma presença própria.

O device gráfico é o Plano, um campo na proporção do painel da sala (spec real PENDENTE, placeholder 32:9 em `PLANO`). O gesto de expansão do motion original permanece como comportamento visual, sem sustentar a narrativa verbal da marca.

**Direção atual (`case/`):** tipografia display Archivo variável em peso máximo (instâncias estáticas Exp Black wght 900 / wdth 125 e Cond Black wdth 62 geradas via fonttools, necessárias para canvas), camada técnica em Space Mono. Wordmark TÉRA em caps; o acento do É se torna uma unidade mínima de plasma em pixels. Space Grotesk permanece apenas nos assets v4 legados; Téra Sans custom segue em avaliação para a fase 2.

## Estrutura

- `acento/` — **Lab 01 · O Acento**: laboratório motion-first interativo com 10 posições pra fresta do É, cada uma com justificativa conceitual e tag de tendência (WGSN/2026). Regra dura: o acento tem a MESMA grossura da barra horizontal do E, medida do glyph real em runtime (pixel-scan da instância Archivo Exp Black). Interação: clique avança, ←/→ e 1–9/0 selecionam, na posição 09 o cursor arrasta o acento (e ele corta a letra onde passa), na 10 o clique colapsa a superposição. QA: `?qa=1&pos=N`. Servir igual ao case e abrir `/acento/`.
- `case/` — **site-case da marca** (index.html + css/js puros, sem build): stream editorial de motion como código, plasma pixelado em canvas, série de programação, OOH marquee, specimen variável, manifesto institucional, ingresso e ícones. Transições por máscara com easing seco e zero fade. Servir a pasta `tera-brand-system/` (ex.: `python -m http.server 8123 --directory tera-brand-system`) e abrir `/case/`. QA: `?qa=1` congela tudo no estado final e `?scroll=sN` pula para a seção N. Fontes: `case/fonts/` (Archivo variável + instâncias ExpBlack/CondBlack + Space Mono).
- `case/rotas.html` — **página decisória da Entrega 01**: compara os territórios `Campo vivo` e `Índice`, incluindo dois conceitos, dois logos, princípios de motion, voz, aplicações e uma leitura comparativa para escolha de uma única rota.
- `scripts/wordmark.py` — lib do wordmark monoline v4 (legado da direção anterior): `draw_wordmark()`, `draw_monogram()` (o é símbolo), `draw_construction()` (guias geométricas). Monoline paramétrica, supersampled.
- `scripts/gen_v4_assets.py` — gerador legado de type display, lockups, clear space, tamanhos mínimos e storyboard de motion. Ainda não reflete a direção de plasma v5.
- `scripts/gen_comps4.py` — aplicações: posters, OOH (tipo atravessando o Plano), ingresso, social, site, ícone, wayfinding. `RATIO` no topo.
- `scripts/fix_comps.py` — comps sobre o render da sala (`base/sala_render_limpo.jpg`).
- `scripts/gen_v3_assets.py` — diagramas do device (legado parcial; diag_acento morto, ignorar).
- `deck/build_deck4.js` — deck de 23 slides via pptxgenjs. `node build_deck4.js`.
- `assets/identidade` — wordmark, monograma, construção (regeneráveis).
- `assets/sistema` — aplicações e storyboard v4; usar como referência estrutural, não cromática.

Deps: Python (Pillow, numpy, scipy), Node (pptxgenjs). Fonte: Space Grotesk OFL inclusa.

## Fase 1: Identidade institucional (foco agora)

Entregas do briefing: Teaser, Reveal da Sala, Conteúdo manifesto, OOH institucional.

Missões sugeridas pro Claude Code, em ordem:

1. **Motion institucional como código.** Campo mínimo → expansão do Plano → plasma pixelado → assinatura. Versões 16:9 e 9:16 exportáveis em frames via ffmpeg, com easing seco e sem fade.
2. **Gerador de programação.** CLI para séries de cartazes e peças de programa, mantendo grid institucional e modulando o plasma por obra em formatos poster, story e OOH.
3. **Manifesto.** Roteiro de 45–60s a partir da instituição, dos espetáculos multidimensionais e da conexão entre artistas do Sul e o mundo, casado com o motion do item 1.
4. **Sala.** Portar os comps do render pra pipeline ComfyUI conforme `tera_roteiro_sala.md` (shots 05 e 06 primeiro).

## Pendências de decisão

- Spec real do painel e formatos de mídia do complexo.
- Regras de modulação do plasma entre programação institucional e conteúdos de artistas.
- Calibração de luminosidade e contraste do plasma na tela real da sala.
