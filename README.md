# Téra Brand System

Identidade da **Téra** (sala de espetáculos multidimensionais, Mata São Paulo) construída como código, por **THE FORCE**. Trabalho de cliente — repositório privado.

## Mapa

- **`tera-brand-system/`** — o projeto em si:
  - `brand/` — plataforma de marca completa, numerada 00–21 (contexto, briefing do cliente transcrito, estratégia, posicionamento, identidade, voz, mensagens, história, manifesto, guidelines, auditoria 14/30 → re-auditoria **30/30**, som, dossiês de 32K/nome/concorrência/audiência, kit de imprensa). `brand/logo/` = wordmark paramétrico em SVG (2 estados) + lockups, clear space, mínimos; `brand/logo/conceito-hf/` = exploração de símbolo, 50 marcas em SVG vetorial (Recraft V4.1) em 5 séries — plano, volume, matéria/luz, cinética, construída — mais a prancha `prancha.html`.
  - `case/` — site-case da marca (formato Porto Rocha), motion 100% em código.
  - `fluxo/` — fluxograma do pensamento (briefing → decisões), pré-ilustrado com as mídias do deck do cliente.
  - `acento/`, `areia/`, `refs/`, `motion/` — labs: posições do acento, **wordmark em areia interativa** (Lab 02: grão de 1 px com física à la This is Sand, modos Vão/Duna, paletas Plasma/Subsolo/Cal, chuva, export PNG), galeria 3D de referências, motion Remotion.
  - `scripts/` — geradores (wordmark_arcos.py, serve_case.py, assets v3/v4).
  - `deck/` — deck v4 (pptxgenjs).
- **`tools/`** — stack de render Midjourney+MiniMax (MCP + gerador de imagens da marca).
- **`.agents/brand-context.md`** — contexto de marca lido pelas skills.
- **`.claude/skills/`** — skills de brand-building (arnabbagxd, MIT) + Remotion.

## Rodar

```bash
python tera-brand-system/scripts/serve_case.py 8123
```

- Case: http://localhost:8123/case/
- Fluxograma: http://localhost:8123/fluxo/
- Wordmark (estados animados): http://localhost:8123/brand/logo/preview.html
- Areia (Lab 02, logo interativo): http://localhost:8123/areia/ — params `?modo=duna`, `?paleta=subsolo|cal`, `?chuva`; teclas M/P/R/C/S
- Prancha de símbolo (50 marcas, 5 séries): http://localhost:8123/brand/logo/conceito-hf/prancha.html

Regenerar o wordmark: `python tera-brand-system/scripts/wordmark_arcos.py`
