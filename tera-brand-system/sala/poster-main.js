/* Sala · posters — o palco.
   A caixa preta da sala (medidas espelham sala/main.js) com as artes de
   poster-artes.js projetadas em tela + teto como mapping. A câmera respira
   em loops de 8 s; cada quadro composita WebGL + vinheta + grão + camada
   técnica num canvas no formato da rede — e é esse canvas que vira PNG ou
   WebM. O poster é uma foto da sala aberta. */

import * as THREE from 'three';
import {
  ARTES, CORES, UNFOLD, desenhaTera, MAPEAMENTOS, USA_MAPEAR,
} from './poster-artes.js?v=4';

/* o repertório de logos (brand/logo): monolines tingíveis + o matéria, que
   é plasma e vai como é. FRESTA é o procedural — TERA bold com o acento
   desenhado como a fresta. Proporções vêm do viewBox de cada arquivo. */
const LOGOS = {
  fresta: { label: 'FRESTA', src: null },
  caps: { label: 'CAPS', src: '../brand/logo/tera_shape_caps.svg', aspecto: 587 / 308 },
  ink: { label: 'INK', src: '../brand/logo/tera_ink_subsolo.svg', aspecto: 544.28 / 248 },
  mono: { label: 'MONO T', src: '../brand/logo/tera_monogram_t_ink.svg', aspecto: 188 / 240 },
  cliente: { label: 'CLIENTE', src: '../brand/logo/tera_shape_cliente.svg', aspecto: 540.28 / 281.58 },
  materia: { label: 'MATÉRIA', src: '../brand/logo/tera_materia.svg', aspecto: 544.28 / 248, semTinta: true },
};

const logosCarregados = new Map(); // nome → Promise<Image>
function carregaLogo(nome) {
  const def = LOGOS[nome];
  if (!def?.src) return Promise.resolve(null);
  if (!logosCarregados.has(nome)) {
    logosCarregados.set(nome, new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(`logo ${nome} não carregou`));
      img.src = def.src;
    }));
  }
  return logosCarregados.get(nome);
}

/* ---------------------------------------------------------------- medidas */

const M = {
  largura: 15.36, profundidade: 15.36, peDireito: 10.08,
  telaAltura: 8.16, tetoAvanco: 10.08, pessoa: 1.80,
};
const HX = M.largura / 2, HZ = M.profundidade / 2;

const FORMATOS = {
  '4x5':  { label: '4:5',  w: 1080, h: 1350 },
  '9x16': { label: '9:16', w: 1080, h: 1920 },
  '1x1':  { label: '1:1',  w: 1080, h: 1080 },
  '16x9': { label: '16:9', w: 1920, h: 1080 },
};

const PERIODO_BASE = 8000; // ms de um loop em 1× — o REC grava exatamente um

/* o jeito de andar da câmera: modelos de easing pra escolher no painel */
const EASINGS = {
  elastico: {
    label: 'ELÁSTICO',
    fn: (t) => { // back in-out: passa do ponto e assenta — o elástico
      const c = 1.70158 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
    },
  },
  seco: {
    label: 'SECO',
    fn: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 // expo: o easing da marca
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2),
  },
  fluido: {
    label: 'FLUIDO',
    fn: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t), // seno: o vai-e-vem calmo
  },
};

const VELOCIDADES = {
  lenta: { label: '½×', fator: 0.5 },
  normal: { label: '1×', fator: 1 },
  rapida: { label: '2×', fator: 2 },
};

/* ---------------------------------------------------------------- estado */

