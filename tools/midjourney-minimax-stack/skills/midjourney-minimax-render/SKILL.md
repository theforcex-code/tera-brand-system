---
name: midjourney-minimax-render
description: Operate the local Midjourney + MiniMax H3 render stack (backend http://100.75.131.85:4173) to generate stills and image-to-video. Use when the user asks for Midjourney images or MiniMax video via the local stack.
---

# Midjourney + MiniMax Render Stack

Backend: `http://100.75.131.85:4173` (Tailscale). MCP server: `midjourney-minimax-stack`
(7 tools). Fallback sem MCP: HTTP direto — ver `../../SETUP.md`.

## Fluxo canônico

1. **Escolher origem**
   - Imagem nova → `mj.prompt` (sempre incluir `--ar W:H --v 8` no fim; o backend
     acrescenta `--fast --s 50 --raw` sozinho — não duplicar).
   - Imagem já upscalada → `mj.sourceTaskId` com o task id do Midjourney.
2. **Enviar** — `submit_render_job`:
   - Still apenas: `comfy.enabled = false`, `mj.upscale = { enabled: true, index: 1..4 }`.
   - Vídeo MiniMax H3: `comfy.enabled = true` + `overrides { prompt, width, height }`
     (prompt de movimento, ex.: "Preserve identity, subtle breathing, tiny eye movement").
3. **Aguardar** — `wait_for_render_job` (polling longo). NUNCA reenviar o mesmo job.
4. **Consumir**
   - Still final (PNG upscalado): `result.mjFinalTask.imageUrl`
   - Grid 2×2 (webp): `result.mjBaseTask.imageUrl`
   - Vídeo: `result.comfyOutputs`
   - Seed: `result.mjBaseTask.seed`

## Regras de operação

- Jobs processam em fila sequencial (~60 s por still com upscale). Pode enfileirar
  vários; aguardar todos com polling, não com reenvio.
- `--ar` válidos comuns: 1:1, 4:5, 16:9, 21:9, 9:16, 3:2.
- Sem texto na imagem: Midjourney renderiza tipografia mal — sempre pedir
  "no text, no words, no letters" quando a peça for limpa.
- Upscale index 1 por padrão; se o usuário quiser escolher do grid, mostrar o
  grid (`mjBaseTask.imageUrl`) e reenviar como novo job `mj.sourceTaskId` + action.
- Workflows MiniMax H3 disponíveis no backend: `video_minimax_h3_i2v.json`,
  `video_minimax_h3_r2v.json`, `video_minimax_h3_t2v.json` (ver `get_render_config`).
