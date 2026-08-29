/* Lab 02 · Areia · Faceta — o logo facetado como cristal 3D.

   O desenho que o cliente mandou já é lapidado: todo canto é uma dobra de 45 ou
   60 graus, como um mineral cortado. Este lab o trata como tal — extruda o
   contorno em um bloco com bisel e deixa a LUZ fazer o resto: uma chave quente,
   um rim biolum e um ambiente de painéis coloridos refletindo nas faces.

   O caminho da forma importa: o PNG é rasterizado, o contorno é PERSEGUIDO
   célula a célula e depois SIMPLIFICADO — os degraus de pixel colapsam nas
   diagonais verdadeiras do desenho. Extrudar a máscara crua daria serrilhado
   em cada dobra; aqui cada face é um plano só.

   As paletas viram humores de matéria: Plasma é vidro negro refletindo as
   quatro cores; Subsolo é obsidiana de terra; Cal é porcelana. */

import { PALETTES, hexToRgb } from './palette.js?v=33';
import { fromSearch, toSearch } from './params.js?v=33';
import { Panel } from './panel.js?v=33';
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

// a cópia local vem PRIMEIRO: as duas são byte-idênticas, e no deploy (só a
// pasta areia/ viaja) o caminho do monorepo pagaria um 404 em toda visita
const LOGO_URLS = ['logo/tera_facetado.png', '../brand/logo/tera_facetado.png'];
const TRACE_W = 480;          // resolução da perseguição de contorno
const RDP_EPS = 1.7;          // tolerância da simplificação, em células
const TARGET_W = 460;         // largura do logo no mundo
const URL_DEBOUNCE_MS = 400;

const canvas = document.getElementById('areia');
const hudEl = document.getElementById('hud');
const query = new URLSearchParams(location.search);
const values = fromSearch(location.search);

const state = {
  palette: PALETTES[query.get('paleta')] ? query.get('paleta') : 'plasma',
  girar: !query.has('parado'),
  descritor: !query.has('semdescritor'),
};

let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let mesh = null;
let material = null;
let panel = null;
let pmrem = null;
let envRT = null;    // o RENDER TARGET do ambiente — é ele que se descarta, não a textura
let shapes = [];
let stats = { lacos: 0, pontos: 0, triangulos: 0 };

const press = (id, on) => document.getElementById(id)?.setAttribute('aria-pressed', String(on));

// ---------- da imagem ao contorno ----------

const carregarImagem = (urls) => new Promise((ok, falha) => {
  const tenta = (i) => {
    if (i >= urls.length) return falha(new Error('logo facetado não carregou'));
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => tenta(i + 1);
    img.src = urls[i];
  };
  tenta(0);
});

/** Binariza na resolução de traço. O fundo é medido nas bordas da imagem —
    este logo é branco sobre preto, o do cliente era o contrário, e ninguém
    aqui deveria precisar saber qual é qual. */
function binariza(img) {
  const w = TRACE_W;
  const h = Math.round((img.naturalHeight * w) / img.naturalWidth);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const lum = (i) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  let acc = 0;
  let n = 0;
  for (let x = 0; x < w; x++) { acc += lum(x) + lum((h - 1) * w + x); n += 2; }
  for (let y = 0; y < h; y++) { acc += lum(y * w) + lum(y * w + w - 1); n += 2; }
  const fundo = acc / n;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    solid[i] = px[i * 4 + 3] > 128 && Math.abs(lum(i) - fundo) > 90 ? 1 : 0;
  }
  return { solid, w, h };
}

/** Persegue os contornos: cada célula sólida solta as arestas de borda com o
    sólido à DIREITA do sentido, e as arestas se encadeiam em laços.

    Com essa orientação os laços externos fecham com área com um sinal e os
    furos com o outro — a classificação sai de graça. Num vértice de pinça
    (duas regiões se tocando na diagonal) há duas saídas: vira-se sempre o mais
    à direita, que é o giro que mantém o sólido colado. */