const url = new URLSearchParams(location.search);
const estado = {
  // 'imagem' não sobrevive a reload (a imagem mora só na sessão)
  arte: ARTES[url.get('arte')] && url.get('arte') !== 'imagem' ? url.get('arte') : 'fresta',
  cam: url.get('cam') || 'frontal',
  fmt: FORMATOS[url.get('fmt')] ? url.get('fmt') : '4x5',
  logo: LOGOS[url.get('logo')] ? url.get('logo') : 'fresta',
  mapear: MAPEAMENTOS[url.get('mapear')] ? url.get('mapear') : 'cobrir',
  motion: EASINGS[url.get('motion')] ? url.get('motion') : 'elastico',
  vel: VELOCIDADES[url.get('vel')] ? url.get('vel') : 'normal',
  estado: (url.get('estado') || '001').slice(0, 3),
  frase: url.get('frase') || 'A TÉRA ABRE',
  textos: {
    supEsq: url.get('se') ?? 'TÉRA — MATA SÃO PAULO',
    supDir: url.get('sd') ?? `ESTADO ${(url.get('estado') || '001').slice(0, 3)}`,
    infEsq: url.get('ie') ?? 'TEMPORADA 01 — SET 2027',
    infDir: url.get('id') ?? 'tera.art.br',
  },
  pessoa: url.get('pessoa') !== '0',
  texto: url.get('camada') !== '0',
  pausa: false,
  imagem: null, // Image subida ou solta na janela
  logoImg: null, // Image do logo escolhido (null = procedural)
};

function gravaUrl() {
  const p = new URLSearchParams({
    arte: estado.arte, cam: estado.cam, fmt: estado.fmt,
    logo: estado.logo, mapear: estado.mapear,
    motion: estado.motion, vel: estado.vel,
    estado: estado.estado, frase: estado.frase,
    se: estado.textos.supEsq, sd: estado.textos.supDir,
    ie: estado.textos.infEsq, id: estado.textos.infDir,
    pessoa: estado.pessoa ? '1' : '0', camada: estado.texto ? '1' : '0',
  });
  history.replaceState(null, '', '?' + p.toString());
}

/* ------------------------------------------------------------------ cena */

const gl = document.getElementById('gl');
const quadro = document.getElementById('quadro');
const ctxQ = quadro.getContext('2d');

const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true });
renderer.setPixelRatio(1); // o tamanho interno JÁ é a resolução de export

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050506);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 300);

const ambiente = new THREE.AmbientLight(0xffffff, 0.4);
const banhoTela = new THREE.PointLight(0xffffff, 0, 30, 1.7);
banhoTela.position.set(0, 4.2, -3.2);
const banhoTeto = new THREE.PointLight(0xffffff, 0, 26, 1.9);
banhoTeto.position.set(0, 7.2, -1);
scene.add(ambiente, banhoTela, banhoTeto);

/* a caixa: preto que ainda pega o banho de luz das telas */
function planoCaixa(w, h, cor) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ color: cor })
  );
  scene.add(mesh);
  return mesh;
}
const piso = planoCaixa(M.largura, M.profundidade, 0x101013);
piso.rotation.x = -Math.PI / 2;
const pFundo = planoCaixa(M.largura, M.peDireito, 0x141417);
pFundo.position.set(0, M.peDireito / 2, -HZ);
const pEsq = planoCaixa(M.profundidade, M.peDireito, 0x121215);
pEsq.rotation.y = Math.PI / 2;
pEsq.position.set(-HX, M.peDireito / 2, 0);
const pDir = planoCaixa(M.profundidade, M.peDireito, 0x121215);
pDir.rotation.y = -Math.PI / 2;
pDir.position.set(HX, M.peDireito / 2, 0);

/* as superfícies de projeção: o anel de três paredes + o teto.
   Cada uma é uma fatia do canvas desdobrado das artes. */
function canvasDe(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv;
}
const { FACE, TELA: H_TELA, TETO: H_TETO } = UNFOLD;
const fundoCanvas = canvasDe(FACE, H_TELA);
const esqCanvas = canvasDe(FACE, H_TELA);
const dirCanvas = canvasDe(FACE, H_TELA);
const tetoCanvas = canvasDe(FACE, H_TETO);

