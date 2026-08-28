/* Lab 02 · Areia · Taipa — o wordmark como parede de taipa digital.

   A taipa é a construção de terra socada em camadas: cada leva de barro é
   compactada sobre a anterior, e a parede pronta carrega a listra horizontal de
   todas elas. É exatamente o que a areia dos outros labs faz por queda — aqui a
   parede já nasce pronta e o que trabalha é a LUZ.

   O desenho vira um monólito extrudado (a mesma máscara dos outros labs), e o
   material é um shader que fabrica os estratos por posição: altura → camada,
   camada → cor da paleta, com grão de agregado, sombra de compactação na base
   de cada leva — e o lado digital: costuras de luz biolum entre estratos,
   uma linha de leitura que varre a parede, e um glitch que troca o matiz de uma
   camada por um instante, como um dado corrompido.

   Nada é textura de arquivo: a parede inteira é procedural, e os mesmos
   parâmetros do painel (camada, deriva, turbulência, profundidade, órbita)
   governam matéria e movimento. */

import {
  loadWordmark, fitWordmark, rasterizeWordmark,
  shapeFromSearch, wireShapeButtons, DEFAULT_SHAPE,
} from './wordmark.js?v=32';
import { PALETTES, hexToRgb } from './palette.js?v=32';
import { fromSearch, toSearch } from './params.js?v=32';
import { Panel } from './panel.js?v=32';
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const GRID = { nx: 512, ny: 288, nz: 44 };   // resolução da máscara e espessura da parede
const FIT = { marginX: 0.05, marginY: 0.1, yBias: 0.5 };
// componentes sRGB crus: THREE.Color linearizaria (ColorManagement fica ligado
// por padrão) e a névoa afundaria num preto mais fundo que o palco do CSS
const FUNDO = hexToRgb('#0A0908').map((v) => v / 255);
const URL_DEBOUNCE_MS = 400;

const canvas = document.getElementById('areia');
const hudEl = document.getElementById('hud');
const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);
const forma = shapeFromSearch();

const state = {
  palette: PALETTES[query.get('paleta')] ? query.get('paleta') : 'plasma',
  girar: !query.has('parado'),
  paused: false,
  descritor: !query.has('semdescritor'),
  tempo: 0,
};

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let mesh = null;
let material = null;
let panel = null;
let triangulos = 0;

const press = (id, on) => document.getElementById(id)?.setAttribute('aria-pressed', String(on));

// ---------- a parede ----------

/** Rasteriza o wordmark na resolução da grade, com Y para cima. */
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

/** Extruda a máscara numa casca de quads — só as faces que se veem.

    Cada categoria de face sai em CORRIDAS (uma fileira de células vira um quad
    só), senão a parede custaria centenas de milhares de triângulos à toa.
    O lado da normal vem de qual vizinho é sólido; a ordem dos vértices não
    importa porque o material é DoubleSide e o shader vira a normal para a
    câmera — o degrau de pixel da silhueta é proposital, é a mesma matéria
    quantizada dos outros labs. */
