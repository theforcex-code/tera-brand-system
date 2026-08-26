/* Lab 02 · Areia GPU — o TÉRA cheio de areia, em regime permanente.

   O wordmark é uma cavidade em pé que a areia preenche. Diferente da versão
   WebGL, aqui não há fim: a entrada nunca fecha e o fundo drena. Quando a
   cavidade enche, cada grão que assenta lá embaixo é reciclado para uma boca do
   topo — o logo fica cheio E continua correndo, indefinidamente, com as cores
   rolando pela paleta.

   A profundidade tem vida própria: a cor de cada grão é lida da paleta com um
   deslocamento proporcional à camada Z, então o que chega no fundo não é o que
   sai na frente, e o volume deixa de ser uma extrusão chapada do desenho.

   Tudo o que governa isso está aberto no painel e cabe na URL. */

import { loadWordmark, fitWordmark, rasterizeWordmark } from './wordmark.js?v=24';
import { PALETTES, buildLut } from './palette.js?v=24';
import { SandGPU, WALL, EMPTY } from './gpu/sand-gpu.js?v=24';
import { OrbitCamera } from './gpu/camera.js?v=24';
import { fromSearch, toSearch } from './params.js?v=24';
import { Panel } from './panel.js?v=24';

const TARGET = { nx: 1024, ny: 576, nzMax: 208 };  // x:11 bits, y:10, z:9
const FIT = { marginX: 0.05, marginY: 0.1, yBias: 0.5 };
const CLEAR = [0.039, 0.035, 0.031, 1];
const DRIFT_PER_SECOND = 1 / 26;      // a 1× de deriva, um ciclo de paleta a cada 26 s
const SPAWN_BASE = 90000;             // candidatos por passo a 100% de vazão

const canvas = document.getElementById('areia');
const hudEl = document.getElementById('hud');
const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);

const state = {
  palette: PALETTES[query.get('paleta')] ? query.get('paleta') : 'plasma',
  paused: false,
  descritor: !query.has('semdescritor'),
  running: true,
  lutPos: Math.random(),
  simTime: 0,
};

let sim = null;
let cam = null;
let panel = null;
let dims = null;
let capacity = 0;

const press = (id, on) => document.getElementById(id)?.setAttribute('aria-pressed', String(on));
const packPos = (x, y, z) => (x | (y << 11) | (z << 21)) >>> 0;

// ---------- montagem da cavidade ----------

function buildMask(wordmark, d) {
  const fit = fitWordmark(wordmark, d.nx, d.ny, FIT);
  const { inside } = rasterizeWordmark(wordmark, d.nx, d.ny, fit);
  const mask = new Uint8Array(d.nx * d.ny);
  for (let y = 0; y < d.ny; y++) {           // canvas cresce para baixo; o mundo, para cima
    const src = (d.ny - 1 - y) * d.nx;
    mask.set(inside.subarray(src, src + d.nx), y * d.nx);
  }
  return mask;
}

/** Grade de paredes: tudo que está fora do desenho bloqueia. */
function buildGrid(mask, d) {
  const grid = new Uint32Array(d.nx * d.ny * d.nz);
  let open = 0;
  for (let z = 0; z < d.nz; z++) {
    const plane = z * d.nx * d.ny;
    for (let y = 0; y < d.ny; y++) {
      const row = plane + y * d.nx;
      const src = y * d.nx;
      for (let x = 0; x < d.nx; x++) {
        const dentro = mask[src + x] !== 0;
        grid[row + x] = dentro ? EMPTY : WALL;
        if (dentro) open++;
      }
    }
  }
  return { grid, open };
}

/** Bocas: topo de cada trecho aberto, em todas as camadas de profundidade.
    Sem isso a barra do "t" nunca receberia areia — o traço de cima a tampa. */
function buildMouths(mask, d) {
  const tops = [];
  for (let x = 0; x < d.nx; x++) {
    let acima = 0;
    for (let y = d.ny - 1; y >= 0; y--) {
      const aberto = mask[y * d.nx + x];
      if (aberto && !acima) tops.push(x, y);
      acima = aberto;
    }
  }
  const out = new Uint32Array((tops.length / 2) * d.nz);
  let n = 0;
  for (let i = 0; i < tops.length; i += 2) {
    for (let z = 0; z < d.nz; z++) out[n++] = packPos(tops[i], tops[i + 1], z);
  }
  return out;
}

