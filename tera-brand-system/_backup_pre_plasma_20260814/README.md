# Téra Brand System

Sistema de identidade da Téra (Mata São Paulo) construído como código. Tudo é gerado por script: o wordmark é uma lib paramétrica, as aplicações são geradores, o deck é build.

## Conceito

**A caixa de superposição.** A sala contém todos os mundos ao mesmo tempo; abrir é escolher um. Cada espetáculo é um Estado da Téra (Estado 001, 002...). Plataforma verbal: **"A Téra abre."** (o ato de observação). Cor: preto, branco e fósforo #2CF5A0, sendo o fósforo a luz de dentro da caixa. A menor unidade de luz é a fresta horizontal. Nada aparece por fade ou corte: todo estado é revelado por abertura. Sem texturas generativas na identidade: o generativo é conteúdo (Estados), nunca marca.

O device gráfico é o Plano: retângulo na proporção do painel da sala (spec real PENDENTE, placeholder 32:9 em `RATIO`). Fechado = void preto.

**Direção bold (atual, `case/`):** tipografia display Archivo variável em peso máximo (instâncias estáticas Exp Black wght 900 / wdth 125 e Cond Black wdth 62 geradas via fonttools, necessárias pra canvas), camada técnica em Space Mono. Wordmark TÉRA em caps: o acento do É vira a própria fresta horizontal em fósforo. Space Grotesk permanece só nos assets v4 legados; Téra Sans custom segue em avaliação pra fase 2.

## Estrutura

- `case/` — **site-case da marca no formato Porto Rocha** (index.html + css/js puros, sem build): stream de cards de motion como código (reveal da caixa em canvas, série de Estados generativa, OOH marquee, specimen variável, manifesto, ingresso, ícones), Challenge → Solution → Project Info → créditos. Todas as transições por abertura (clip-path), easing seco, zero fade. Servir a pasta `tera-brand-system/` (ex.: `python -m http.server 8123 --directory tera-brand-system`) e abrir `/case/`. QA: `?qa=1` congela tudo no estado final (screenshots) e `?scroll=sN` pula pra seção N. Fontes: `case/fonts/` (Archivo variável + instâncias ExpBlack/CondBlack + Space Mono).
- `scripts/wordmark.py` — lib do wordmark monoline v4 (legado da direção anterior): `draw_wordmark()`, `draw_monogram()` (o é símbolo), `draw_construction()` (guias geométricas). Monoline paramétrica, supersampled.
- `scripts/gen_v4_assets.py` — type display (Space Grotesk render), lockups, clear space, tamanhos mínimos, storyboard de motion (caixa fechada → fresta → aberta → habitada → assinada), índice.
- `scripts/gen_comps4.py` — aplicações: posters, OOH (tipo atravessando o Plano), ingresso, social, site, ícone, wayfinding. `RATIO` no topo.
- `scripts/fix_comps.py` — comps sobre o render da sala (`base/sala_render_limpo.jpg`).
- `scripts/gen_v3_assets.py` — diagramas do device (legado parcial; diag_acento morto, ignorar).
- `deck/build_deck4.js` — deck de 23 slides via pptxgenjs. `node build_deck4.js`.
- `assets/identidade` — wordmark, monograma, construção (regeneráveis).
- `assets/sistema` — aplicações, estados, storyboard (regeneráveis).
- Série de estados: `gen na conversa` — função `estado_poster` (portar pro repo a partir de assets/sistema/estado*.png como referência).

Deps: Python (Pillow, numpy, scipy), Node (pptxgenjs). Fonte: Space Grotesk OFL inclusa.

## Fase 1: Revelar (foco agora)

Entregas do briefing: Teaser, Reveal da Sala, Conteúdo manifesto, OOH institucional.

Missões sugeridas pro Claude Code, em ordem:

1. **Motion do reveal como código.** A caixa abrindo em WebGL/GLSL (canvas 16:9 e 9:16): preto total → fresta horizontal → abertura → mundo aceso → wordmark. Exportável em frames via ffmpeg pra edição. Easing seco, sem fade.
2. **Gerador de Estados.** CLI que gera a série de posters-estado (mesma moldura, estado variável) em qualquer formato: poster, story, OOH. Base: `estado_poster` + `gen_comps4`.
3. **Manifesto.** Roteiro de 45-60s em cima da plataforma ("A Téra abre...") com timing casado no motion do item 1.
4. **Sala.** Portar os comps do render pra pipeline ComfyUI conforme `tera_roteiro_sala.md` (shots 05 e 06 primeiro).

## Pendências de decisão

- Spec real do painel (proporção da caixa trava tudo).
- O que as contatos falaram sobre o formato da tela.
- Fósforo ancorado numa cor real do Matarazzo (ideia PS1/verde-lousa, checar com foto do edifício).
