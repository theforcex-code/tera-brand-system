/* Lab 02 · Areia 3D — o TÉRA se enche de areia.

   O wordmark é uma cavidade em pé, extrudada em profundidade: a areia cai dentro
   dele e assenta. A cor caminha na paleta enquanto isso, então o logo cheio
   guarda o tempo em estratos — e o corte abre o volume para mostrá-los.

   O volume gira em qualquer direção, e a caixa que o delimita liga e desliga. */

import {
  loadWordmark, fitWordmark, rasterizeWordmark,
  shapeFromSearch, wireShapeButtons, DEFAULT_SHAPE,
} from './wordmark.js?v=31';
import { SandVolume } from './sand3d.js?v=31';
import { Scene3D } from './scene3d.js?v=31';
import { PALETTES, buildLut, lutIndex } from './palette.js?v=31';
import { fromSearch, toSearch } from './params.js?v=31';
import { Panel } from './panel.js?v=31';

const forma = shapeFromSearch();

const GRID = { nx: 384, ny: 184, nz: 28 };   // a caixa abraça o wordmark de perto
const MAX_SETTLED = 620000;     // teto da areia dentro do logo
const MAX_FLYING = 120000;
const STEP_HZ = 60;             // passos por segundo a 1×
const MAX_STEPS_PER_FRAME = 4;
const SIM_BUDGET_MS = 9;
const FIT = { marginX: 0.05, marginY: 0.1, yBias: 0.5 };
const RAIN_GAIN = 0.06;         // grãos por passo = bocas × chuva% × isto
const DRIFT_PER_GRAIN = 1 / 110000; // ~6 estratos no logo cheio
const URL_DEBOUNCE_MS = 400;
const REC_MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

// sRGB → linear: as cores da marca são sRGB, o Three trabalha em linear
const TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

const canvas = document.getElementById('areia');
const hudEl = document.getElementById('hud');

const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);
const state = {
  palette: PALETTES[query.get('paleta')] ? query.get('paleta') : 'plasma',
  raining: query.has('chovendo'),
  paused: false,
  box: query.has('caixa'),      // o volume aparece limpo; a caixa é opcional
  descritor: !query.has('semdescritor'),
  fase: 'parado',               // parado | enchendo | cheio
  fill: null,
  slow: false,
  simTime: 0,
  pos: 0,
};

let volume = null;
let scene = null;
let panel = null;
let sources = new Int32Array(0);   // trincas [x, y, z] das bocas do desenho
let lut = buildLut(PALETTES[state.palette].stops);
let recorder = null;

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const press = (id, on) => document.getElementById(id)?.setAttribute('aria-pressed', String(on));

// ---------- montagem ----------

/** Rasteriza o wordmark na resolução da grade, com Y para cima (o canvas é ao contrário). */
function buildMask(wordmark) {
  const { nx, ny } = GRID;
  const fit = fitWordmark(wordmark, nx, ny, FIT);
  const { inside } = rasterizeWordmark(wordmark, nx, ny, fit);
  const mask = new Uint8Array(nx * ny);
  for (let y = 0; y < ny; y++) {
    const src = (ny - 1 - y) * nx;
    mask.set(inside.subarray(src, src + nx), y * nx);
  }
  return mask;
}

/** Bocas: topo de cada trecho aberto do desenho, replicado pela espessura.
    Sem isso, a barra do "t" nunca receberia areia — o traço de cima a tampa. */
function buildSources(mask) {
  const { nx, ny, nz } = GRID;
  const tops = [];
  for (let x = 0; x < nx; x++) {
    let acima = 0;
    for (let y = ny - 1; y >= 0; y--) {
      const aberto = mask[y * nx + x];
      if (aberto && !acima) tops.push(x, y);
      acima = aberto;
    }
  }
  const out = new Int32Array((tops.length / 2) * nz * 3);   // uma trinca por boca e por camada
  let n = 0;
  for (let i = 0; i < tops.length; i += 2) {
    for (let z = 0; z < nz; z++) {
      out[n++] = tops[i];
      out[n++] = tops[i + 1];
      out[n++] = z;
    }
  }
  return out.subarray(0, n);
}

// ---------- física e tempo ----------

function windAt(t) {
  const { vento, rajada, periodo } = values;
  if (rajada === 0) return vento;
  const w = (2 * Math.PI) / periodo;
  const gust = 0.6 * Math.sin(w * t)
    + 0.3 * Math.sin(w * t * 1.7 + 1.1)
    + 0.1 * Math.sin(w * t * 2.9 + 2.3);
  return clamp(vento + rajada * gust, -1, 1);
}