function texturaDe(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const fundoTex = texturaDe(fundoCanvas);
const esqTex = texturaDe(esqCanvas);
const dirTex = texturaDe(dirCanvas);
const tetoTex = texturaDe(tetoCanvas);

const tela = new THREE.Mesh(
  new THREE.PlaneGeometry(M.largura, M.telaAltura),
  new THREE.MeshBasicMaterial({ map: fundoTex })
);
tela.position.set(0, M.telaAltura / 2, -HZ + 0.06);
scene.add(tela);

const ledEsq = new THREE.Mesh(
  new THREE.PlaneGeometry(M.profundidade, M.telaAltura),
  new THREE.MeshBasicMaterial({ map: esqTex })
);
ledEsq.rotation.y = Math.PI / 2; // u=0 na boca, u=1 na dobra do fundo
ledEsq.position.set(-HX + 0.06, M.telaAltura / 2, 0);
scene.add(ledEsq);

const ledDir = new THREE.Mesh(
  new THREE.PlaneGeometry(M.profundidade, M.telaAltura),
  new THREE.MeshBasicMaterial({ map: dirTex })
);
ledDir.rotation.y = -Math.PI / 2; // u=0 na dobra do fundo, u=1 na boca
ledDir.position.set(HX - 0.06, M.telaAltura / 2, 0);
scene.add(ledDir);

const teto = new THREE.Mesh(
  new THREE.PlaneGeometry(M.largura, M.tetoAvanco),
  new THREE.MeshBasicMaterial({ map: tetoTex })
);
teto.rotation.x = Math.PI / 2;
teto.position.set(0, M.telaAltura, -HZ + M.tetoAvanco / 2);
scene.add(teto);

/* os reflexos no piso — o truque que faz a sala parecer acesa. Um por
   parede, cada um deitado a partir da própria base, com a imagem
   espelhada e um alpha que morre longe da parede. */
const alphaRefl = (() => {
  const cv = canvasDe(4, 256);
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5a5a5a'); // junto à parede
  g.addColorStop(1, '#000000'); // morre pra frente
  c.fillStyle = g;
  c.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(cv);
})();

const reflexos = []; // { canvas, fonte } — redesenhados a cada arte
function reflexoDe(fonteCanvas, largura, rotZ, pos, y) {
  const cv = canvasDe(fonteCanvas.width, fonteCanvas.height);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, M.telaAltura),
    new THREE.MeshBasicMaterial({
      map: texturaDe(cv), alphaMap: alphaRefl,
      transparent: true, opacity: 0.32, depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotZ;
  mesh.position.set(pos.x, y, pos.z);
  scene.add(mesh);
  reflexos.push({ canvas: cv, fonte: fonteCanvas, tex: mesh.material.map });
}
reflexoDe(fundoCanvas, M.largura, 0, { x: 0, z: -HZ + M.telaAltura / 2 }, 0.015);
reflexoDe(esqCanvas, M.profundidade, Math.PI / 2, { x: -HX + M.telaAltura / 2, z: 0 }, 0.013);
reflexoDe(dirCanvas, M.profundidade, -Math.PI / 2, { x: HX - M.telaAltura / 2, z: 0 }, 0.014);

/* a silhueta de 1,80 m — figura de escala em contraluz */
const pessoa = new THREE.Group();
{
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const meia = [
    [0.048, 1.575], [0.060, 1.510], [0.238, 1.492], [0.262, 1.415],
    [0.238, 1.090], [0.214, 0.935], [0.184, 0.920], [0.190, 0.860],
    [0.168, 0.500], [0.106, 0.070], [0.152, 0.014], [0.152, 0.0],
    [0.048, 0.0], [0.036, 0.340], [0.020, 0.800],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(-meia[0][0], meia[0][1]);
  for (const [x, y] of meia) shape.lineTo(x, y);
  for (let i = meia.length - 1; i >= 0; i--) shape.lineTo(-meia[i][0], meia[i][1]);
  shape.closePath();
  const corpo = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  const cabeca = new THREE.Mesh(new THREE.CircleGeometry(0.105, 24), mat);
  cabeca.position.y = 1.695;
  pessoa.add(corpo, cabeca);
}
pessoa.position.set(1.15, 0, -2.4);
scene.add(pessoa);

/* ------------------------------------------------------------------ arte */

function redesenhaArte() {
  const unfold = document.createElement('canvas');
  unfold.width = UNFOLD.WT; unfold.height = UNFOLD.H;
  const ctx = unfold.getContext('2d');
  ARTES[estado.arte].draw(ctx, {
    frase: estado.frase, estado: estado.estado, imagem: estado.imagem,
    mapear: estado.mapear,
    logoImg: estado.logoImg,
    logoAspecto: LOGOS[estado.logo].aspecto,
    logoTinta: !LOGOS[estado.logo].semTinta,
  });

  // fatia o desdobrado nas quatro superfícies
  const fatia = (cv, sx, sy) => cv.getContext('2d')
    .drawImage(unfold, sx, sy, cv.width, cv.height, 0, 0, cv.width, cv.height);
  fatia(esqCanvas, 0, UNFOLD.FOLD);
  fatia(fundoCanvas, UNFOLD.X0, UNFOLD.FOLD);
  fatia(dirCanvas, UNFOLD.X1, UNFOLD.FOLD);
  fatia(tetoCanvas, UNFOLD.X0, 0);
  fundoTex.needsUpdate = esqTex.needsUpdate = dirTex.needsUpdate = tetoTex.needsUpdate = true;

  // cada parede espelha no piso, difusa
  for (const r of reflexos) {
    const c = r.canvas.getContext('2d');
    c.save();
    c.clearRect(0, 0, r.canvas.width, r.canvas.height);
    c.filter = 'blur(7px)';
    c.scale(1, -1);
    c.drawImage(r.fonte, 0, -r.canvas.height);
    c.restore();
    r.tex.needsUpdate = true;
  }

  const luz = new THREE.Color(ARTES[estado.arte].luz);
  banhoTela.color.copy(luz);
  banhoTeto.color.copy(luz);
}

/* --------------------------------------------------------------- câmeras
   Cada preset é um vai-e-vem suave (cos): começa e termina no mesmo lugar,
   então o REC de um período fecha em loop perfeito. */

const lerp = (a, b, p) => a + (b - a) * p;

const CAMERAS = {
  frontal: {
    label: 'FRONTAL', fov: 30,
    tick(p, pos, alvo) {
      pos.set(0, lerp(4.1, 4.5, p), lerp(30, 21, p));
      alvo.set(0, lerp(4.2, 4.9, p), -HZ);
    },
  },
  contra: {
    label: 'CONTRA', fov: 46,
    tick(p, pos, alvo) {
      pos.set(lerp(-2.4, 2.4, p), lerp(1.4, 1.7, p), lerp(9.5, 7.0, p));
      alvo.set(lerp(-0.5, 0.5, p), lerp(5.4, 6.4, p), -HZ);
    },
  },
  lateral: {
    label: 'LATERAL', fov: 33,
    tick(p, pos, alvo) {
      const x = lerp(-6.5, 6.5, p);
      pos.set(x, 3.1, 14);
      alvo.set(x * 0.22, 4.3, -HZ);
    },
  },
  teto: {
    label: 'TETO', fov: 55,
    tick(p, pos, alvo) {
      pos.set(lerp(-1.2, 1.2, p), lerp(1.2, 1.6, p), lerp(3.4, 0.6, p));
      alvo.set(0, M.telaAltura, lerp(-4.5, -1.8, p));
    },
  },
  orbita: {
    label: 'ÓRBITA', fov: 32,
    tick(p, pos, alvo) {
      const az = lerp(-0.34, 0.34, p), r = lerp(27, 24, p);
      pos.set(Math.sin(az) * r, lerp(4.0, 5.4, p), Math.cos(az) * r - 2);
      alvo.set(0, 4.6, -6);
    },
  },
};

const alvoCam = new THREE.Vector3();

/* um período no fator de velocidade atual */
const periodoAtual = () => PERIODO_BASE / VELOCIDADES[estado.vel].fator;

function posicionaCamera(t01) {
  const preset = CAMERAS[estado.cam];
  // triângulo 0→1→0 easado pelo modelo escolhido: começa e termina no
  // mesmo lugar, então o REC de um período fecha em loop perfeito
  const tri = t01 < 0.5 ? t01 * 2 : 2 - t01 * 2;
  const p = EASINGS[estado.motion].fn(tri);
  preset.tick(p, camera.position, alvoCam);
  camera.fov = preset.fov;
  camera.lookAt(alvoCam);
  camera.updateProjectionMatrix();
}

/* ------------------------------------------------------- quadro composto */

let grao = null;
function preparaGrao() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  grao = ctxQ.createPattern(cv, 'repeat');
}

function camadaTecnica(w, h) {
  if (!estado.texto) return;
  const m = Math.round(Math.min(w, h) * 0.05);
  const fs = Math.round(Math.min(w, h) * 0.019);
  const mBaixo = estado.fmt === '9x16' ? Math.round(m * 1.9) : m; // safe area dos reels
  ctxQ.font = `700 ${fs}px 'Space Mono', monospace`;
  ctxQ.letterSpacing = '0.14em';
  ctxQ.fillStyle = 'rgba(244,244,241,0.92)';

  // a mini-fresta assina o canto
  ctxQ.fillStyle = CORES.fosforo;
  ctxQ.fillRect(m, m - fs * 0.9, fs * 2.4, Math.max(2, fs * 0.14));
  ctxQ.fillStyle = 'rgba(244,244,241,0.92)';

  ctxQ.textAlign = 'left';
  ctxQ.textBaseline = 'alphabetic';
  ctxQ.fillText(estado.textos.supEsq, m, m + fs * 0.6);
  ctxQ.fillText(estado.textos.infEsq, m, h - mBaixo);
  ctxQ.textAlign = 'right';
  ctxQ.fillText(estado.textos.supDir, w - m, m + fs * 0.6);
  ctxQ.fillText(estado.textos.infDir, w - m, h - mBaixo);
  ctxQ.letterSpacing = '0em';
}

let vinheta = null, vinhetaPara = '';
function compoeQuadro() {
  const { w, h } = FORMATOS[estado.fmt];
  ctxQ.drawImage(gl, 0, 0, w, h);

  if (vinhetaPara !== estado.fmt) {
    vinheta = ctxQ.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    vinheta.addColorStop(0, 'rgba(0,0,0,0)');
    vinheta.addColorStop(1, 'rgba(0,0,0,0.42)');
    vinhetaPara = estado.fmt;
  }
  ctxQ.fillStyle = vinheta;
  ctxQ.fillRect(0, 0, w, h);

  if (grao) {
    ctxQ.save();
    ctxQ.globalAlpha = 0.045;
    ctxQ.translate(Math.random() * 128, Math.random() * 128);
    ctxQ.fillStyle = grao;
    ctxQ.fillRect(-128, -128, w + 256, h + 256);
    ctxQ.restore();
  }

  camadaTecnica(w, h);
}

/* ---------------------------------------------------------------- layout */

function aplicaFormato() {
  const { w, h } = FORMATOS[estado.fmt];
  renderer.setSize(w, h, false);
  quadro.width = w; quadro.height = h;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  vinhetaPara = '';
  preparaGrao(); // o pattern pertence ao contexto — refaz junto
  encaixaQuadro();
}

function encaixaQuadro() {
  const { w, h } = FORMATOS[estado.fmt];
  const pad = 24, altoUi = 200;
  const escala = Math.min(
    (window.innerWidth - pad * 2) / w,
    (window.innerHeight - altoUi - pad) / h
  );
  quadro.style.width = Math.round(w * escala) + 'px';
  quadro.style.height = Math.round(h * escala) + 'px';
}
window.addEventListener('resize', encaixaQuadro);

/* ------------------------------------------------------------------ loop */

let inicio = performance.now();
let pausadoEm = 0;
let tAtual = 0;

/* gravação alinhada ao loop por relógio: começa na próxima virada e para
   um período depois — setTimeout não depende do rAF, então nem uma aba
   oculta deixa a gravação presa no meio */
const rec = { gravador: null, pedacos: [], timer: 0, erro: null };

function quadroAnim(agora) {
  requestAnimationFrame(quadroAnim);
  if (estado.pausa) { inicio += agora - pausadoEm; pausadoEm = agora; }
  const P = periodoAtual();
  const t01 = ((agora - inicio) % P) / P;
  tAtual = t01;

  posicionaCamera(t01);

  // as telas respiram: o banho de luz pulsa devagar
  const pulso = 14 + Math.sin(t01 * Math.PI * 2) * 3;
  banhoTela.intensity = pulso;
  banhoTeto.intensity = pulso * 0.55;

  pessoa.visible = estado.pessoa;
  if (pessoa.visible) {
    pessoa.rotation.y = Math.atan2(
      camera.position.x - pessoa.position.x,
      camera.position.z - pessoa.position.z
    );
  }

  renderer.render(scene, camera);
  compoeQuadro();
}

/* ---------------------------------------------------------------- export */

function baixa(blob, nome) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

const nomeBase = () =>
  `tera-poster_${estado.arte}_${estado.cam}_${estado.fmt}_estado-${estado.estado}`;

function exportaPng() {
  quadro.toBlob((blob) => blob && baixa(blob, nomeBase() + '.png'), 'image/png');
}

function comecaGravacao() {
  const stream = quadro.captureStream(30);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((m) => MediaRecorder.isTypeSupported(m)) || '';
  rec.gravador = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 });
  rec.pedacos = [];
  rec.gravador.ondataavailable = (e) => e.data.size && rec.pedacos.push(e.data);
  rec.gravador.onstop = () => {
    const blob = new Blob(rec.pedacos, { type: 'video/webm' });
    window.__poster.ultimoWebm = blob.size; // QA: o loop gravado, em bytes
    baixa(blob, nomeBase() + '.webm');
    rec.gravador = null;
    const btn = document.getElementById('btnRec');
    btn.disabled = false; btn.textContent = 'REC LOOP';
  };
  rec.gravador.start();
}

