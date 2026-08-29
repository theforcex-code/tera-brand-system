/* Lab 02 · Areia — o wordmark Téra como areia interativa (à la This is Sand).
   Modo Vão: as letras são vãos; a areia só existe dentro delas e o logo nasce em
   estratos. Modo Duna: o logo é parede em Branco Cal e a areia o soterra.

   Toda a física e o tempo vêm de params.js: o painel escreve em `values`, este
   módulo traduz `values` em regra por passo. A cena inteira cabe na URL. */

import {
  loadWordmark, fitWordmark, rasterizeWordmark, columnRunTops,
  shapeFromSearch, wireShapeButtons, DEFAULT_SHAPE,
} from './wordmark.js?v=33';
import { SandField } from './sand.js?v=33';
import { PALETTES, buildLut, packRGB, hexToRgb, lutIndex } from './palette.js?v=33';
import { fromSearch, toSearch, DEFAULTS } from './params.js?v=33';
import { Panel } from './panel.js?v=33';

const forma = shapeFromSearch();

const STEP_HZ = 120;            // passos de simulação por segundo a 1×
const MAX_STEPS_PER_FRAME = 6;
const SIM_BUDGET_MS = 11;       // acima disso o frame desiste de passos extras
const MAX_CELLS = 4.4e6;        // teto da grade (1440p@1x, 1707×898@1.5x); acima, meio DPR
const STREAM_RADIUS = 0.15;     // raio do jato em frações da espessura do traço
const SNAP_RADIUS = 3;          // fora de um vão, puxa o jato para o vão a até 3 raios
const RESIZE_W_TOLERANCE = 0.02; // resize menor que isto não reconstrói (barra de URL móvel)
const RESIZE_H_TOLERANCE = 0.25;
const STREAM_DENSITY = 0.75;    // preenchimento do disco do jato
const DRAG_DENSITY = 0.35;      // ao arrastar rápido, rastro mais fino
const RAIN_GAIN = 0.25;         // grãos por passo = fontes × chuva% × isto
const DRIFT_PER_GRAIN = 1 / 120000; // a 1× de deriva, um ciclo de paleta a cada 120k grãos
const JUMP_PER_PRESS = 0.045;   // cada novo toque abre um estrato visível
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 24;
const MAX_EMITTERS = 8;
const URL_DEBOUNCE_MS = 400;
const REC_MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

const INK = { subsolo: '#0A0908', cal: '#F2EFE9', vao: '#171219' };

const canvas = document.getElementById('areia');
const ctx = canvas.getContext('2d', { alpha: true });
const hintEl = document.getElementById('hint');
const hudEl = document.getElementById('hud');

const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);
const state = {
  mode: query.get('modo') === 'duna' ? 'duna' : 'vao',
  palette: PALETTES[query.get('paleta')] ? query.get('paleta') : 'plasma',
  raining: query.has('chovendo'),
  paused: false,
  fill: null,                   // preenchimento cronometrado em curso
  slow: false,                  // a simulação não está acompanhando o relógio
  simTime: 0,                   // segundos de simulação desde o último recomeço
  pos: 0,                       // posição cíclica na paleta (deriva com o despejo)
  emitters: [],                 // fluxos automáticos (duplo toque)
  hinted: false,
};

let wordmark = null;
let field = null;
let raster = null;
let fit = null;
let panel = null;
let builtCss = { w: 0, h: 0 };  // viewport CSS no momento do build
let lut = buildLut(PALETTES[state.palette].stops);
let rainSources = new Int32Array(0);
let streamRadius = 3;
let recorder = null;
const pointers = new Map();
let lastTap = { t: 0, x: 0, y: 0 };

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const press = (id, on) => document.getElementById(id)?.setAttribute('aria-pressed', String(on));

// ---------- grade ----------

function gridScale(cssW, cssH) {
  let scale = window.devicePixelRatio || 1;
  while (Math.ceil(cssW * scale) * Math.ceil(cssH * scale) > MAX_CELLS) scale /= 2;
  return scale;
}