function physics() {
  const a = (values.direcao * Math.PI) / 180;
  return {
    fall: values.gravidade,
    wind: windAt(state.simTime),
    windX: Math.cos(a),
    windZ: Math.sin(a),
    talude: values.talude,
  };
}

function rainPerStep() {
  const n = sources.length / 3;
  if (state.fill) {
    const left = state.fill.target - volume.settled;
    const stepsLeft = state.fill.steps - state.fill.used;
    if (left <= 0 || stepsLeft <= 0) {
      finishFill();
      return 0;
    }
    state.fill.used++;
    return Math.ceil(left / stepsLeft);
  }
  if (!state.raining) return 0;
  return Math.max(1, Math.round(n * (values.chuva / 100) * RAIN_GAIN));
}

/** Solta k grãos pelas bocas do desenho, todos com a cor do instante.
    Um passo não pode soltar mais que uma leva por boca. */
function emit(k) {
  if (k <= 0 || volume.full) return;
  const m = sources.length / 3;
  if (m === 0) return;
  k = Math.min(k, m);
  const idx = lutIndex(state.pos);
  let placed = 0;
  for (let t = 0; t < k * 2 && placed < k; t++) {
    const s = ((Math.random() * m) | 0) * 3;
    const packed = lut[(((Math.random() * 4) | 0) << 10) | idx];
    const r = TO_LINEAR[packed & 255];
    const g = TO_LINEAR[(packed >>> 8) & 255];
    const b = TO_LINEAR[(packed >>> 16) & 255];
    if (volume.emit(sources[s], sources[s + 1], sources[s + 2], r, g, b)) placed++;
  }
  state.pos += placed * DRIFT_PER_GRAIN * values.deriva;
}

function stepOnce() {
  emit(rainPerStep());
  volume.step(physics());
  state.simTime += 1 / STEP_HZ;
}

// ---------- o preenchimento ----------

function startFill() {
  resetScene();
  state.fill = {
    target: Math.min(MAX_SETTLED, Math.round(volume.capacity * (values.nivel / 100))),
    steps: Math.max(1, Math.round(values.duracao * STEP_HZ)),
    used: 0,
  };
  state.fase = 'enchendo';
  press('encher', true);
}

function finishFill() {
  state.fill = null;
  state.fase = 'cheio';
  press('encher', false);
}

function resetScene() {
  state.fill = null;
  state.fase = 'parado';
  state.simTime = 0;
  state.pos = (values.semente % 97) / 97;
  press('encher', false);
  volume.reseed(values.semente);
  volume.clear();
  scene.reset();
  updateHud();
}

// ---------- laço ----------

let lastFrame = performance.now();
let accumulator = 0;
let frameNo = 0;
const stats = { frames: 0, steps: 0, simMs: 0 };

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!volume) return;

  if (!state.paused) {
    accumulator = Math.min(accumulator + dt * STEP_HZ * values.velocidade, MAX_STEPS_PER_FRAME);
    const steps = accumulator | 0;
    accumulator -= steps;
    const t0 = performance.now();
    let done = 0;
    for (let s = 0; s < steps; s++) {
      stepOnce();
      stats.steps++;
      done++;
      if (performance.now() - t0 > SIM_BUDGET_MS) {
        accumulator = 0;
        break;
      }
    }
    stats.simMs += performance.now() - t0;
    state.slow = done < steps;
    syncClouds();
  }

  scene.render();
  stats.frames++;
  if (++frameNo % 10 === 0) updateHud();
}

function syncClouds() {
  const dirty = volume.takeDirty();
  scene.pushSettled(volume.positions, volume.colors, dirty.from, dirty.count);
  scene.updateFlying(volume);
}

const FASE_LABEL = { parado: '', enchendo: 'enchendo', cheio: 'cheio' };

function updateHud() {
  if (!volume) return;
  const parts = [
    `${volume.settled.toLocaleString('pt-BR')} grãos`,
    `${state.simTime.toFixed(1)} s`,
  ];
  const fase = FASE_LABEL[state.fase];
  if (fase) parts.push(fase);
  if (state.fase === 'enchendo' && state.fill) {
    parts.push(`${Math.min(99, Math.round((volume.settled / state.fill.target) * 100))}%`);
  }
  if (state.paused) parts.push('pausa');
  else if (state.slow) parts.push('câmera lenta');
  hudEl.textContent = parts.join(' · ');
}

// ---------- controles ----------

function setPalette(name) {
  state.palette = name;
  lut = buildLut(PALETTES[name].stops);
  state.pos += 0.045;
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.palette === name));
  });
  syncUrl();
}

function setRain(on) {
  state.raining = on;
  press('chuva', on);
  syncUrl();
}

function setBox(on) {
  state.box = on;
  scene.setBox(on);
  press('caixa', on);
  syncUrl();
}