function traceContours({ solid, w, h }) {
  const at = (x, y) => x >= 0 && x < w && y >= 0 && y < h && solid[y * w + x] === 1;
  const key = (x, y) => y * (w + 1) + x;
  const out = new Map();
  const add = (sx, sy, ex, ey) => {
    const k = key(sx, sy);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push({ sx, sy, ex, ey, used: false });
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y);
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!at(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const loops = [];
  for (const lista of out.values()) {
    for (const inicio of lista) {
      if (inicio.used) continue;
      const loop = [];
      let e = inicio;
      let guarda = 0;
      while (guarda++ < 1e6) {
        e.used = true;
        loop.push([e.sx, e.sy]);
        const cand = (out.get(key(e.ex, e.ey)) ?? []).filter((c) => !c.used || c === inicio);
        if (cand.length === 0) break;
        let prox = cand[0];
        if (cand.length > 1) {
          const dx = e.ex - e.sx;
          const dy = e.ey - e.sy;
          const nota = (c) => {
            const cross = dx * (c.ey - c.sy) - dy * (c.ex - c.sx);
            const dot = dx * (c.ex - c.sx) + dy * (c.ey - c.sy);
            return cross > 0 ? 0 : cross === 0 && dot > 0 ? 1 : 2;   // direita, reto, esquerda
          };
          cand.sort((a, b) => nota(a) - nota(b));
          prox = cand[0];
        }
        if (prox === inicio) break;      // fechou o laço
        e = prox;
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}

/** Douglas-Peucker: os degraus de pixel colapsam nas retas verdadeiras. */
function rdpOpen(pts, eps) {
  if (pts.length < 3) return pts;
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[pts.length - 1];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  let imax = -1;
  let dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dx * (pts[i][1] - y0) - dy * (pts[i][0] - x0)) / len;
    if (d > dmax) { dmax = d; imax = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return [
    ...rdpOpen(pts.slice(0, imax + 1), eps).slice(0, -1),
    ...rdpOpen(pts.slice(imax), eps),
  ];
}

function rdpLoop(pts, eps) {
  let far = 0;
  let dmax = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2;
    if (d > dmax) { dmax = d; far = i; }
  }
  const a = rdpOpen(pts.slice(0, far + 1), eps);
  const b = rdpOpen([...pts.slice(far), pts[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const areaAssinada = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
};

const dentro = (p, poly) => {
  let d = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
};

/** Laços → THREE.Shape com furos, já em coordenadas de mundo (Y para cima). */
function buildShapes(grade) {
  const loops = traceContours(grade).map((l) => rdpLoop(l, RDP_EPS));
  const s = TARGET_W / grade.w;
  const cx = grade.w / 2;
  const cy = grade.h / 2;
  const mundo = (l) => l.map(([x, y]) => [(x - cx) * s, (cy - y) * s]);

  // na convenção do traçado, laço externo e furo fecham com sinais opostos
  const outers = [];
  const holes = [];
  for (const l of loops) {
    (areaAssinada(l) > 0 ? outers : holes).push(l);
  }
  const formas = outers.map((l) => {
    const pts = mundo(l);
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    return { shape, raw: l, pts };
  });
  for (const furo of holes) {
    // o furo pertence ao menor externo que o contém
    const donos = formas
      .filter((f) => dentro(furo[0], f.raw))
      .sort((a, b) => Math.abs(areaAssinada(a.raw)) - Math.abs(areaAssinada(b.raw)));
    if (donos.length === 0) continue;
    const pts = mundo(furo);
    donos[0].shape.holes.push(new THREE.Path(pts.map(([x, y]) => new THREE.Vector2(x, y))));
  }
  stats.lacos = loops.length;
  stats.pontos = loops.reduce((n, l) => n + l.length, 0);
  return formas.map((f) => f.shape);
}

// ---------- a matéria ----------

function extrudir(depth) {
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2.2,
    bevelSegments: 2,
    curveSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  stats.triangulos = g.attributes.position.count / 3;
  return g;
}

const profundidadeAtual = () => 14 + values.profundidade * 3;   // 0..40 → 14..134

/** O ambiente que o cristal reflete: uma chave branca no alto e um painel por
    cor da paleta em volta. É ISTO que pinta as facetas — as cores da marca
    chegam no material como reflexo, não como tinta. */
function buildEnv(stops) {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x020202);
  const painel = (hex, forca, pos, sx, sy) => {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sy),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b).multiplyScalar(forca) }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    sc.add(m);
  };
  // as intensidades são de estúdio mesmo: um metal escuro devolve uma fração
  // pequena disto, e é essa fração que desenha as faces
  painel('#FFF4E2', 15, [40, 340, 120], 420, 190);           // a chave, quente, do alto
  // um painel ATRÁS da câmera: é ele que as faces frontais refletem — sem ele o
  // espelho olha para o nada e o logo vira um buraco preto
  painel('#EAF4FF', 4, [60, 40, 620], 760, 460);
  const postos = [
    [[-380, 60, 140], 320, 360],
    [[380, 40, 160], 320, 360],
    [[-160, -60, -380], 380, 260],
    [[260, -200, 240], 340, 200],
  ];
  stops.forEach((cor, i) => {
    const [pos, sx, sy] = postos[i % postos.length];
    painel(cor, 13, pos, sx, sy);
  });
  // o far plane PADRÃO do fromScene é 100 — os painéis vivem a 400-620 e saíam
  // todos cortados: o ambiente renderizava só o fundo, e o metal ficava preto
  const rt = pmrem.fromScene(sc, 0.06, 1, 2000);
  sc.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  return rt;
}

/* Cada paleta é um humor de matéria, não uma troca de tinta. */
/* Cada paleta é um humor de matéria, não uma troca de tinta. O plasma é METAL
   escuro de propósito: dielétrico devolve ~4% do ambiente de frente (é por isso
   que vidro preto é preto de frente); metal espelha em qualquer ângulo, e são
   os painéis coloridos que pintam as faces. */
const HUMORES = {
  plasma: { color: 0x191612, metalness: 0.78, roughness: 0.24, clearcoat: 1.0, clearcoatRoughness: 0.14, envMapIntensity: 1.35 },
  subsolo: { color: 0x3a2a17, metalness: 0.35, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.3 },
  cal: { color: 0xf2efe9, metalness: 0.0, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.25, envMapIntensity: 0.7 },
};

function palcoTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(64, 54, 38, 0.5)');
  g.addColorStop(0.45, 'rgba(24, 34, 44, 0.2)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- parâmetros e URL ----------

let rebuildTimer = 0;
function applyValues() {
  controls.autoRotateSpeed = values.orbita * 4;
  // a espessura refaz a extrusão — barato, mas não a cada pixel de slider
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    const nova = extrudir(profundidadeAtual());
    mesh.geometry.dispose();
    mesh.geometry = nova;
    updateHud();
  }, 120);
}

let urlTimer = 0;
function syncUrl() {
  if (mesh) applyValues();
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const vis = panel ? Object.fromEntries(panel.keys.map((k) => [k, values[k]])) : values;
    const q = toSearch(vis, {
      paleta: state.palette === 'plasma' ? undefined : state.palette,
      parado: state.girar ? undefined : true,
      semdescritor: state.descritor ? undefined : true,
    });
    history.replaceState(null, '', q ? `?${q}` : location.pathname);
  }, URL_DEBOUNCE_MS);
}