function build() {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  const scale = gridScale(cssW, cssH);
  const w = Math.ceil(cssW * scale);
  const h = Math.ceil(cssH * scale);
  canvas.width = w;
  canvas.height = h;
  // tamanho CSS fixo (ancorado embaixo): resizes pequenos só recortam, não apagam
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  builtCss = { w: cssW, h: cssH };
  field = new SandField(w, h);
  fit = fitWordmark(wordmark, w, h, {
    marginX: w < h ? 0.035 : 0.07,   // em retrato a largura é o recurso escasso
    marginY: 0.17,
    yBias: state.mode === 'duna' ? 0.4 : 0.5,
  });
  raster = rasterizeWordmark(wordmark, w, h, fit);
  applyMode();
}

function applyMode() {
  const { w, h } = field;
  const solid = new Uint8Array(w * h);
  const inside = raster.inside;
  const isVao = state.mode === 'vao';
  for (let i = 0; i < solid.length; i++) solid[i] = isVao ? inside[i] ^ 1 : inside[i];

  const region = isVao ? raster.bbox : { x0: 0, y0: 0, x1: w, y1: h };
  const rainBox = isVao ? raster.bbox : { x0: 0, y0: 0, x1: w, y1: 1 };
  rainSources = columnRunTops(solid, w, rainBox);

  const subsolo = packRGB(...hexToRgb(INK.subsolo));
  field.configure({
    solid,
    region,
    emptyPix: isVao ? packRGB(...hexToRgb(INK.vao)) : subsolo,
    wallPix: isVao ? subsolo : packRGB(...hexToRgb(INK.cal)),
  });
  resetScene();
}

/** Zera a areia e o relógio, mantendo a semente — a cena volta a ser a mesma. */
function resetScene() {
  state.emitters = [];
  state.fill = null;
  state.simTime = 0;
  state.pos = (values.semente % 97) / 97;
  press('encher', false);
  field.reseed(values.semente);
  field.clear();
  streamRadius = values.jato > 0
    ? values.jato
    : clamp(fit.strokePx * STREAM_RADIUS, 1.5, 12);
  field.draw(ctx, true);
  updateHud();
}

// ---------- física e tempo ----------

/** Vento no instante t: constante + rajada (soma de senóides, sem aleatório). */
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
  return {
    fall: values.gravidade,
    wind: windAt(state.simTime),
    talude: values.talude,
    spread: values.dispersao,
    erosion: values.erosao,
  };
}

/** Grãos de chuva neste passo: taxa livre, ou a taxa que fecha o cronômetro. */
function rainPerStep() {
  const sources = rainSources.length >> 1;
  if (state.fill) {
    const left = state.fill.target - field.count;
    const stepsLeft = state.fill.steps - state.fill.used;
    if (left <= 0 || stepsLeft <= 0) {
      state.fill = null;
      press('encher', false);
      return 0;
    }
    state.fill.used++;
    return Math.ceil(left / stepsLeft);
  }
  if (!state.raining) return 0;
  return Math.max(1, Math.round(sources * (values.chuva / 100) * RAIN_GAIN));
}

function emit() {
  const idx = lutIndex(state.pos);
  let n = 0;
  for (const p of pointers.values()) {
    if (!p.pour) continue;
    const at = pourPoint(p.x, p.y);
    if (at) n += field.spawnDisc(at.x, at.y, streamRadius, STREAM_DENSITY, lut, idx);
  }
  for (const em of state.emitters) {
    n += field.spawnDisc(em.x, em.y, streamRadius, STREAM_DENSITY, lut, idx);
  }
  const k = rainPerStep();
  if (k > 0) n += field.rain(rainSources, k, lut, idx);
  state.pos += n * DRIFT_PER_GRAIN * values.deriva;
}

function stepOnce() {
  emit();
  field.step(physics());
  state.simTime += 1 / STEP_HZ;
}

// ---------- entrada ----------

function toGrid(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * field.w) / rect.width,
    y: ((e.clientY - rect.top) * field.h) / rect.height,
  };
}

