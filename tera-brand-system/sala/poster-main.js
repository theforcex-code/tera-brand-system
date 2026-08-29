/* Sala · posters — o palco.
   A caixa preta da sala (medidas espelham sala/main.js) com as artes de
   poster-artes.js projetadas em tela + teto como mapping. A câmera respira
   em loops de 8 s; cada quadro composita WebGL + vinheta + grão + camada
   técnica num canvas no formato da rede — e é esse canvas que vira PNG ou
   WebM. O poster é uma foto da sala aberta. */

import * as THREE from 'three';
import { ARTES, CORES, UNFOLD, desenhaTera } from './poster-artes.js?v=2';

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

const PERIODO = 8000; // ms de um loop de câmera — o REC grava exatamente um

/* ---------------------------------------------------------------- estado */

const url = new URLSearchParams(location.search);
const estado = {
  // 'imagem' não sobrevive a reload (a imagem mora só na sessão)
  arte: ARTES[url.get('arte')] && url.get('arte') !== 'imagem' ? url.get('arte') : 'fresta',
  cam: url.get('cam') || 'frontal',
  fmt: FORMATOS[url.get('fmt')] ? url.get('fmt') : '4x5',
  estado: (url.get('estado') || '001').slice(0, 3),
  frase: url.get('frase') || 'A TÉRA ABRE',
  pessoa: url.get('pessoa') !== '0',
  texto: url.get('texto') !== '0',
  pausa: false,
  imagem: null, // Image solta por drag & drop
};