// ---------- controles ----------

function setPalette(name) {
  state.palette = name;
  const velho = envRT;
  envRT = buildEnv(PALETTES[name].stops);
  Object.assign(material, HUMORES[name]);
  material.color = new THREE.Color(HUMORES[name].color);
  material.envMap = envRT.texture;
  material.needsUpdate = true;
  // descartar o RENDER TARGET, não a textura: texture.dispose() não libera o
  // framebuffer nem o depth renderbuffer — cada troca de paleta vazaria ~9 MB
  // de GPU até o GC de JS por acaso recolher o invólucro
  velho?.dispose();
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
  renderer.render(scene, camera);
  // o canvas é transparente — o palco escuro é o gradiente do CSS, que o PNG
  // precisa composto atrás, senão o logo sai flutuando em transparência
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
    a.download = 'tera-faceta.png';
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
};

function wireUi() {
  document.querySelectorAll('[data-palette]').forEach((b) => {
    b.addEventListener('click', () => setPalette(b.dataset.palette));
  });
  const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
  on('girar', () => setGirar(!state.girar));
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
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

let last = performance.now();
const perf = { fps: 0, acc: 0, n: 0 };

function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  const dtReal = (now - last) / 1000;
  last = now;
  controls.update();
  renderer.render(scene, camera);
  perf.acc += dtReal;
  perf.n++;
  if (perf.acc >= 0.5) {
    perf.fps = Math.round(perf.n / perf.acc);
    perf.acc = 0;
    perf.n = 0;
    updateHud();
  }
}

function updateHud() {
  hudEl.textContent = [
    `${stats.lacos} contornos`,
    `${(stats.triangulos / 1000).toFixed(1)} mil triângulos`,
    `${perf.fps} fps`,
  ].join(' · ');
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
    const img = await carregarImagem(LOGO_URLS);
    shapes = buildShapes(binariza(img));

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    pmrem = new THREE.PMREMGenerator(renderer);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 1, 5000);
    camera.position.set(70, 60, 620);

    material = new THREE.MeshPhysicalMaterial({ ...HUMORES.plasma });
    mesh = new THREE.Mesh(extrudir(profundidadeAtual()), material);
    scene.add(mesh);

    const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
    key.position.set(300, 420, 320);
    const rim = new THREE.DirectionalLight(0x31c4ff, 1.2);
    rim.position.set(-340, 120, -300);
    scene.add(key, rim, new THREE.AmbientLight(0x232028, 1.1));

    const palco = new THREE.Mesh(
      new THREE.PlaneGeometry(TARGET_W * 2.4, TARGET_W * 1.4),
      new THREE.MeshBasicMaterial({
        map: palcoTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    palco.rotation.x = -Math.PI / 2;
    palco.position.y = -TARGET_W * 0.24;
    scene.add(palco);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = state.girar;
    controls.minDistance = TARGET_W * 0.3;
    controls.maxDistance = TARGET_W * 4;

    panel = new Panel(values, syncUrl, 'faceta');
    wireUi();
    setPalette(state.palette);
    setDescritor(state.descritor);
    press('girar', state.girar);
    controls.autoRotateSpeed = values.orbita * 4;
    panel.sync();
    resize();
    updateHud();
    requestAnimationFrame(frame);

    window.__faceta = {
      renderer, scene, camera, controls, mesh, material, state, values, stats, shapes,
      /** Quadro manual para diagnóstico — aba em segundo plano não recebe rAF. */
      quadro() {
        controls.update();
        renderer.render(scene, camera);
      },
    };
  } catch (err) {
    fail(err.message);
    throw err;
  }
}

init();