function dismissHint() {
  if (state.hinted) return;
  state.hinted = true;
  hintEl.classList.add('hint--off');
}

/** Ponto de despejo: a própria célula se é vão; senão, o vão mais próximo. */
function pourPoint(x, y) {
  const gx = x | 0;
  const gy = y | 0;
  if (field.isOpen(gx, gy)) return { x: gx, y: gy };
  return field.nearestOpen(gx, gy, Math.round(streamRadius * SNAP_RADIUS));
}

function toggleEmitter(x, y) {
  const near = 30 * (field.w / window.innerWidth);
  const idx = state.emitters.findIndex((e) => Math.hypot(e.x - x, e.y - y) < near);
  if (idx >= 0) {
    state.emitters = state.emitters.filter((_, i) => i !== idx);
    return;
  }
  const at = pourPoint(x, y);
  if (!at) return;
  state.emitters = [...state.emitters.slice(-(MAX_EMITTERS - 1)), at];
}

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    // ponteiro já encerrado (ou evento sintético): seguimos sem captura
  }
  dismissHint();
  const g = toGrid(e);
  const now = performance.now();
  const isDouble = now - lastTap.t < DOUBLE_TAP_MS
    && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < DOUBLE_TAP_PX;
  lastTap = { t: now, x: e.clientX, y: e.clientY };
  if (isDouble) {
    toggleEmitter(g.x, g.y);
    pointers.set(e.pointerId, { ...g, pour: false });
    return;
  }
  state.pos += JUMP_PER_PRESS;
  pointers.set(e.pointerId, { ...g, pour: true });
}

function onPointerMove(e) {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const g = toGrid(e);
  if (p.pour) spawnAlong(p, g);
  pointers.set(e.pointerId, { ...g, pour: p.pour });
}

function onPointerUp(e) {
  pointers.delete(e.pointerId);
}

/** Arrasto rápido: semeia ao longo do segmento para o rastro não ficar picotado. */
function spawnAlong(from, to) {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  const segs = Math.ceil(d / Math.max(1, streamRadius * 0.8));
  const idx = lutIndex(state.pos);
  let n = 0;
  for (let s = 1; s <= segs; s++) {
    const t = s / segs;
    const at = pourPoint(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    if (at) n += field.spawnDisc(at.x, at.y, streamRadius, DRAG_DENSITY, lut, idx);
  }
  state.pos += n * DRIFT_PER_GRAIN * values.deriva;
}

// ---------- laço ----------

let lastFrame = performance.now();
let accumulator = 0;
let frameNo = 0;
const stats = { frames: 0, steps: 0, simMs: 0, drawMs: 0 };

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (state.paused || !field) return;

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
  state.slow = done < steps;
  const t1 = performance.now();
  field.draw(ctx);
  stats.simMs += t1 - t0;
  stats.drawMs += performance.now() - t1;
  stats.frames++;
  if (++frameNo % 10 === 0) updateHud();
}

function updateHud() {
  if (!field) return;
  const parts = [`${field.count.toLocaleString('pt-BR')} grãos`, `${state.simTime.toFixed(1)} s`];
  if (state.fill) {
    parts.push(`${Math.min(99, Math.round((field.count / state.fill.target) * 100))}%`);
  }
  if (state.paused) parts.push('pausa');
  else if (state.slow) parts.push('câmera lenta');
  hudEl.textContent = parts.join(' · ');
}

// ---------- controles ----------

function setMode(mode) {
  if (mode === state.mode) return;
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  });
  build();
  syncUrl();
}

function setPalette(name) {
  state.palette = name;
  lut = buildLut(PALETTES[name].stops);
  state.pos += JUMP_PER_PRESS;
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.palette === name));
  });
  syncUrl();
}

function setRain(on) {
  state.raining = on;
  press('chuva', on);
  if (on) dismissHint();
  syncUrl();
}

