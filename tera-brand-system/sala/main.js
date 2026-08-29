/* Sala · mockup 3D.
   O desenho técnico da sala — cotas vermelhas sobre branco — reconstruído
   como caixa navegável em Three.js. A leitura das medidas:

     galpão     15,36 (L) × 15,36 (P) × 10,08 m (A)   ← piso e aresta frontal
     tela       15,36 × 8,16 m, encostada no fundo     ← plano escuro do mockup
     teto-tela  15,36 × 10,08 m, pendurado a 8,16 m    ← avança do fundo p/ frente

   O zigue-zague do desenho original é a folga entre o teto-tela (8,16 m de
   altura) e a parede do galpão (10,08 m) — aqui ela existe de verdade.

   Dois modos: MOCKUP (o desenho, branco e cinza) e LUZ (a sala apagada com
   tela e teto acesos em grade de calibração). */

import * as THREE from 'three';
import { OrbitControls } from '../areia/vendor/OrbitControls.js';

/* ---------------------------------------------------------------- medidas */

const M = {
  largura: 15.36,     // eixo X
  profundidade: 15.36, // eixo Z
  peDireito: 10.08,   // eixo Y — aresta frontal direita do desenho
  telaAltura: 8.16,   // plano escuro do fundo
  tetoAvanco: 10.08,  // quanto o teto-tela avança do fundo pra frente
  modulo: 0.48,       // todas as medidas fecham em múltiplos de 0,48 m
  pessoa: 1.80,
};

const HX = M.largura / 2;      // 7.68
const HZ = M.profundidade / 2; // 7.68 — fundo em z = -HZ, boca em z = +HZ

const fmt = (v) => v.toFixed(2).replace('.', ',') + ' m';

/* ------------------------------------------------------------------ cores */

const COR = {
  mockup: {
    fundoCss: '#F6F5F2',
    piso: 0xa9b3c4,        // o azul acinzentado do desenho
    paredeFundo: 0xd2d0cc,
    paredeEsq: 0xc4c2be,
    paredeDir: 0xcbc9c5,
    tela: 0x6f6e6c,
    teto: 0xbfbdb9,
    aresta: 0x8d8a84,
    labelTexto: '#E8231A',
    labelFundo: 'rgba(255,255,255,0.92)',
  },
  luz: {
    fundoCss: 'transparent',
    piso: 0x14110e,
    paredeFundo: 0x181512,
    paredeEsq: 0x151210,
    paredeDir: 0x171411,
    tela: 0x0d0c0a,        // vira textura acesa
    teto: 0x0d0c0a,
    aresta: 0x2b2723,
    labelTexto: '#FF4A3C',
    labelFundo: 'rgba(10,9,8,0.86)',
  },
};

const CAL = '#F2EFE9';
const BIOLUM = '#31C4FF';

/* ------------------------------------------------------------------- base */

const canvas = document.getElementById('sala');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI * 0.60; // deixa descer ao nível do olho…

/* a vista do desenho original: frontal, olhar na horizontal, meia altura.
   O damping desliga por um update pra consumir inércia pendente — senão a
   sobra de um arrasto anterior gira a câmera por cima da vista nova. */
function vistaDiagrama() {
  controls.enableDamping = false;
  controls.update();
  camera.position.set(0, 4.3, 27.5);
  controls.target.set(0, 4.3, -2);
  controls.update();
  controls.enableDamping = true;
}

/* -------------------------------------------------------------------- luz */

/* luzes fisicamente corretas dividem por π — as intensidades compensam */
const ambiente = new THREE.AmbientLight(0xffffff, 2.6);
const solzinho = new THREE.DirectionalLight(0xffffff, 1.2);
solzinho.position.set(6, 14, 18);
scene.add(ambiente, solzinho);

/* no modo luz, as telas banham a sala */
const banhoTela = new THREE.PointLight(0xbfe9ff, 0, 34, 1.6);
banhoTela.position.set(0, 5, -4);
const banhoTeto = new THREE.PointLight(0xbfe9ff, 0, 30, 1.8);
banhoTeto.position.set(0, 7.5, -2);
scene.add(banhoTela, banhoTeto);