function gravaUrl() {
  const p = new URLSearchParams({
    arte: estado.arte, cam: estado.cam, fmt: estado.fmt,
    estado: estado.estado, frase: estado.frase,
    pessoa: estado.pessoa ? '1' : '0', texto: estado.texto ? '1' : '0',
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

/* as superfícies de projeção */
const telaCanvas = document.createElement('canvas');
telaCanvas.width = UNFOLD.W; telaCanvas.height = UNFOLD.TELA;
const tetoCanvas = document.createElement('canvas');
tetoCanvas.width = UNFOLD.W; tetoCanvas.height = UNFOLD.TETO;
const reflCanvas = document.createElement('canvas');
reflCanvas.width = UNFOLD.W; reflCanvas.height = UNFOLD.TELA;

function texturaDe(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const telaTex = texturaDe(telaCanvas);
const tetoTex = texturaDe(tetoCanvas);
const reflTex = texturaDe(reflCanvas);

const tela = new THREE.Mesh(
  new THREE.PlaneGeometry(M.largura, M.telaAltura),
  new THREE.MeshBasicMaterial({ map: telaTex })
);
tela.position.set(0, M.telaAltura / 2, -HZ + 0.06);
scene.add(tela);

const teto = new THREE.Mesh(
  new THREE.PlaneGeometry(M.largura, M.tetoAvanco),
  new THREE.MeshBasicMaterial({ map: tetoTex })
);
teto.rotation.x = Math.PI / 2;
teto.position.set(0, M.telaAltura, -HZ + M.tetoAvanco / 2);
scene.add(teto);

/* o reflexo da tela no piso — o truque que faz a sala parecer acesa */
const alphaRefl = (() => {
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 256;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5a5a5a'); // junto à parede
  g.addColorStop(1, '#000000'); // morre pra frente
  c.fillStyle = g;
  c.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(cv);
})();
const reflexo = new THREE.Mesh(
  new THREE.PlaneGeometry(M.largura, M.telaAltura),
  new THREE.MeshBasicMaterial({
    map: reflTex, alphaMap: alphaRefl,
    transparent: true, opacity: 0.34, depthWrite: false,
  })
);
reflexo.rotation.x = -Math.PI / 2;
reflexo.position.set(0, 0.015, -HZ + M.telaAltura / 2);
scene.add(reflexo);

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
  unfold.width = UNFOLD.W; unfold.height = UNFOLD.H;
  const ctx = unfold.getContext('2d');
  ARTES[estado.arte].draw(ctx, {
    frase: estado.frase, estado: estado.estado, imagem: estado.imagem,
  });

  telaCanvas.getContext('2d')
    .drawImage(unfold, 0, UNFOLD.FOLD, UNFOLD.W, UNFOLD.TELA, 0, 0, UNFOLD.W, UNFOLD.TELA);
  tetoCanvas.getContext('2d')
    .drawImage(unfold, 0, 0, UNFOLD.W, UNFOLD.TETO, 0, 0, UNFOLD.W, UNFOLD.TETO);

  const cr = reflCanvas.getContext('2d');
  cr.save();
  cr.filter = 'blur(7px)'; // piso não é espelho: o reflexo chega difuso
  cr.scale(1, -1);
  cr.drawImage(telaCanvas, 0, -UNFOLD.TELA);
  cr.restore();

  telaTex.needsUpdate = tetoTex.needsUpdate = reflTex.needsUpdate = true;

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

function posicionaCamera(t01) {
  const preset = CAMERAS[estado.cam];
  const p = 0.5 - 0.5 * Math.cos(t01 * Math.PI * 2); // 0→1→0, sem emenda
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
  ctxQ.fillText('TÉRA — MATA SÃO PAULO', m, m + fs * 0.6);
  ctxQ.fillText('TEMPORADA 01 — SET 2027', m, h - mBaixo);
  ctxQ.textAlign = 'right';
  ctxQ.fillText(`ESTADO ${estado.estado}`, w - m, m + fs * 0.6);
  ctxQ.fillText('tera.art.br', w - m, h - mBaixo);
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
  const pad = 24, altoUi = 148;
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
  const t01 = ((agora - inicio) % PERIODO) / PERIODO;
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
    btn.disabled = false; btn.textContent = 'REC 8S';
  };
  rec.gravador.start();
}

function pedeGravacao() {
  if (rec.timer || rec.gravador) return;
  estado.pausa = false;
  document.getElementById('btnPausa').setAttribute('aria-pressed', 'false');
  const btn = document.getElementById('btnRec');
  btn.disabled = true; btn.textContent = 'GRAVANDO…';

  const falta = PERIODO - ((performance.now() - inicio) % PERIODO);
  rec.timer = setTimeout(() => {
    try { comecaGravacao(); } catch (e) { rec.erro = String(e); }
    rec.timer = setTimeout(() => {
      rec.timer = 0;
      if (rec.gravador?.state === 'recording') rec.gravador.stop();
      else { btn.disabled = false; btn.textContent = 'REC 8S'; } // start falhou
    }, PERIODO);
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

const linhaArtes = document.getElementById('linhaArtes');
const botoesArte = grupoExclusivo(
  linhaArtes,
  Object.entries(ARTES).filter(([, a]) => !a.oculta).map(([k, a]) => [k, a.label]),
  estado.arte,
  (k) => { estado.arte = k; redesenhaArte(); gravaUrl(); }
);

grupoExclusivo(
  document.getElementById('linhaCams'),
  Object.entries(CAMERAS).map(([k, c]) => [k, c.label]),
  estado.cam,
  (k) => { estado.cam = k; gravaUrl(); }
);

grupoExclusivo(
  document.getElementById('grupoFmt'),
  Object.entries(FORMATOS).map(([k, f]) => [k, f.label]),
  estado.fmt,
  (k) => { estado.fmt = k; aplicaFormato(); gravaUrl(); }
);

const inEstado = document.getElementById('inEstado');
const inFrase = document.getElementById('inFrase');
inEstado.value = estado.estado;
inFrase.value = estado.frase;
let debounceArte = 0;
function aoEditar() {
  estado.estado = inEstado.value.trim() || '001';
  estado.frase = inFrase.value.trim() || 'A TÉRA ABRE';
  clearTimeout(debounceArte);
  debounceArte = setTimeout(() => { redesenhaArte(); gravaUrl(); }, 250);
}
inEstado.addEventListener('input', aoEditar);
inFrase.addEventListener('input', aoEditar);

document.getElementById('btnPessoa').addEventListener('click', (e) => {
  estado.pessoa = !estado.pessoa;
  e.currentTarget.setAttribute('aria-pressed', String(estado.pessoa));
  gravaUrl();
});
document.getElementById('btnTexto').addEventListener('click', (e) => {
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
  if (!arq || !arq.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = () => {
    estado.imagem = img;
    estado.arte = 'imagem';
    for (const [k, b] of botoesArte) b.setAttribute('aria-pressed', 'false');
    redesenhaArte();
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(arq);
});

/* ---------------------------------------------------------------- início */

aplicaFormato();
redesenhaArte(); // primeiro desenho com fonte de fallback…
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
  estado, FORMATOS, CAMERAS, ARTES, camera, scene, desenhaTera, rec,
  t: () => tAtual,
  run: () => ({
    arte: estado.arte, cam: estado.cam, fmt: estado.fmt,
    quadro: `${quadro.width}×${quadro.height}`,
    gl: `${gl.width}×${gl.height}`,
    artes: Object.keys(ARTES).length,
    cams: Object.keys(CAMERAS).length,
    recSuporte: typeof MediaRecorder !== 'undefined' &&
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .some((m) => MediaRecorder.isTypeSupported(m)),
  }),
  png: () => new Promise((res) => quadro.toBlob((b) => res(b ? b.size : 0), 'image/png')),
};
