# Remote Render API

> Cópia local do manual publicado em install-guide-seven.vercel.app (2026-08-20).

Base URL: `http://100.75.131.85:4173` (IP Tailscale atual publicado na documentação).

## Endpoints principais

- `GET /api/render-config`
- `PUT /api/render-config/workflow-template`
- `DELETE /api/render-config/workflow-template`
- `GET /api/render-jobs`
- `GET /api/render-jobs/{jobId}`
- `POST /api/render-jobs`

## Exemplo 1: usar uma imagem já existente do Midjourney

```powershell
$body = @{
  mj = @{
    sourceTaskId = "YOUR_MJ_TASK_ID"
    upscale = @{
      enabled = $false
    }
  }
  comfy = @{
    enabled = $true
    overrides = @{
      prompt = 'Preserve identity, natural skin, subtle breathing, tiny eye movement, direct eye contact.'
      width = 768
      height = 1344
    }
  }
} | ConvertTo-Json -Depth 20

Invoke-WebRequest `
  -Uri "http://100.75.131.85:4173/api/render-jobs" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Exemplo 2: gerar no Midjourney e depois mandar para o MiniMax

```powershell
$body = @{
  mj = @{
    prompt = "young adult man, shirtless, barefoot, front-facing portrait full body, looking directly into camera --ar 9:16 --v 8.2 --raw --s 35"
    upscale = @{
      enabled = $true
      index = 1
    }
  }
  comfy = @{
    enabled = $true
    overrides = @{
      prompt = "Preserve the exact subject and framing. Minimal natural movement only. Audio: calm philosophical whisper."
      width = 768
      height = 1344
    }
  }
} | ConvertTo-Json -Depth 20

Invoke-WebRequest `
  -Uri "http://100.75.131.85:4173/api/render-jobs" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Consultar status

```powershell
Invoke-WebRequest -Uri "http://100.75.131.85:4173/api/render-jobs" | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri "http://100.75.131.85:4173/api/render-jobs/SEU_JOB_ID" | Select-Object -ExpandProperty Content
```

## Formato do job (observado no backend real)

- `status`: `QUEUED → RUNNING → SUCCESS | FAILURE`, com `stage` e `logs[]` detalhados.
- Still final (PNG upscalado): `result.mjFinalTask.imageUrl`
- Grid 2×2 (webp): `result.mjBaseTask.imageUrl`
- Seed: `result.mjBaseTask.seed`
- Vídeo ComfyUI/MiniMax: `result.comfyOutputs` (`comfySkipped: true` quando `comfy.enabled=false`)
- O backend expande o prompt com `--fast --s 50 --raw` automaticamente; enviar
  apenas `--ar` e `--v 8` no prompt.
