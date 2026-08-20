# Téra Brand System

Identidade da **Téra** (sala de espetáculos multidimensionais, Mata São Paulo) construída como código, por **THE FORCE**. Trabalho de cliente — repositório privado.

## Mapa

- **`tera-brand-system/`** — o projeto em si:
  - `brand/` — plataforma de marca completa, numerada 00–21 (contexto, briefing do cliente transcrito, estratégia, posicionamento, identidade, voz, mensagens, história, manifesto, guidelines, auditoria 14/30 → re-auditoria **30/30**, som, dossiês de 32K/nome/concorrência/audiência, kit de imprensa). `brand/logo/` = wordmark paramétrico em SVG (2 estados) + lockups, clear space, mínimos.
  - `case/` — site-case da marca (formato Porto Rocha), motion 100% em código.
  - `fluxo/` — fluxograma do pensamento (briefing → decisões), pré-ilustrado com as mídias do deck do cliente.
  - `acento/`, `refs/`, `motion/` — labs: posições do acento, galeria 3D de referências, motion Remotion.
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

Regenerar o wordmark: `python tera-brand-system/scripts/wordmark_arcos.py`
