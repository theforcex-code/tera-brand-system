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

import {
  loadWordmark, fitWordmark, rasterizeWordmark,
  shapeFromSearch, wireShapeButtons, DEFAULT_SHAPE,
} from './wordmark.js?v=29';
import { PALETTES, buildLut } from './palette.js?v=29';
import { SandGPU, WALL, EMPTY } from './gpu/sand-gpu.js?v=29';
import { OrbitCamera } from './gpu/camera.js?v=29';
import { fromSearch, toSearch } from './params.js?v=29';
import { Panel } from './panel.js?v=29';

/* Perfis de custo. A versão anterior enchia 13,5 milhões de grãos e desenhava
   TODOS a cada quadro — numa tela de 1,2 milhão de pixels, isso é ~11 grãos por
   pixel, quase todos escondidos atrás dos outros. Custo real, resultado
   invisível: a GPU ficava saturada o tempo inteiro e a máquina esquentava.
   O perfil médio guarda a mesma leitura com 6× menos matéria. */
const PERFIS = {
  leve:  { nx: 512,  ny: 288, nz: 32 },     // ~0,5 M grãos
  medio: { nx: 768,  ny: 432, nz: 64 },     // ~2,3 M grãos
  alto:  { nx: 1024, ny: 576, nz: 128 },    // ~8 M grãos — só com GPU sobrando
};
const FPS_ALVO = 60;                        // desenha na cadência da tela, até 60
const PASSOS_POR_SEGUNDO = 60;              // física em passo FIXO, independente do desenho
const MAX_PASSOS = 3;                       // teto de recuperação num quadro atrasado
const FIT = { marginX: 0.05, marginY: 0.1, yBias: 0.5 };
const CLEAR = [0.039, 0.035, 0.031, 1];
const DRIFT_PER_SECOND = 1 / 26;      // a 1× de deriva, um ciclo de paleta a cada 26 s
/* Vazão. A versão anterior soltava 90 mil grãos por passo — 144 mil por quadro,
   e a cavidade inteira fechava em meio segundo: não dava tempo de ver grão
   nenhum caindo, o logo simplesmente aparecia em blocos. Com 4 mil por passo o
   preenchimento leva uns 12 segundos e a areia volta a cair como chuva. */
const SPAWN_BASE = 4000;

const canvas = document.getElementById('areia');
const hudEl = document.getElementById('hud');
const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);
const perfilNome = PERFIS[query.get('q')] ? query.get('q') : 'medio';
const TARGET = PERFIS[perfilNome];
const forma = shapeFromSearch();

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

/* Passo fixo. A física precisa de intervalos IGUAIS: se um quadro avança dois
   passos e o seguinte nenhum, a areia anda aos trancos mesmo com o contador de
   fps cheio. O acumulador guarda o tempo que sobrou e o gasta em passos
   inteiros, todos do mesmo tamanho — a velocidade muda a CADÊNCIA dos passos,
   nunca quantos deles se amontoam num quadro. */

/** Nada se move? Só então vale pular física.

    A versão anterior espaçava os passos de 4 em 4 quadros para poupar a placa —
    e era isso que fazia a queda pulsar: os grãos em circulação andavam a 7
    posições por segundo enquanto a tela ia a 30. Agora o desconto só vale
    quando não há o que animar: cavidade cheia e fluxo desligado. A cor continua
    rolando de graça no vertex shader, então a peça nunca fica estática. */
function emRepouso() {
  return isFull() && values.fluxo <= 0.001;
}

let acumulado = 0;

/** Quantos passos de física cabem no tempo decorrido. */
function agenda(dt) {
  if (state.paused || !state.running) {
    acumulado = 0;
    return 0;
  }
  const passo = 1 / (PASSOS_POR_SEGUNDO * Math.max(0.1, values.velocidade));
  acumulado += emRepouso() ? dt * 0.1 : dt;
  let n = Math.floor(acumulado / passo);
  if (n > MAX_PASSOS) {          // atraso grande (aba voltando, GC): descarta o resto
    n = MAX_PASSOS;              // recuperar tudo viraria espiral de morte
    acumulado = 0;
  } else {
    acumulado -= n * passo;
  }
  return n;
}

let last = performance.now();
const INTERVALO = 1000 / FPS_ALVO;
const perf = { simMs: 0, drawMs: 0, fps: 0, passos: 0, acc: 0, n: 0 };