/* ---------------------------------------------------------------- o galpão
   Planos com a normal apontando PARA DENTRO e FrontSide: quem orbita por
   fora vê o interior — a parede entre a câmera e a sala some sozinha,
   como no desenho. Sem parede frontal e sem tampa: a boca fica aberta. */

const superficies = []; // { mesh, chave } — pra trocar de cor por modo

function plano(w, h, chave) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  superficies.push({ mesh, chave });
  scene.add(mesh);
  return mesh;
}

const piso = plano(M.largura, M.profundidade, 'piso');
piso.rotation.x = -Math.PI / 2;

const paredeFundo = plano(M.largura, M.peDireito, 'paredeFundo');
paredeFundo.position.set(0, M.peDireito / 2, -HZ);

const paredeEsq = plano(M.profundidade, M.peDireito, 'paredeEsq');
paredeEsq.rotation.y = Math.PI / 2;
paredeEsq.position.set(-HX, M.peDireito / 2, 0);

const paredeDir = plano(M.profundidade, M.peDireito, 'paredeDir');
paredeDir.rotation.y = -Math.PI / 2;
paredeDir.position.set(HX, M.peDireito / 2, 0);

/* --------------------------------------------------- tela e teto-tela
   As duas superfícies de projeção. No mockup são planos cinza; no modo
   luz recebem a grade de calibração como textura emissiva. */

const telaMat = new THREE.MeshBasicMaterial({ color: COR.mockup.tela });
const tela = new THREE.Mesh(new THREE.PlaneGeometry(M.largura, M.telaAltura), telaMat);
tela.position.set(0, M.telaAltura / 2, -HZ + 0.06); // 6 cm à frente da parede
scene.add(tela);

const tetoMat = new THREE.MeshBasicMaterial({ color: COR.mockup.teto });
const teto = new THREE.Mesh(new THREE.PlaneGeometry(M.largura, M.tetoAvanco), tetoMat);
teto.rotation.x = Math.PI / 2; // normal pra baixo: visível de dentro
teto.position.set(0, M.telaAltura, -HZ + M.tetoAvanco / 2);
scene.add(teto);

/* ---------------------------------------------------------------- arestas */

const arestaMat = new THREE.LineBasicMaterial({ color: COR.mockup.aresta });
const arestas = new THREE.Group();
{
  const pts = [];
  const seg = (a, b) => pts.push(a, b);
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  // contorno do piso
  seg(v(-HX, 0, -HZ), v(HX, 0, -HZ));
  seg(v(-HX, 0, HZ), v(HX, 0, HZ));
  seg(v(-HX, 0, -HZ), v(-HX, 0, HZ));
  seg(v(HX, 0, -HZ), v(HX, 0, HZ));
  // verticais da boca e do fundo
  seg(v(-HX, 0, HZ), v(-HX, M.peDireito, HZ));
  seg(v(HX, 0, HZ), v(HX, M.peDireito, HZ));
  seg(v(-HX, 0, -HZ), v(-HX, M.peDireito, -HZ));
  seg(v(HX, 0, -HZ), v(HX, M.peDireito, -HZ));
  // topo das paredes
  seg(v(-HX, M.peDireito, -HZ), v(-HX, M.peDireito, HZ));
  seg(v(HX, M.peDireito, -HZ), v(HX, M.peDireito, HZ));
  seg(v(-HX, M.peDireito, -HZ), v(HX, M.peDireito, -HZ));
  // moldura do teto-tela
  const zTeto = -HZ + M.tetoAvanco;
  seg(v(-HX, M.telaAltura, zTeto), v(HX, M.telaAltura, zTeto));
  seg(v(-HX, M.telaAltura, -HZ), v(-HX, M.telaAltura, zTeto));
  seg(v(HX, M.telaAltura, -HZ), v(HX, M.telaAltura, zTeto));

  const g = new THREE.BufferGeometry().setFromPoints(pts);
  arestas.add(new THREE.LineSegments(g, arestaMat));
}
scene.add(arestas);