function pedeGravacao() {
  if (rec.timer || rec.gravador) return;
  estado.pausa = false;
  document.getElementById('btnPausa').setAttribute('aria-pressed', 'false');
  const btn = document.getElementById('btnRec');
  btn.disabled = true; btn.textContent = 'GRAVANDO…';

  const P = periodoAtual();
  const falta = P - ((performance.now() - inicio) % P);
  rec.timer = setTimeout(() => {
    try { comecaGravacao(); } catch (e) { rec.erro = String(e); }
    rec.timer = setTimeout(() => {
      rec.timer = 0;
      if (rec.gravador?.state === 'recording') rec.gravador.stop();
      else { btn.disabled = false; btn.textContent = 'REC LOOP'; } // start falhou
    }, P);
  }, falta);
}

/* -------------------------------------------------------------------- UI */

function botao(pai, rotulo, aoClicar, pressionado = false) {
  const b = document.createElement('button');
  b.textContent = rotulo;
  b.setAttribute('aria-pressed', String(pressionado));
  b.addEventListener('click', aoClicar);
  pai.appendChild(b);
  return b;
}

function grupoExclusivo(pai, itens, atual, aoEscolher) {
  const botoes = new Map();
  for (const [chave, rotulo] of itens) {
    botoes.set(chave, botao(pai, rotulo, () => {
      for (const [k, b] of botoes) b.setAttribute('aria-pressed', String(k === chave));
      aoEscolher(chave);
    }, chave === atual));
  }
  return botoes;
}