/** O descritor da marca — mesmo texto do lockup oficial. */
function setDescritor(on) {
  state.descritor = on;
  document.getElementById('descritor').classList.toggle('descritor--off', !on);
  press('descritor-btn', on);
  syncUrl();
}

function toggleFill() {
  if (state.fill) {
    finishFill();
    return;
  }
  startFill();
}

function togglePause() {
  state.paused = !state.paused;
  press('pausa', state.paused);
  updateHud();
}

function stepManual() {
  state.paused = true;
  press('pausa', true);
  stepOnce();
  syncClouds();
  updateHud();
}

function savePng() {
  scene.render();
  canvas.toBlob((blob) => blob && download(blob, `tera-areia3d-${volume.settled}.png`));
}

function toggleRecord() {
  if (recorder) {
    recorder.stop();
    return;
  }
  const mime = REC_MIMES.find((m) => window.MediaRecorder?.isTypeSupported(m));
  if (!mime) {
    hudEl.textContent = 'gravação não suportada neste navegador';
    return;
  }
  const chunks = [];
  recorder = new MediaRecorder(canvas.captureStream(60), { mimeType: mime });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    download(new Blob(chunks, { type: mime }), `tera-areia3d-${Math.round(state.simTime)}s.webm`);
    recorder = null;
    press('gravar', false);
  };
  recorder.start();
  press('gravar', true);
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function cyclePalette() {
  const names = Object.keys(PALETTES);
  setPalette(names[(names.indexOf(state.palette) + 1) % names.length]);
}

function onParam(key) {
  if (key === 'semente') resetScene();
  if (key === 'corte') scene.setClip(values.corte / 100);
  if (key === 'orbita') scene.setAutoRotate(values.orbita);
  syncUrl();
}

let urlTimer = 0;
function syncUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    // a forma é lida na carga: sem ela aqui, esta reescrita apagaria a escolha
    const q = toSearch(values, {
      paleta: state.palette === 'plasma' ? undefined : state.palette,
      forma: forma === DEFAULT_SHAPE ? undefined : forma,
      chovendo: state.raining || undefined,
      caixa: state.box || undefined,
      semdescritor: state.descritor ? undefined : true,
    });
    history.replaceState(null, '', q ? `?${q}` : location.pathname);
  }, URL_DEBOUNCE_MS);
}

const KEYS = {
  a: () => panel.toggle(),
  b: () => setBox(!state.box),
  c: resetScene,
  d: () => setDescritor(!state.descritor),
  e: toggleFill,
  g: toggleRecord,
  p: cyclePalette,
  r: () => setRain(!state.raining),
  s: savePng,
  ' ': togglePause,
  '.': stepManual,
};

function wireUi() {
  wireShapeButtons(forma);
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palette));
  });
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  on('chuva', () => setRain(!state.raining));
  on('encher', toggleFill);
  on('caixa', () => setBox(!state.box));
  on('descritor-btn', () => setDescritor(!state.descritor));
  on('pausa', togglePause);
  on('limpar', resetScene);
  on('png', savePng);
  on('gravar', toggleRecord);
  on('ajustes', () => panel.toggle());

  document.addEventListener('keydown', (e) => {
    const onField = e.target instanceof Element && e.target.matches('input, button');
    if (e.metaKey || e.ctrlKey || e.altKey || onField) return;
    const fn = KEYS[e.key.toLowerCase()];
    if (!fn) return;
    e.preventDefault();
    fn();
  });

  const resize = () => scene.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  window.addEventListener('resize', resize);
  resize();
}

async function init() {
  const wordmark = await loadWordmark(forma);
  const mask = buildMask(wordmark);
  sources = buildSources(mask);
  volume = new SandVolume(GRID.nx, GRID.ny, GRID.nz, MAX_SETTLED, MAX_FLYING);
  volume.setWalls((x, y) => mask[y * GRID.nx + x] !== 0);
  volume.reseed(values.semente);
  scene = new Scene3D(canvas, { ...GRID, maxSettled: MAX_SETTLED, maxFlying: MAX_FLYING });
  scene.setClip(values.corte / 100);
  scene.setAutoRotate(values.orbita);

  panel = new Panel(values, onParam, '3d');
  wireUi();
  setPalette(state.palette);
  setRain(state.raining);
  setBox(state.box);
  setDescritor(state.descritor);
  panel.sync();
  state.pos = (values.semente % 97) / 97;
  if (query.has('encher')) startFill();
  requestAnimationFrame(frame);

  window.__areia3d = {
    get volume() { return volume; },
    scene, state, values, stats, panel, physics, sources, startFill,
    run(n = 1) {
      for (let i = 0; i < n; i++) stepOnce();
      syncClouds();
      scene.render();
      updateHud();
    },
  };
}

init();