/* ------------------------------------------------------------------ grade */

const grade = new THREE.GridHelper(M.largura, M.largura / M.modulo, 0xb3b0aa, 0xc9c6c0);
grade.position.y = 0.01;
grade.material.transparent = true;
grade.material.opacity = 0.8;
grade.visible = false;
scene.add(grade);

/* ----------------------------------------------------------------- pessoa
   A silhueta preta do desenho: um recorte plano de 1,80 m que gira no eixo
   vertical pra sempre encarar a câmera — figura de escala, não personagem. */

const pessoa = new THREE.Group();
{
  const mat = new THREE.MeshBasicMaterial({ color: 0x0a0908, side: THREE.DoubleSide });

  // meia-silhueta (lado direito), do pescoço ao meio das pernas
  const meia = [
    [0.048, 1.575], [0.060, 1.510], [0.238, 1.492], [0.262, 1.415],
    [0.238, 1.090], [0.214, 0.935], [0.184, 0.920], [0.190, 0.860],
    [0.168, 0.500], [0.106, 0.070], [0.152, 0.014], [0.152, 0.0],
    [0.048, 0.0], [0.036, 0.340], [0.020, 0.800],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(-meia[0][0], meia[0][1]);
  shape.lineTo(meia[0][0], meia[0][1]);
  for (let i = 1; i < meia.length; i++) shape.lineTo(meia[i][0], meia[i][1]);
  for (let i = meia.length - 1; i >= 1; i--) shape.lineTo(-meia[i][0], meia[i][1]);
  shape.closePath();

  const corpo = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  const cabeca = new THREE.Mesh(new THREE.CircleGeometry(0.105, 24), mat);
  cabeca.position.y = 1.695; // topo a 1,80
  pessoa.add(corpo, cabeca);
}
pessoa.position.set(0.4, 0, -3.4);
scene.add(pessoa);

/* ------------------------------------------------------------------ cotas
   Linha + cone em cada ponta + etiqueta que sempre encara a câmera,
   reproduzindo as seis medidas em vermelho do desenho original. */

const cotas = new THREE.Group();
scene.add(cotas);
const etiquetas = []; // { sprite, texto } — refeitas na troca de modo

const cotaMat = new THREE.MeshBasicMaterial({ color: 0xe8231a });
const cotaLinhaMat = new THREE.LineBasicMaterial({ color: 0xe8231a });

function etiqueta(texto) {
  const dpr = 2;
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  const fonte = `700 ${44 * dpr}px 'Space Mono', ui-monospace, monospace`;
  ctx.font = fonte;
  // 12% de folga: a medida acontece antes da Space Mono chegar
  const wTexto = ctx.measureText(texto).width * 1.12;
  const padX = 22 * dpr, padY = 14 * dpr;
  cv.width = Math.ceil(wTexto + padX * 2);
  cv.height = Math.ceil(44 * dpr + padY * 2);

  const desenha = () => {
    const modo = document.body.classList.contains('luz') ? COR.luz : COR.mockup;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = modo.labelFundo;
    const r = 14 * dpr;
    ctx.beginPath();
    ctx.roundRect(0, 0, cv.width, cv.height, r);
    ctx.fill();
    ctx.font = fonte;
    ctx.fillStyle = modo.labelTexto;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto, cv.width / 2, cv.height / 2 + 2 * dpr);
  };
  desenha();

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  const alturaMundo = 0.58;
  sprite.scale.set((cv.width / cv.height) * alturaMundo, alturaMundo, 1);
  sprite.renderOrder = 10;
  etiquetas.push({ redesenha: () => { desenha(); tex.needsUpdate = true; } });
  return sprite;
}

