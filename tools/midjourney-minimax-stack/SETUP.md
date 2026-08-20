# midjourney-minimax-stack (instalação local)

Instalado a partir de https://install-guide-seven.vercel.app/ em 2026-08-20.

> Nota: o ZIP oficial não pôde ser baixado nesta sessão (bloqueio de download de
> executáveis externos). O servidor MCP em `mcp/render-stack-mcp.mjs` foi
> **reescrito localmente** a partir do `REMOTE_RENDER_API.md` publicado — mesmas
> 7 tools, mesmo backend. Se quiser o original, baixe o ZIP manualmente e
> substitua o arquivo.

## Backend

- Base URL: `http://100.75.131.85:4173` (Tailscale, máquina do stack LUCIA)
- Esta máquina: `100.93.75.31` — o backend é remoto, acessado via tailnet.
- ComfyUI (MiniMax H3) roda na máquina do backend, não aqui.

## Registro no Claude Code

Já registrado no `.mcp.json` na raiz deste projeto. Para registrar globalmente:

```bash
claude mcp add --scope user midjourney-minimax-stack -e RENDER_STACK_BASE_URL=http://100.75.131.85:4173 -- node "C:\Users\The Force\Documents\tera-brand-system\tools\midjourney-minimax-stack\mcp\render-stack-mcp.mjs"
```

Reinicie a sessão e confirme que o servidor `midjourney-minimax-stack` aparece
com 7 tools: `get_render_config`, `list_render_jobs`, `get_render_job`,
`submit_render_job`, `wait_for_render_job`, `set_workflow_template_from_file`,
`set_workflow_template_from_json`.

## Uso direto via HTTP (sem MCP)

```powershell
# Config
Invoke-WebRequest -Uri "http://100.75.131.85:4173/api/render-config" | Select-Object -ExpandProperty Content

# Submeter still Midjourney (sem vídeo)
$body = @{
  mj = @{
    prompt = "seu prompt aqui --ar 16:9 --v 8"
    upscale = @{ enabled = $true; index = 1 }
  }
  comfy = @{ enabled = $false }
} | ConvertTo-Json -Depth 20
Invoke-WebRequest -Uri "http://100.75.131.85:4173/api/render-jobs" -Method Post -ContentType "application/json" -Body $body

# Status
Invoke-WebRequest -Uri "http://100.75.131.85:4173/api/render-jobs/JOB_ID" | Select-Object -ExpandProperty Content
```

O PNG final (upscalado) fica em `result.mjFinalTask.imageUrl`; o grid 2×2 em
`result.mjBaseTask.imageUrl`. Para vídeo MiniMax H3, `comfy.enabled = true` com
`overrides { prompt, width, height }` — a saída aparece em `result.comfyOutputs`.

## Fluxo do agente (do guia oficial)

1. **Escolher origem** — `mj.sourceTaskId` pra reusar imagem upscalada, ou `mj.prompt` pra gerar nova.
2. **Enviar job** — `submit_render_job` com o still do Midjourney e overrides do MiniMax.
3. **Aguardar fim** — `wait_for_render_job` pra polling longo, nunca reenviar o mesmo job.
4. **Consumir saída** — ler `result.comfyOutputs` (vídeo) ou `result.mjFinalTask.imageUrl` (still).
