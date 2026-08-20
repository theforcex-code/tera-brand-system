# Téra · motion/

Motion-como-código dos logos da Téra em [Remotion](https://www.remotion.dev) — cada animação é um componente React renderizado frame a frame (determinístico, sem SMIL/CSS de tempo real).

## Comandos

```bash
npm run dev                                  # Remotion Studio (preview interativo com timeline)
npx remotion render wordmark-draw-ink out/wordmark-draw-ink.mp4
npx remotion render wordmark-draw-cal out/wordmark-draw-cal.mp4
npx remotion render materia-fresta out/materia-fresta.mp4
npx remotion still materia-fresta out/frame.png --frame=120   # frame único
```

Formatos alternativos: `--codec=vp8 --image-format=png` gera WebM com alpha (pra usar sobre o site-case); ProRes: `--codec=prores --prores-profile=4444`.

## Composições

| id | o quê |
|----|-------|
| `wordmark-draw-ink` | wordmark épsilon, ink sobre cal, draw-on com pena de velocidade constante |
| `wordmark-draw-cal` | wordmark barra, cal sobre subsolo, mesmo draw-on |
| `materia-fresta` | "A Téra abre.": fresta horizontal abre em 2 estágios e revela o estado matéria (plasma por frame) |

## Fontes de verdade

- Paths e paleta: `src/tera/tokens.ts` — copiados de `../brand/logo/*.svg` (gerados por `../scripts/wordmark_arcos.py`). Regenerou o wordmark → atualizar tokens.
- Regra da marca: nada aparece por fade/corte; tudo por abertura.

## Skills

As skills oficiais do Remotion estão em `../.claude/skills/remotion-*` (instaladas via `npx skills add remotion-dev/skills`). O Claude Code carrega elas automaticamente ao trabalhar aqui.