function cota(a, b, texto, desloca = new THREE.Vector3()) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = B.clone().sub(A).normalize();
  const g = new THREE.Group();

  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([A, B]), cotaLinhaMat));

  const hCone = 0.42;
  for (const [ponta, sentido] of [[A, dir.clone().negate()], [B, dir]]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, hCone, 12), cotaMat);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sentido);
    cone.position.copy(ponta).addScaledVector(sentido, -hCone / 2);
    g.add(cone);
  }

  const sprite = etiqueta(texto);
  sprite.position.copy(A).add(B).multiplyScalar(0.5).add(desloca);
  g.add(sprite);
  cotas.add(g);
}

{
  const zTeto = -HZ + M.tetoAvanco;
  const sobe = (y) => new THREE.Vector3(0, y, 0);

  // teto-tela: boca (largura) e lateral esquerda (avanço)
  cota([-HX, M.telaAltura, zTeto], [HX, M.telaAltura, zTeto], fmt(M.largura), sobe(0.55));
  cota([-HX, M.telaAltura, -HZ], [-HX, M.telaAltura, zTeto], fmt(M.tetoAvanco), sobe(0.55));

  // tela: largura no topo e altura na borda direita
  cota([-HX, M.telaAltura, -HZ + 0.2], [HX, M.telaAltura, -HZ + 0.2], fmt(M.largura), sobe(-0.55));
  cota([HX - 0.25, 0, -HZ + 0.2], [HX - 0.25, M.telaAltura, -HZ + 0.2], fmt(M.telaAltura),
    new THREE.Vector3(1.35, 0, 0.3));

  // galpão: pé-direito na aresta frontal direita e profundidade no piso
  cota([HX, 0, HZ], [HX, M.peDireito, HZ], fmt(M.peDireito), new THREE.Vector3(1.4, 0, 0));
  cota([-HX, 0.02, -HZ], [-HX, 0.02, HZ], fmt(M.profundidade), sobe(0.5));
  cota([HX, 0.02, -HZ], [HX, 0.02, HZ], fmt(M.profundidade), sobe(0.5));
}

/* ------------------------------------------------- grade de calibração
   As texturas do modo luz: 1 px = 1 cm. Grade no módulo de 0,48 m, moldura,
   mira central e a medida escrita — a tela de ajuste de quem monta a sala. */