// ---------- física ----------

function windAt(t) {
  const { vento, rajada, periodo } = values;
  if (rajada === 0) return vento;
  const w = (2 * Math.PI) / periodo;
  const gust = 0.6 * Math.sin(w * t)
    + 0.3 * Math.sin(w * t * 1.7 + 1.1)
    + 0.1 * Math.sin(w * t * 2.9 + 2.3);
  return Math.max(-1, Math.min(1, vento + rajada * gust));
}

/** A cavidade está cheia? Enquanto não estiver, a reciclagem fica desligada —
    ela disputaria as mesmas bocas que a emissão e o logo nunca fecharia. */
function isFull() {
  return sim.count >= capacity * 0.985;
}

function physics() {
  const a = (values.direcao * Math.PI) / 180;
  return {
    fall: values.gravidade,
    wind: windAt(state.simTime),
    talude: values.talude,
    windX: Math.cos(a),
    windZ: Math.sin(a),
    lutPos: state.lutPos,
    zSpread: values.profundidade / 1000,
    recycle: state.running && isFull() ? values.fluxo : 0,
    drainY: (values.dreno / 100) * dims.ny,      // fração da altura, não pixels
    turbulencia: values.turbulencia,
    zFreq: (2 * Math.PI) / Math.max(1, values.camada),
    tempo: state.simTime * 0.6,
  };
}

// ---------- laço ----------

let last = performance.now();
let frameNo = 0;
const perf = { simMs: 0, drawMs: 0, fps: 0, acc: 0, n: 0 };

/** Um quadro: simular, mover a câmera, desenhar. Separado do rAF para poder ser
    chamado à mão em diagnóstico — aba em segundo plano não recebe rAF. */
function tick(dt) {
  const t0 = performance.now();
  if (!state.paused && state.running) {
    const steps = Math.max(1, Math.round(values.velocidade * 2));
    const phys = physics();
    const spawn = Math.round(SPAWN_BASE * (values.chuva / 100));
    for (let s = 0; s < steps; s++) sim.step(phys, spawn);
    state.simTime += dt;
  }
  state.lutPos += dt * values.deriva * DRIFT_PER_SECOND;   // roda mesmo em pausa da matéria
  const t1 = performance.now();

  resize();
  // a paleta rola sempre: mesmo com a areia parada, o volume continua vivo
  sim.anim.roll = state.lutPos;
  sim.anim.zSpread = values.profundidade / 1000;
  sim.cut = (values.corte / 100) * dims.nz;
  cam.autoRotate = values.orbita;
  const vp = cam.update(canvas.width / canvas.height, dt, dims.nx * 0.05, dims.nx * 8);
  sim.render(vp, { x: dims.nx / 2, y: dims.ny * 0.5, z: dims.nz / 2 }, CLEAR);
  return [t1 - t0, performance.now() - t1];
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const [simMs, drawMs] = tick(dt);

  perf.simMs += simMs;
  perf.drawMs += drawMs;
  perf.acc += dt;
  perf.n++;
  if (perf.acc >= 0.5) {
    perf.fps = Math.round(perf.n / perf.acc);
    perf.simMs /= perf.n;
    perf.drawMs /= perf.n;
    updateHud();
    perf.acc = 0;
    perf.n = 0;
    perf.simMs = 0;
    perf.drawMs = 0;
    if (++frameNo % 2 === 0) sim.readCount().catch(() => {});
  }
}

function updateHud() {
  const pct = Math.min(100, Math.round((sim.count / capacity) * 100));
  const parts = [
    `${sim.count.toLocaleString('pt-BR')} grãos`,
    `${pct}%`,
    `${perf.fps} fps`,
    `sim ${perf.simMs.toFixed(1)} ms`,
  ];
  if (isFull()) parts.push('cheio · circulando');
  if (state.paused) parts.push('pausa');
  hudEl.textContent = parts.join(' · ');
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(window.innerWidth * dpr);
  const h = Math.round(window.innerHeight * dpr);
  if (canvas.width === w && canvas.height === h) return;
  canvas.width = w;
  canvas.height = h;
}

// ---------- controles ----------

function restart() {
  sim.reset();
  state.simTime = 0;
  state.lutPos = Math.random();
  state.running = true;
  press('rodar', true);
  updateHud();
}