const botoesArte = grupoExclusivo(
  document.getElementById('linhaArtes'),
  Object.entries(ARTES).map(([k, a]) => [k, a.label]),
  estado.arte,
  (k) => { estado.arte = k; redesenhaArte(); gravaUrl(); }
);
const pillImagem = botoesArte.get('imagem');
pillImagem.style.display = 'none'; // aparece quando uma imagem subir
pillImagem.title = 'A imagem que você subiu, mapeada na caixa';

grupoExclusivo(
  document.getElementById('linhaLogos'),
  Object.entries(LOGOS).map(([k, l]) => [k, l.label]),
  estado.logo,
  (k) => {
    estado.logo = k;
    carregaLogo(k).then((img) => {
      if (estado.logo !== k) return; // já trocaram de novo
      estado.logoImg = img;
      redesenhaArte();
    }).catch(() => { estado.logoImg = null; redesenhaArte(); });
    gravaUrl();
  }
);

grupoExclusivo(
  document.getElementById('grupoCams'),
  Object.entries(CAMERAS).map(([k, c]) => [k, c.label]),
  estado.cam,
  (k) => { estado.cam = k; gravaUrl(); }
);

grupoExclusivo(
  document.getElementById('grupoMotion'),
  Object.entries(EASINGS).map(([k, e]) => [k, e.label]),
  estado.motion,
  (k) => { estado.motion = k; gravaUrl(); }
);