/** Preenchimento cronometrado: enche `nivel`% da área em `duracao` segundos. */
function toggleFill() {
  if (state.fill) {
    state.fill = null;
    press('encher', false);
    return;
  }
  dismissHint();
  state.fill = {
    target: Math.round(field.capacity * (values.nivel / 100)),
    steps: Math.max(1, Math.round(values.duracao * STEP_HZ)),
    used: 0,
  };
  press('encher', true);
}

function togglePause() {
  state.paused = !state.paused;
  press('pausa', state.paused);
  updateHud();
}

/** Um passo só — útil com a simulação pausada. */
function stepManual() {
  if (!field) return;
  state.paused = true;
  press('pausa', true);
  stepOnce();
  field.draw(ctx);
  updateHud();
}

function clearSand() {
  if (!field) return;
  resetScene();
}

function savePng() {
  if (!field) return;
  canvas.toBlob((blob) => blob && download(blob, `tera-areia-${state.mode}-${field.count}.png`));
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
    download(new Blob(chunks, { type: mime }), `tera-areia-${state.mode}-${Math.round(state.simTime)}s.webm`);
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

/** Um parâmetro mudou no painel: aplica o que precisa de reação imediata. */
function onParam(key) {
  if (key === 'semente') resetScene();
  if (key === 'jato') {
    streamRadius = values.jato > 0 ? values.jato : clamp(fit.strokePx * STREAM_RADIUS, 1.5, 12);
  }
  syncUrl();
}

let urlTimer = 0;
function syncUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    // a forma é lida na carga: sem ela aqui, esta reescrita apagaria a escolha
    const q = toSearch(values, {
      modo: state.mode === 'duna' ? 'duna' : undefined,
      paleta: state.palette === 'plasma' ? undefined : state.palette,
      forma: forma === DEFAULT_SHAPE ? undefined : forma,
      chovendo: state.raining || undefined,
    });
    history.replaceState(null, '', q ? `?${q}` : location.pathname);
  }, URL_DEBOUNCE_MS);
}

const KEYS = {
  a: () => panel.toggle(),
  c: clearSand,
  e: toggleFill,
  g: toggleRecord,
  m: () => setMode(state.mode === 'vao' ? 'duna' : 'vao'),
  p: cyclePalette,
  r: () => setRain(!state.raining),
  s: savePng,
  ' ': togglePause,
  '.': stepManual,
};

function wireUi() {
  wireShapeButtons(forma);
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  });
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palette));
  });
  const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
  on('chuva', () => setRain(!state.raining));
  on('encher', toggleFill);
  on('pausa', togglePause);
  on('limpar', clearSand);
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

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  trackBarHeight();
  wireResize();
}

/** A barra inferior quebra em várias linhas no telefone: publica a altura real
    em --bar-h para o painel e a dica se apoiarem nela. */
function trackBarHeight() {
  const bar = document.querySelector('.bar--bottom');
  const apply = () => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`);
  apply();
  if (window.ResizeObserver) new ResizeObserver(apply).observe(bar);
}

function wireResize() {
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!field) {
        build();
        return;
      }
      const dw = Math.abs(window.innerWidth - builtCss.w) / builtCss.w;
      const dh = Math.abs(window.innerHeight - builtCss.h) / builtCss.h;
      if (dw > RESIZE_W_TOLERANCE || dh > RESIZE_H_TOLERANCE) build();
    }, 220);
  });
}

async function init() {
  wordmark = await loadWordmark(forma);
  panel = new Panel(values, onParam);
  wireUi();
  build();
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode));
  });
  setPalette(state.palette);
  setRain(state.raining);
  panel.sync();
  if (query.has('encher')) toggleFill();
  requestAnimationFrame(frame);
  // handle de diagnóstico (console): grade, estado, métricas e avanço síncrono
  window.__areia = {
    get field() { return field; },
    state,
    values,
    stats,
    panel,
    physics,
    defaults: DEFAULTS,
    run(n = 1) {
      for (let i = 0; i < n; i++) stepOnce();
      field.draw(ctx);
      updateHud();
    },
  };
}

init();