function toggleRun() {
  state.running = !state.running;
  press('rodar', state.running);
}

function setPalette(name) {
  state.palette = name;
  sim.uploadLut(buildLut(PALETTES[name].stops));
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.palette === name));
  });
  syncUrl();
}

function setDescritor(on) {
  state.descritor = on;
  document.getElementById('descritor')?.classList.toggle('descritor--off', !on);
  press('descritor-btn', on);
  syncUrl();
}

function savePng() {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tera-areia-gpu-${sim.count}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

let urlTimer = 0;
function syncUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const q = toSearch(values, {
      paleta: state.palette === 'plasma' ? undefined : state.palette,
      semdescritor: state.descritor ? undefined : true,
    });
    history.replaceState(null, '', q ? `?${q}` : location.pathname);
  }, 400);
}

const KEYS = {
  a: () => panel.toggle(),
  c: restart,
  d: () => setDescritor(!state.descritor),
  p: () => {
    const names = Object.keys(PALETTES);
    setPalette(names[(names.indexOf(state.palette) + 1) % names.length]);
  },
  s: savePng,
  ' ': () => { state.paused = !state.paused; press('pausa', state.paused); updateHud(); },
};

function wireUi() {
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palette));
  });
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  on('rodar', toggleRun);
  on('pausa', KEYS[' ']);
  on('limpar', restart);
  on('png', savePng);
  on('descritor-btn', () => setDescritor(!state.descritor));
  on('ajustes', () => panel.toggle());
  document.addEventListener('keydown', (e) => {
    const noCampo = e.target instanceof Element && e.target.matches('input, button');
    if (e.metaKey || e.ctrlKey || e.altKey || noCampo) return;
    const fn = KEYS[e.key.toLowerCase()];
    if (!fn) return;
    e.preventDefault();
    fn();
  });
  window.addEventListener('resize', resize);
}

function fail(msg) {
  hudEl.textContent = msg;
  const el = document.getElementById('erro');
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
}

async function init() {
  try {
    const wordmark = await loadWordmark();
    const probe = await navigator.gpu?.requestAdapter();
    if (!probe) throw new Error('WebGPU indisponível — use Chrome ou Edge recentes');
    // a profundidade é o que sobra do limite de buffer do adaptador
    const budget = Math.min(probe.limits.maxStorageBufferBindingSize, probe.limits.maxBufferSize);
    const nz = Math.max(16, Math.min(TARGET.nzMax, Math.floor(budget / 4 / (TARGET.nx * TARGET.ny))));
    dims = { nx: TARGET.nx, ny: TARGET.ny, nz };

    const mask = buildMask(wordmark, dims);
    const { grid, open } = buildGrid(mask, dims);
    capacity = open;
    const mouths = buildMouths(mask, dims);

    // folga pequena: com a célula reservada antes do slot, quase nada se perde
    const teto = Math.min(Math.floor(open * 1.04), 40e6);
    sim = await SandGPU.create(canvas, dims, teto, mouths, buildLut(PALETTES[state.palette].stops));
    sim.uploadWalls(grid);
    cam = new OrbitCamera(canvas, { target: [0, 0, 0], distance: dims.nx * 1.05, fov: 42 });

    panel = new Panel(values, syncUrl, 'gpu');
    wireUi();
    setPalette(state.palette);
    setDescritor(state.descritor);
    press('rodar', true);
    panel.sync();
    resize();
    requestAnimationFrame(frame);

    window.__areiaGPU = {
      sim, cam, state, dims, perf, values, panel, capacity,
      bocas: mouths.length, physics, restart,
      /** Avanço manual para diagnóstico; sincroniza a cada lote para não entupir a fila. */
      async run(n = 1, dt = 1 / 60) {
        let a = 0;
        let b = 0;
        for (let i = 0; i < n; i++) {
          const [s, d] = tick(dt);
          a += s;
          b += d;
          if (i % 30 === 29) await sim.device.queue.onSubmittedWorkDone();
        }
        await sim.device.queue.onSubmittedWorkDone();
        return { msSim: +(a / n).toFixed(2), msDraw: +(b / n).toFixed(2) };
      },
      info: { ...sim.adapterInfo, budgetMB: (budget / 1048576) | 0, celulas: dims.nx * dims.ny * dims.nz },
    };
  } catch (err) {
    fail(err.message);
    throw err;
  }
}

init();
