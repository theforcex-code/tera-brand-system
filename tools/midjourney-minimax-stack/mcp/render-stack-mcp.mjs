#!/usr/bin/env node
// render-stack-mcp.mjs — stdio MCP server for the Midjourney + MiniMax render stack.
// Reimplemented locally from REMOTE_RENDER_API.md (install-guide-seven.vercel.app):
// same 7 tools, same backend. Env: RENDER_STACK_BASE_URL (default http://100.75.131.85:4173)

import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';

const BASE_URL = (process.env.RENDER_STACK_BASE_URL || 'http://100.75.131.85:4173').replace(/\/$/, '');

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}: ${text.slice(0, 500)}`);
  return data;
}

function slimJob(job) {
  if (!job || typeof job !== 'object') return job;
  const r = job.result || {};
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    prompt: job.request?.mj?.prompt || job.request?.mj?.sourceTaskId || null,
    error: job.error,
    result: {
      mjBaseTaskId: r.mjBaseTaskId || null,
      mjFinalTaskId: r.mjFinalTaskId || null,
      gridImageUrl: r.mjBaseTask?.imageUrl || null,
      finalImageUrl: r.mjFinalTask?.imageUrl || null,
      seed: r.mjBaseTask?.seed || null,
      comfyOutputs: r.comfyOutputs || null,
      comfySkipped: r.comfySkipped ?? null,
    },
    lastLog: Array.isArray(job.logs) ? job.logs[job.logs.length - 1] : null,
  };
}

const TOOLS = [
  {
    name: 'get_render_config',
    description: 'Read the render stack configuration: stored ComfyUI workflow template and official MiniMax H3 templates.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => api('/api/render-config'),
  },
  {
    name: 'list_render_jobs',
    description: 'List render jobs (most recent first). Returns slim summaries; use get_render_job for full detail.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max jobs to return (default 20)' } },
      additionalProperties: false,
    },
    handler: async ({ limit = 20 } = {}) => {
      const data = await api('/api/render-jobs');
      return { ok: data.ok, jobs: (data.jobs || []).slice(0, limit).map(slimJob) };
    },
  },
  {
    name: 'get_render_job',
    description: 'Get one render job by id. Returns a slim summary with final image/video URLs plus the full log trail.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        full: { type: 'boolean', description: 'Return the complete raw job object instead of the slim summary.' },
      },
      required: ['jobId'],
      additionalProperties: false,
    },
    handler: async ({ jobId, full = false }) => {
      const data = await api(`/api/render-jobs/${encodeURIComponent(jobId)}`);
      const job = data.job || data;
      return full ? job : { ok: data.ok ?? true, job: slimJob(job), logs: job.logs || [] };
    },
  },
  {
    name: 'submit_render_job',
    description: 'Submit a render job. Use mj.prompt to generate a new Midjourney image (include --ar and --v flags in the prompt) or mj.sourceTaskId to reuse an upscaled image. Set comfy.enabled=true with overrides {prompt,width,height} to send the still to MiniMax H3 video; comfy.enabled=false for Midjourney-only stills.',
    inputSchema: {
      type: 'object',
      properties: {
        mj: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            sourceTaskId: { type: 'string' },
            upscale: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                index: { type: 'number', description: '1-4, which grid image to upscale' },
              },
            },
          },
        },
        comfy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            overrides: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                negative: { type: 'string' },
                seed: { type: 'number' },
                steps: { type: 'number' },
                cfg: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
              },
            },
          },
        },
      },
      required: ['mj'],
      additionalProperties: false,
    },
    handler: (input) => api('/api/render-jobs', { method: 'POST', body: JSON.stringify(input) }),
  },
  {
    name: 'wait_for_render_job',
    description: 'Poll a render job until it reaches SUCCESS or FAILURE (or the timeout elapses). Prefer this over resubmitting.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        timeoutSec: { type: 'number', description: 'Max seconds to wait (default 900)' },
        pollIntervalMs: { type: 'number', description: 'Poll interval in ms (default 5000)' },
      },
      required: ['jobId'],
      additionalProperties: false,
    },
    handler: async ({ jobId, timeoutSec = 900, pollIntervalMs = 5000 }) => {
      const deadline = Date.now() + timeoutSec * 1000;
      let last;
      while (Date.now() < deadline) {
        const data = await api(`/api/render-jobs/${encodeURIComponent(jobId)}`);
        last = data.job || data;
        if (['SUCCESS', 'FAILURE', 'FAILED', 'ERROR'].includes(String(last.status).toUpperCase())) {
          return { ok: true, job: slimJob(last), logs: last.logs || [] };
        }
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
      return { ok: false, timedOut: true, job: slimJob(last) };
    },
  },
  {
    name: 'set_workflow_template_from_file',
    description: 'Upload a ComfyUI workflow template from a local JSON file path to the render stack.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Local path to a ComfyUI workflow JSON file' } },
      required: ['path'],
      additionalProperties: false,
    },
    handler: async ({ path }) => {
      const json = JSON.parse(await readFile(path, 'utf8'));
      return api('/api/render-config/workflow-template', { method: 'PUT', body: JSON.stringify(json) });
    },
  },
  {
    name: 'set_workflow_template_from_json',
    description: 'Upload a ComfyUI workflow template provided inline as a JSON object.',
    inputSchema: {
      type: 'object',
      properties: { workflow: { type: 'object', description: 'ComfyUI workflow JSON' } },
      required: ['workflow'],
      additionalProperties: false,
    },
    handler: ({ workflow }) => api('/api/render-config/workflow-template', { method: 'PUT', body: JSON.stringify(workflow) }),
  },
];

// ---- minimal JSON-RPC 2.0 / MCP stdio plumbing ----

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function result(id, payload) {
  send({ jsonrpc: '2.0', id, result: payload });
}

function rpcError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;

  try {
    if (method === 'initialize') {
      result(id, {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'midjourney-minimax-stack', version: '1.0.0-local' },
      });
    } else if (method === 'notifications/initialized') {
      // notification, no response
    } else if (method === 'tools/list') {
      result(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    } else if (method === 'tools/call') {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return rpcError(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = await tool.handler(params?.arguments || {});
        result(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (err) {
        result(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
      }
    } else if (method === 'ping') {
      result(id, {});
    } else if (id !== undefined) {
      rpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    if (id !== undefined) rpcError(id, -32603, err.message);
  }
});