/** Um quadro: simular, mover a câmera, desenhar. Separado do rAF para poder ser
    chamado à mão em diagnóstico — aba em segundo plano não recebe rAF. */
function tick(dt) {
  const t0 = performance.now();
  const passos = agenda(dt);
  if (passos > 0) {
    const phys = physics();
    // cheio: as bocas estão tomadas e semear só gasta thread à toa
    const spawn = isFull() ? 0 : Math.round(SPAWN_BASE * (values.chuva / 100));
    for (let s = 0; s < passos; s++) sim.step(phys, spawn);
  }
  // relógio e deriva andam com o tempo real, não com o número de passos: assim a
  // rajada de vento e a rolagem da paleta não herdam o serrilhado da física
  if (!state.paused) state.simTime += dt;
  state.lutPos += dt * values.deriva * DRIFT_PER_SECOND;
  const t1 = performance.now();

  resize();
  // a paleta rola sempre: mesmo com a areia parada, o volume continua vivo
  sim.anim.roll = state.lutPos;
  sim.anim.zSpread = values.profundidade / 1000;
  sim.cut = (values.corte / 100) * dims.nz;
  cam.autoRotate = values.orbita;
  const vp = cam.update(canvas.width / canvas.height, dt, dims.nx * 0.05, dims.nx * 8);
  sim.render(vp, { x: dims.nx / 2, y: dims.ny * 0.5, z: dims.nz / 2 }, CLEAR);
  perf.passos += passos;
  return [t1 - t0, performance.now() - t1];
}

function frame(now) {
  requestAnimationFrame(frame);
  // aba escondida não desenha nem simula: em segundo plano isso só esquentava a placa
  if (document.hidden) {
    last = now;
    acumulado = 0;
    return;
  }
  const desde = now - last;
  // 0,8 do intervalo de folga: numa tela de 60 Hz o quadro chega a 16,67 ms, e um
  // teto exato de 16,67 o rejeitava por microssegundos — o período dobrava para
  // 33 ms e a queda ganhava um soluço a cada poucos quadros
  if (desde < INTERVALO * 0.8) return;
  last = now;
  const dt = Math.min(0.1, desde / 1000);
  const [simMs, drawMs] = tick(dt);

  perf.simMs += simMs;
  perf.drawMs += drawMs;
  perf.acc += dt;
  perf.n++;
  if (perf.acc >= 0.5) {
    perf.fps = Math.round(perf.n / perf.acc);
    perf.simMs /= perf.n;
    perf.drawMs /= perf.n;
    perf.passos = Math.round(perf.passos / perf.acc);
    updateHud();
    perf.acc = 0;
    perf.n = 0;
    perf.simMs = 0;
    perf.drawMs = 0;
    perf.passos = 0;
    sim.readCount().catch(() => {});
  }
}

function updateHud() {
  const pct = Math.min(100, Math.round((sim.count / capacity) * 100));
  const parts = [
    `${sim.count.toLocaleString('pt-BR')} grãos`,
    `${pct}%`,
    `${perf.fps} fps`,
    `${perf.passos}/s`,
    `sim ${perf.simMs.toFixed(1)} ms`,
  ];
  if (isFull()) parts.push('cheio · circulando');
  parts.push(perfilNome);
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
    // forma e perfil precisam sobreviver: são lidos na carga, e sem eles esta
    // reescrita apagava a escolha 400 ms depois de o lab abrir
    const q = toSearch(values, {
      paleta: state.palette === 'plasma' ? undefined : state.palette,
      forma: forma === DEFAULT_SHAPE ? undefined : forma,
      q: perfilNome === 'medio' ? undefined : perfilNome,
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
  wireShapeButtons(forma);
  document.querySelectorAll('[data-perfil]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.perfil === perfilNome));
    b.addEventListener('click', () => {         // muda o tamanho da grade: recarrega
      const q = new URLSearchParams(location.search);
      q.set('q', b.dataset.perfil);
      location.search = q.toString();
    });
  });
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
    const wordmark = await loadWordmark(forma);
    const probe = await navigator.gpu?.requestAdapter();
    if (!probe) throw new Error('WebGPU indisponível — use Chrome ou Edge recentes');
    // a profundidade é o que sobra do limite de buffer do adaptador
    const budget = Math.min(probe.limits.maxStorageBufferBindingSize, probe.limits.maxBufferSize);
    const nz = Math.max(16, Math.min(TARGET.nz, Math.floor(budget / 4 / (TARGET.nx * TARGET.ny))));
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
