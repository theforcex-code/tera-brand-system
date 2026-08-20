# TÉRA — Sistema Visual (R1)

> Workstream WS-B do plano nota-5. Consolida a identidade visual PRÓPRIA da Téra em sistema aplicável — a lacuna nº 2 da auditoria. Base: brief de identidade (04), decisões verbais (14) e o gerador paramétrico `scripts/wordmark_arcos.py`. Todos os artefatos citados existem em `brand/logo/` e são **regeneráveis por código**.

---

## 1. Wordmark

**Construção:** "téra" minúsculo, evolução direta do desenho de arcos do cliente, redesenhado parametricamente com **um raio (R = 40) e uma espessura (T = 20)** — ritmo de arco unificado, terminais retos, kerning óptico por par. O *e* usa a construção geométrica círculo + barra (a mesma gramática da barra do *t*), garantindo leitura instantânea; a variante épsilon (fiel ao exótico do esboço original) fica disponível no gerador (`glyph_e(epsilon=True)`) como recurso expressivo de aplicações especiais.

**Dois estados (nunca um terceiro):**
1. **Tinta** — `tera_ink_subsolo.svg` (Preto Subsolo sobre claro) e `tera_ink_cal_sobre_subsolo.svg` (Branco Cal sobre escuro). Estado padrão: papel, assinatura, imprensa.
2. **Matéria** — `tera_materia.svg`: as letras são vãos por onde o plasma vivo passa (máscara + turbulência animada). Uso: motion, digital, a sala. **Proibido:** gradiente estático chapado dentro das letras.

## 2. Monograma

O **t** isolado (`tera_monogram_t_*.svg`): avatar, favicon, sinalização mínima, carimbo. Espelha o papel do monograma "M" da Mata sem confusão de hierarquia.

## 3. Lockup com descritor

`tera_lockup_descritor.svg` — wordmark + **"ESPETÁCULOS MULTIDIMENSIONAIS"** em Space Mono Bold, justificado na largura do wordmark. É a assinatura institucional das Fases 1–2 (decisão D3: a categoria assina). Versões cal-sobre-subsolo e tinta.

## 4. Coassinatura Mata ↔ Téra (arquitetura endossada, D6)

`tera_coassinatura_mata.svg` — wordmark Téra protagonista + linha mono **"por Mata São Paulo"** alinhada à direita, 72% de opacidade. Regras:
- OOH e peças da Fase 1: coassinatura presente.
- Canais próprios da Téra (bio, site): descritor em vez de endosso.
- Nunca fundir os dois logos num lockup; nunca o plasma da Mata como fundo do wordmark Téra fora do evento Reveal.

## 5. Área de proteção

`tera_clearspace.svg` — margem mínima = **1R** (o raio do arco do sistema) em todos os lados, medida do bounding do wordmark incluindo o acento. Unidade visível no diagrama.

## 6. Tamanhos mínimos

`tera_minsizes.svg` — régua de reduções:
- Largura mínima digital do wordmark: **90 px**.
- Impresso: **25 mm** de largura.
- Abaixo disso: usar o monograma t (mínimo 16 px / 6 mm).

## 7. Cor (referência: brief 04)

Preto Subsolo `#0A0908` · Branco Cal `#F2EFE9` · Azul Bioluminescência `#31C4FF` (único acento sólido) · Espectro Plasma `#F0529C → #FF6B2C → #35D06E → #31C4FF` (só como matéria em movimento sobre escuro). Proporção-guia 80/15/5. Âmbar Patrimônio `#C98F4A` como norma fotográfica, não tinta.

## 8. Tipografia (referência: brief 04)

Display: **Signifier** (manifesto, títulos editoriais) · Institucional: **Söhne** · Técnica: **Söhne Mono** (specs, datas, wayfinding). Interina de produção enquanto licenças não fecham: Space Mono já em uso no sistema (mesma família de papel técnico). *(decisão de licenciamento pendente de orçamento — ver plano)*

## 9. Convivência com o plasma da Mata

O plasma do Reveal é **linguagem do evento**, herdada da identidade Mata São Paulo — não é a identidade permanente da Téra. Regra: Fase 1 usa plasma como matéria dentro dos vãos e dos Planos; da Fase 2 em diante, o sistema próprio (subsolo/cal/bioluminescência + estado matéria próprio) assume. Isso responde ao risco da auditoria ("a Téra estreia vestida com a roupa da marca-mãe").

## 10. Proporção do painel

O sistema é **proporção-agnóstico** por construção (o Plano é um contêiner paramétrico). Placeholder 32:9 até a spec real (requisição formal no dossiê 16). Nenhuma peça da Fase 1 depende da proporção final.

---

## 11. Referências geradas (Midjourney — direção, não desenho final)

> O wordmark oficial é paramétrico (`scripts/wordmark_arcos.py`, SVGs em `brand/logo/`).
> As imagens abaixo são exploração de direção e ambientação de aplicação — prompts e
> seeds em `../assets/midjourney/MANIFEST.md`.

![Board do sistema](../assets/midjourney/logo-board-sistema.png)
*Board de sistema: tinta sobre subsolo/cal, construção geométrica, acento azul único, matéria.*

![Construção por arcos](../assets/midjourney/logo-construcao-geometria.png)
*Geometria de construção: um raio, uma espessura, círculos-guia.*

![Estado matéria](../assets/midjourney/logo-estado-materia.png)
*Estado matéria: as letras como vãos por onde o plasma vivo passa.*

![Monograma t](../assets/midjourney/logo-monograma-t.png)
*Monograma t: ícone de app e carimbo cego.*

![Sinalização sobre patrimônio](../assets/midjourney/logo-sinalizacao-fachada.png)
*Aplicação ambiental: letras em Branco Cal sobre alvenaria, âmbar patrimônio.*

![Board de aplicações](../assets/midjourney/logo-aplicacoes-board.png)
*Aplicações: ingresso, poster, avatar, papelaria.*

---

*Regenerar tudo: `python scripts/wordmark_arcos.py`. Renders PNG: ver `render_*.png` na mesma pasta.*