grupoExclusivo(
  document.getElementById('grupoVel'),
  Object.entries(VELOCIDADES).map(([k, v]) => [k, v.label]),
  estado.vel,
  (k) => {
    // troca de andamento sem pulo: preserva a fase do loop
    const agora = performance.now();
    const Pvelho = periodoAtual();
    const fase = ((agora - inicio) % Pvelho) / Pvelho;
    estado.vel = k;
    inicio = agora - fase * periodoAtual();
    gravaUrl();
  }
);

grupoExclusivo(
  document.getElementById('grupoMapear'),
  Object.entries(MAPEAMENTOS),
  estado.mapear,
  (k) => {
    estado.mapear = k;
    if (USA_MAPEAR.has(estado.arte)) redesenhaArte();
    gravaUrl();
  }
);

grupoExclusivo(
  document.getElementById('grupoFmt'),
  Object.entries(FORMATOS).map(([k, f]) => [k, f.label]),
  estado.fmt,
  (k) => { estado.fmt = k; aplicaFormato(); gravaUrl(); }
);

/* ------------------------------------------------------- painel de textos */

const painelTextos = document.getElementById('painelTextos');
const campos = {
  frase: document.getElementById('inFrase'),
  estado: document.getElementById('inEstado'),
  supEsq: document.getElementById('inSupEsq'),
  supDir: document.getElementById('inSupDir'),
  infEsq: document.getElementById('inInfEsq'),
  infDir: document.getElementById('inInfDir'),
};
campos.frase.value = estado.frase;
campos.estado.value = estado.estado;
campos.supEsq.value = estado.textos.supEsq;
campos.supDir.value = estado.textos.supDir;
campos.infEsq.value = estado.textos.infEsq;
campos.infDir.value = estado.textos.infDir;