function buildWall(mask) {
  const { nx, ny, nz } = GRID;
  const pos = [];
  const nrm = [];
  const solid = (x, y) => x >= 0 && x < nx && y >= 0 && y < ny && mask[y * nx + x] !== 0;
  const quad = (a, b, c, d, n) => {
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    for (let i = 0; i < 6; i++) nrm.push(...n);
  };
  const z0 = -nz / 2;
  const z1 = nz / 2;

  // frente e costas: corridas horizontais de células sólidas
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx;) {
      if (!solid(x, y)) { x++; continue; }
      let x2 = x;
      while (x2 < nx && solid(x2, y)) x2++;
      quad([x, y, z1], [x2, y, z1], [x2, y + 1, z1], [x, y + 1, z1], [0, 0, 1]);
      quad([x, y, z0], [x2, y, z0], [x2, y + 1, z0], [x, y + 1, z0], [0, 0, -1]);
      x = x2;
    }
  }
  // laterais: corridas verticais em cada plano entre colunas
  for (let x = 0; x <= nx; x++) {
    for (let y = 0; y < ny;) {
      const dir = (solid(x, y) ? 1 : 0) - (solid(x - 1, y) ? 1 : 0);
      if (dir === 0) { y++; continue; }
      let y2 = y;
      while (y2 < ny && ((solid(x, y2) ? 1 : 0) - (solid(x - 1, y2) ? 1 : 0)) === dir) y2++;
      quad([x, y, z0], [x, y2, z0], [x, y2, z1], [x, y, z1], [-dir, 0, 0]);
      y = y2;
    }
  }
  // topos e bases: corridas horizontais em cada plano entre linhas
  for (let y = 0; y <= ny; y++) {
    for (let x = 0; x < nx;) {
      const dir = (solid(x, y) ? 1 : 0) - (solid(x, y - 1) ? 1 : 0);
      if (dir === 0) { x++; continue; }
      let x2 = x;
      while (x2 < nx && ((solid(x2, y) ? 1 : 0) - (solid(x2, y - 1) ? 1 : 0)) === dir) x2++;
      quad([x, y, z0], [x2, y, z0], [x2, y, z1], [x, y, z1], [0, -dir, 0]);
      x = x2;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  g.translate(-nx / 2, -ny / 2, 0);
  triangulos = pos.length / 9;
  return g;
}

// ---------- a matéria ----------

/** A paleta como textura 1024×1, cíclica — o shader lê a cor do estrato dela. */
function lutTexture(stops) {
  const N = 1024;
  const rgb = stops.map(hexToRgb);
  const data = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    const t = (i / N) * rgb.length;
    const k = Math.floor(t);
    const f = t - k;
    const a = rgb[k % rgb.length];
    const b = rgb[(k + 1) % rgb.length];
    data[i * 4] = a[0] + (b[0] - a[0]) * f;
    data[i * 4 + 1] = a[1] + (b[1] - a[1]) * f;
    data[i * 4 + 2] = a[2] + (b[2] - a[2]) * f;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, 1);
  // SEM colorSpace, de propósito: marcada como sRGB o sampler devolveria a cor
  // LINEARIZADA, e este shader cru não re-encoda na saída — a paleta da marca
  // sairia mais escura e saturada que os hex, diferente dos outros três labs,
  // que consomem os stops como bytes crus. Decode sem encode é meio caminho.
  tex.wrapS = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** O brilho do palco: radial quente no centro, um halo biolum, nada nas bordas. */
function palcoTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(64, 54, 38, 0.55)');
  g.addColorStop(0.45, 'rgba(24, 34, 44, 0.22)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const VERT = /* glsl */`
varying vec3 vPos;
varying vec3 vWorld;
varying vec3 vNorm;
void main() {
  vPos = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNorm = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D uLut;
uniform float uTempo;
uniform float uCamada;      // altura de um estrato, em células
uniform float uDeriva;      // velocidade da cor pela paleta
uniform float uGlitch;      // 0..1 — quanta corrupção digital
uniform float uAltura;      // altura total da parede (para a varredura)
uniform vec3 uEye;
uniform vec3 uFundo;
varying vec3 vPos;
varying vec3 vWorld;
varying vec3 vNorm;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  float h = max(uCamada, 2.0);
  float nivel = (vPos.y + 1024.0) / h;       // deslocado para ficar positivo
  float camada = floor(nivel);
  float f = fract(nivel);                    // 0 = base da leva, 1 = topo

  // cor do estrato: camadas VIZINHAS são vizinhas na paleta — taipa tem
  // gradação, não sorteio. O passo pequeno percorre a paleta ao longo da
  // parede; o jitter só descasa a régua, sem quebrar a sequência.
  float idx = fract(camada * 0.016 + uTempo * uDeriva * 0.018 + hash(vec2(camada, 7.3)) * 0.03);
  vec3 cor = texture2D(uLut, vec2(idx, 0.5)).rgb;

  // grão do agregado: duas escalas de pedrisco, quantizadas como a matéria do lab
  float g1 = hash(floor(vec2(vPos.x * 0.8 + vPos.z * 0.6, vPos.y * 1.4)) + camada * 13.1);
  float g2 = hash(floor(vec2(vPos.x * 0.22 + camada * 3.7, vPos.z * 0.5 + vPos.y * 0.16)));
  cor *= 0.85 + 0.22 * g1;
  cor *= 0.90 + 0.16 * g2;

  // varredura digital fina: a cada 4 células uma linha levemente mais funda,
  // como as passadas do soquete — é o que diz "digital" sem virar ruído de TV
  cor *= 0.95 + 0.05 * step(0.5, fract(vPos.y * 0.25));

  // compactação: a base de cada leva é mais socada, mais escura — a listra da taipa
  cor *= 0.70 + 0.30 * smoothstep(0.0, 0.42, f);

  // glitch: de tempos em tempos uma camada lê corrompida e troca o matiz
  float janela = floor(uTempo * 2.5);
  float sorteio = hash(vec2(camada * 1.7, janela));
  float gl = step(1.0 - uGlitch * 0.22, sorteio);
  cor = mix(cor, cor.brg * 1.15, gl * 0.6);

  // costura de luz: junta fina entre estratos; só algumas acendem, e pulsam
  float aceso = step(0.60, hash(vec2(camada, 3.0)));
  float borda = 1.0 - smoothstep(0.0, 0.09, min(f, 1.0 - f));
  float pulso = 0.5 + 0.5 * sin(uTempo * 1.3 + camada * 1.9);
  float costura = borda * aceso * pulso;

  // varredura: uma linha de leitura sobe pela parede inteira, sem pressa
  float alvo = mod(uTempo * uAltura * 0.06, uAltura * 1.5) - uAltura * 0.75;
  float sweep = exp(-pow(vPos.y - alvo, 2.0) / 26.0);

  // luz: chave quente do alto à direita, preenchimento frio do outro lado,
  // e o fresnel biolum que recorta a silhueta contra o escuro
  vec3 N = normalize(vNorm);
  vec3 V = normalize(uEye - vWorld);
  if (dot(N, V) < 0.0) N = -N;               // DoubleSide: a normal olha para quem vê
  vec3 L1 = normalize(vec3(0.55, 0.72, 0.42));
  vec3 L2 = normalize(vec3(-0.65, -0.12, 0.48));
  float dif = max(dot(N, L1), 0.0);
  float fill = max(dot(N, L2), 0.0);
  vec3 luz = vec3(0.20)
    + vec3(1.10, 1.02, 0.88) * dif * 1.25
    + vec3(0.26, 0.40, 0.58) * fill * 0.45;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  vec3 biolum = vec3(0.19, 0.77, 1.0);
  vec3 saida = cor * luz
    + biolum * costura * 0.85
    + (biolum * 0.5 + cor) * sweep * 0.5
    + (biolum * 0.7 + vec3(0.30)) * fres * 0.5;

  // profundidade atmosférica: o que está longe afunda no fundo do palco
  float d = clamp((length(uEye - vWorld) - 380.0) / 1100.0, 0.0, 1.0);
  saida = mix(saida, uFundo, d * 0.5);

  gl_FragColor = vec4(saida, 1.0);
}
`;

// ---------- parâmetros → uniformes ----------

function applyValues() {
  const u = material.uniforms;
  u.uCamada.value = Math.max(2, values.camada / 6);
  u.uDeriva.value = values.deriva;
  u.uGlitch.value = values.turbulencia / 0.6;
  mesh.scale.z = Math.max(0.08, values.profundidade / 12);
  controls.autoRotateSpeed = values.orbita * 4;
}

let urlTimer = 0;
function writeUrl() {
  // só o que este lab usa entra na URL: um ?preset= vindo de outro lab traria
  // vento e rajada a tiracolo, parâmetros que aqui não fazem nada
  const vis = panel ? Object.fromEntries(panel.keys.map((k) => [k, values[k]])) : values;
  const q = toSearch(vis, {
    paleta: state.palette === 'plasma' ? undefined : state.palette,
    forma: forma === DEFAULT_SHAPE ? undefined : forma,
    parado: state.girar ? undefined : true,
    semdescritor: state.descritor ? undefined : true,
  });
  history.replaceState(null, '', q ? `?${q}` : location.pathname);
}

function syncUrl() {
  if (material) applyValues();
  clearTimeout(urlTimer);
  urlTimer = setTimeout(writeUrl, URL_DEBOUNCE_MS);
}

/** Os botões de forma recarregam lendo location.search NA HORA — um ajuste de
    slider feito há menos de 400 ms ainda estaria só no timer e se perderia.
    O clique em captura escoa a URL antes de o handler de navegação ler. */
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element) || !e.target.closest('[data-forma]')) return;
  clearTimeout(urlTimer);
  writeUrl();
}, true);

// ---------- controles ----------

function setPalette(name) {
  state.palette = name;
  const velha = material.uniforms.uLut.value;
  material.uniforms.uLut.value = lutTexture(PALETTES[name].stops);
  velha?.dispose();
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.palette === name));
  });
  syncUrl();
}

function setGirar(on) {
  state.girar = on;
  controls.autoRotate = on;
  press('girar', on);
  syncUrl();
}

function setDescritor(on) {
  state.descritor = on;
  document.getElementById('descritor')?.classList.toggle('descritor--off', !on);
  press('descritor-btn', on);
  syncUrl();
}

function savePng() {
  renderer.render(scene, camera);      // garante o quadro no buffer antes do blob
  // o canvas WebGL é transparente — o palco escuro é o gradiente do CSS. O PNG
  // precisa dele composto, senão a parede sai flutuando em transparência.
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  const g = ctx.createRadialGradient(
    out.width / 2, out.height * 0.32, out.width * 0.04,
    out.width / 2, out.height * 0.32, out.width * 0.75,
  );
  g.addColorStop(0, '#17130e');
  g.addColorStop(0.56, '#0A0908');
  g.addColorStop(1, '#050403');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tera-taipa.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

const KEYS = {
  a: () => panel.toggle(),
  d: () => setDescritor(!state.descritor),
  g: () => setGirar(!state.girar),
  p: () => {
    const names = Object.keys(PALETTES);
    setPalette(names[(names.indexOf(state.palette) + 1) % names.length]);
  },
  s: savePng,
  ' ': () => { state.paused = !state.paused; press('pausa', state.paused); },
};

function wireUi() {
  wireShapeButtons(forma);
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palette));
  });
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  on('girar', () => setGirar(!state.girar));
  on('pausa', KEYS[' ']);
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

// ---------- laço ----------

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let last = performance.now();
const perf = { fps: 0, acc: 0, n: 0 };

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dtReal = (now - last) / 1000;
  const dt = Math.min(0.05, dtReal);       // o clamp protege a animação, não a métrica
  last = now;

  if (!state.paused) state.tempo += dt * values.velocidade;
  material.uniforms.uTempo.value = state.tempo;
  controls.update();
  material.uniforms.uEye.value.copy(camera.position);
  renderer.render(scene, camera);

  perf.acc += dtReal;                      // fps com o tempo REAL, senão o HUD nunca desce de 20
  perf.n++;
  if (perf.acc >= 0.5) {
    perf.fps = Math.round(perf.n / perf.acc);
    perf.acc = 0;
    perf.n = 0;
    updateHud();
  }
}

function updateHud() {
  const estratos = Math.round(GRID.ny / Math.max(2, values.camada / 6));
  const parts = [
    `${estratos} estratos`,
    `${(triangulos / 1000).toFixed(1)} mil triângulos`,
    `${perf.fps} fps`,
  ];
  if (state.paused) parts.push('pausa');
  hudEl.textContent = parts.join(' · ');
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
    const mask = buildMask(wordmark);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);       // o palco é o gradiente do CSS

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 1, 5000);
    camera.position.set(60, 40, 640);

    material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.DoubleSide,
      uniforms: {
        uLut: { value: lutTexture(PALETTES[state.palette].stops) },
        uTempo: { value: 0 },
        uCamada: { value: 8 },
        uDeriva: { value: values.deriva },
        uGlitch: { value: 0.25 },
        uAltura: { value: GRID.ny },
        uEye: { value: new THREE.Vector3() },
        uFundo: { value: new THREE.Vector3(...FUNDO) },
      },
    });

    mesh = new THREE.Mesh(buildWall(mask), material);
    scene.add(mesh);

    // o palco: um brilho elíptico no chão, aditivo e discreto — sem ele a
    // parede flutua num vazio; com ele existe um lugar onde ela está de pé
    const palco = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID.nx * 2.4, GRID.nx * 1.4),
      new THREE.MeshBasicMaterial({
        map: palcoTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    palco.rotation.x = -Math.PI / 2;
    palco.position.y = -GRID.ny / 2 - 14;
    scene.add(palco);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = state.girar;
    controls.minDistance = GRID.nx * 0.25;
    controls.maxDistance = GRID.nx * 4;

    panel = new Panel(values, syncUrl, 'taipa');
    wireUi();
    applyValues();
    setPalette(state.palette);
    setDescritor(state.descritor);
    press('girar', state.girar);
    panel.sync();
    resize();
    requestAnimationFrame(frame);

    window.__taipa = {
      renderer, scene, camera, controls, mesh, material, state, values, triangulos,
      /** Quadro manual para diagnóstico — aba em segundo plano não recebe rAF. */
      quadro(tempo = state.tempo) {
        material.uniforms.uTempo.value = tempo;
        controls.update();
        material.uniforms.uEye.value.copy(camera.position);
        renderer.render(scene, camera);
      },
    };
  } catch (err) {
    fail(err.message);
    throw err;
  }
}

init();