function texturaCalibracao(wM, hM, titulo) {
  const w = Math.round(wM * 100), h = Math.round(hM * 100);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#0d0c0a';
  ctx.fillRect(0, 0, w, h);

  const passo = M.modulo * 100; // 48 px
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += passo) {
    const forte = (x / passo) % 4 === 0;
    ctx.strokeStyle = forte ? 'rgba(242,239,233,0.13)' : 'rgba(242,239,233,0.055)';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += passo) {
    const forte = (y / passo) % 4 === 0;
    ctx.strokeStyle = forte ? 'rgba(242,239,233,0.13)' : 'rgba(242,239,233,0.055)';
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // diagonais e mira
  ctx.strokeStyle = 'rgba(49,196,255,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
  ctx.strokeStyle = 'rgba(49,196,255,0.6)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2); ctx.stroke();

  // moldura e cantos
  ctx.strokeStyle = 'rgba(242,239,233,0.85)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = BIOLUM;
  ctx.lineWidth = 10;
  const L = 120;
  for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx + sx * 24, cy + sy * (24 + L));
    ctx.lineTo(cx + sx * 24, cy + sy * 24);
    ctx.lineTo(cx + sx * (24 + L), cy + sy * 24);
    ctx.stroke();
  }

  // nome e medida
  ctx.fillStyle = 'rgba(242,239,233,0.55)';
  ctx.font = `700 44px 'Space Mono', ui-monospace, monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(titulo, 64, 118);

  ctx.textAlign = 'center';
  ctx.fillStyle = CAL;
  ctx.font = `700 130px 'Space Mono', ui-monospace, monospace`;
  ctx.fillText(`${fmt(wM)} × ${fmt(hM)}`.replace(' m ×', ' ×'), w / 2, h / 2 - 40);
  ctx.fillStyle = 'rgba(242,239,233,0.6)';
  ctx.font = `400 56px 'Space Mono', ui-monospace, monospace`;
  ctx.fillText(`${(wM * hM).toFixed(1).replace('.', ',')} m²`, w / 2, h / 2 + 72);

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let texTela = null, texTeto = null; // criadas quando a fonte carrega

/* ------------------------------------------------------------------ modos */

const estado = { luz: false, cotas: true, grade: false };

function aplicaModo() {
  const modo = estado.luz ? COR.luz : COR.mockup;
  document.body.classList.toggle('luz', estado.luz);

  for (const { mesh, chave } of superficies) mesh.material.color.setHex(modo[chave]);
  arestaMat.color.setHex(modo.aresta);

  if (estado.luz) {
    telaMat.map = texTela; telaMat.color.set(0xffffff);
    tetoMat.map = texTeto; tetoMat.color.set(0xffffff);
    ambiente.intensity = 0.8; solzinho.intensity = 0.1;
    banhoTela.intensity = 26; banhoTeto.intensity = 14;
    grade.material.opacity = 0.35;
  } else {
    telaMat.map = null; telaMat.color.setHex(modo.tela);
    tetoMat.map = null; tetoMat.color.setHex(modo.teto);
    ambiente.intensity = 2.6; solzinho.intensity = 1.2;
    banhoTela.intensity = 0; banhoTeto.intensity = 0;
    grade.material.opacity = 0.8;
  }
  telaMat.needsUpdate = tetoMat.needsUpdate = true;

  for (const e of etiquetas) e.redesenha();

  document.getElementById('btnLuz').setAttribute('aria-pressed', String(estado.luz));
  document.getElementById('btnCotas').setAttribute('aria-pressed', String(estado.cotas));
  document.getElementById('btnGrade').setAttribute('aria-pressed', String(estado.grade));
}

function alterna(chave) {
  estado[chave] = !estado[chave];
  cotas.visible = estado.cotas;
  grade.visible = estado.grade;
  aplicaModo();
}

document.getElementById('btnDiagrama').addEventListener('click', vistaDiagrama);
document.getElementById('btnLuz').addEventListener('click', () => alterna('luz'));
document.getElementById('btnCotas').addEventListener('click', () => alterna('cotas'));
document.getElementById('btnGrade').addEventListener('click', () => alterna('grade'));

window.addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const k = ev.key.toLowerCase();
  if (k === 'd') vistaDiagrama();
  else if (k === 'p') alterna('luz');
  else if (k === 'm') alterna('cotas');
  else if (k === 'g') alterna('grade');
});

/* ------------------------------------------------------------------- loop */

function redimensiona() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', redimensiona);

function quadro() {
  requestAnimationFrame(quadro);
  controls.update();
  // …mas nunca abaixo do piso
  if (camera.position.y < 0.3) camera.position.y = 0.3;
  // a silhueta gira só no eixo vertical pra encarar quem olha
  pessoa.rotation.y = Math.atan2(
    camera.position.x - pessoa.position.x,
    camera.position.z - pessoa.position.z
  );
  renderer.render(scene, camera);
}

/* as texturas e etiquetas usam a Space Mono — espera a fonte pra desenhar */
document.fonts.ready.then(() => {
  texTela = texturaCalibracao(M.largura, M.telaAltura, 'TELA DE FUNDO');
  texTeto = texturaCalibracao(M.largura, M.tetoAvanco, 'TETO-TELA');
  for (const e of etiquetas) e.redesenha();
  if (estado.luz) aplicaModo();
});

redimensiona();
vistaDiagrama();
aplicaModo();
quadro();

/* ---------------------------------------------------------------- QA hook */

window.__sala = {
  M, estado, scene, camera, controls,
  vistaDiagrama,
  luz: (v) => { if (v !== estado.luz) alterna('luz'); },
  run: () => ({
    superficies: superficies.length,
    cotas: cotas.children.length,
    telaOk: Math.abs(tela.geometry.parameters.width - 15.36) < 1e-6,
    tetoOk: Math.abs(teto.geometry.parameters.height - 10.08) < 1e-6,
    pessoaAltura: 1.8,
    modo: estado.luz ? 'luz' : 'mockup',
  }),
};