let debounceArte = 0;
function aoEditar() {
  const estadoNovo = campos.estado.value.trim() || '001';
  // o SUP DIR acompanha o número enquanto ninguém o personalizar
  if (estadoNovo !== estado.estado && /^ESTADO\b/.test(estado.textos.supDir)) {
    estado.textos.supDir = `ESTADO ${estadoNovo}`;
    campos.supDir.value = estado.textos.supDir;
  }
  estado.estado = estadoNovo;
  estado.frase = campos.frase.value.trim() || 'A TÉRA ABRE';
  estado.textos.supEsq = campos.supEsq.value;
  estado.textos.supDir = campos.supDir.value;
  estado.textos.infEsq = campos.infEsq.value;
  estado.textos.infDir = campos.infDir.value;
  clearTimeout(debounceArte);
  debounceArte = setTimeout(() => { redesenhaArte(); gravaUrl(); }, 250);
}
for (const campo of Object.values(campos)) campo.addEventListener('input', aoEditar);

document.getElementById('btnTextos').addEventListener('click', (e) => {
  painelTextos.hidden = !painelTextos.hidden;
  e.currentTarget.setAttribute('aria-pressed', String(!painelTextos.hidden));
});

/* subir imagem: o botão e o arrastar caem no mesmo lugar */
const arquivoImagem = document.getElementById('arquivoImagem');
document.getElementById('btnImagem').addEventListener('click', () => arquivoImagem.click());
arquivoImagem.addEventListener('change', () => {
  if (arquivoImagem.files[0]) carregaArquivoImagem(arquivoImagem.files[0]);
  arquivoImagem.value = '';
});

function carregaArquivoImagem(arq) {
  if (!arq.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = () => {
    estado.imagem = img;
    estado.arte = 'imagem';
    pillImagem.style.display = '';
    for (const [k, b] of botoesArte) b.setAttribute('aria-pressed', String(k === 'imagem'));
    redesenhaArte();
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(arq);
}

document.getElementById('btnPessoa').addEventListener('click', (e) => {
  estado.pessoa = !estado.pessoa;
  e.currentTarget.setAttribute('aria-pressed', String(estado.pessoa));
  gravaUrl();
});
document.getElementById('btnCamada').addEventListener('click', (e) => {
  estado.texto = !estado.texto;
  e.currentTarget.setAttribute('aria-pressed', String(estado.texto));
  gravaUrl();
});
document.getElementById('btnPausa').addEventListener('click', (e) => {
  estado.pausa = !estado.pausa;
  pausadoEm = performance.now();
  e.currentTarget.setAttribute('aria-pressed', String(estado.pausa));
});
document.getElementById('btnPng').addEventListener('click', exportaPng);
document.getElementById('btnRec').addEventListener('click', pedeGravacao);

window.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.target.tagName === 'INPUT') return;
  if (ev.key === ' ') { ev.preventDefault(); document.getElementById('btnPausa').click(); }
});

/* soltar uma imagem mapeia ela na caixa inteira */
const solta = document.getElementById('solta');
window.addEventListener('dragover', (e) => { e.preventDefault(); solta.classList.add('ativo'); });
window.addEventListener('dragleave', (e) => {
  if (e.target === solta || e.relatedTarget === null) solta.classList.remove('ativo');
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  solta.classList.remove('ativo');
  const arq = e.dataTransfer?.files?.[0];
  if (arq) carregaArquivoImagem(arq);
});

/* ---------------------------------------------------------------- início */

aplicaFormato();
redesenhaArte(); // primeiro desenho com fonte de fallback…
if (estado.logo !== 'fresta') {
  carregaLogo(estado.logo)
    .then((img) => { estado.logoImg = img; redesenhaArte(); })
    .catch(() => {});
}
document.fonts.ready.then(() => {
  Promise.all([
    document.fonts.load("900 100px 'Archivo Exp'", 'TÉRA'),
    document.fonts.load("900 100px 'Archivo Cond'", '001'),
    document.fonts.load("700 40px 'Space Mono'", 'TÉRA'),
  ]).then(redesenhaArte); // …e o definitivo quando a marca chega
});
requestAnimationFrame(quadroAnim);

/* ---------------------------------------------------------------- QA hook */

window.__poster = {
  estado, FORMATOS, CAMERAS, ARTES, LOGOS, MAPEAMENTOS, camera, scene, desenhaTera, rec,
  t: () => tAtual,
  carregaArquivoImagem,
  run: () => ({
    arte: estado.arte, cam: estado.cam, fmt: estado.fmt,
    logo: estado.logo, logoCarregado: !!estado.logoImg, mapear: estado.mapear,
    motion: estado.motion, vel: estado.vel, periodoMs: periodoAtual(),
    quadro: `${quadro.width}×${quadro.height}`,
    gl: `${gl.width}×${gl.height}`,
    artes: Object.keys(ARTES).length,
    logos: Object.keys(LOGOS).length,
    cams: Object.keys(CAMERAS).length,
    recSuporte: typeof MediaRecorder !== 'undefined' &&
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .some((m) => MediaRecorder.isTypeSupported(m)),
  }),
  png: () => new Promise((res) => quadro.toBlob((b) => res(b ? b.size : 0), 'image/png')),
};
