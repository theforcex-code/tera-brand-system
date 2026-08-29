/* Sala · posters — as artes.
   A sala é imersiva: TRÊS paredes de tela (esquerda, fundo, direita) e o
   teto-tela. Cada arte desenha num canvas ÚNICO que desdobra a caixa em
   cruz — o anel de paredes aberto na horizontal e o teto dobrado pra cima
   da coluna central:

                       ┌──────────┐
                       │   TETO   │  1536 × 1008
            ┌──────────┼──────────┼──────────┐
            │ ESQUERDA │  FUNDO   │ DIREITA  │  3 × (1536 × 816)
            └──────────┴──────────┴──────────┘
            0        1536       3072       4608      (1 px = 1 cm)

   O que cruza uma dobra continua na superfície vizinha: uma linha na
   horizontal circunda a sala; o que sobe do fundo derrama no teto.

   Régua da marca (TERA_BRAND.md): preto #0A0A0C, papel #F4F4F1, fósforo
   #2CF5A0; TÉRA em Archivo Black; o acento do É é a própria fresta em
   fósforo; camada técnica em Space Mono. */

export const CORES = {
  preto: '#0A0A0C',
  papel: '#F4F4F1',
  fosforo: '#2CF5A0',
};

export const UNFOLD = {
  FACE: 1536,  // largura de cada parede (15,36 m)
  TELA: 816,   // altura do anel de telas (8,16 m)
  TETO: 1008,  // avanço do teto-tela (10,08 m)
  WT: 4608,    // o anel inteiro: esquerda + fundo + direita
  H: 1824,     // teto em cima (1008) + anel embaixo (816)
  FOLD: 1008,  // a linha onde o anel encontra o teto
  X0: 1536,    // onde começa o fundo
  X1: 3072,    // onde termina o fundo
};

const { FACE, TELA, TETO, WT, H, FOLD, X0, X1 } = UNFOLD;
const CX = X0 + FACE / 2; // centro do fundo — o olhar da câmera frontal
const Y_TELA = (f) => FOLD + TELA * f;

const EXP = (px) => `900 ${px}px 'Archivo Exp', sans-serif`;
const COND = (px) => `900 ${px}px 'Archivo Cond', sans-serif`;
const MONO = (px, peso = 400) => `${peso} ${px}px 'Space Mono', monospace`;

/* ------------------------------------------------------- o wordmark TÉRA
   Escrito sem acento e com a fresta desenhada por cima do E, na faixa
   própria acima da ascendente — o acento É a fresta. Devolve a largura. */

export function desenhaTera(ctx, x, yBase, px, corTipo, corFresta, fonte = EXP) {
  ctx.font = fonte(px);
  const texto = 'TERA';
  ctx.fillStyle = corTipo;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(texto, x, yBase);

  const wT = ctx.measureText('T').width;
  const wE = ctx.measureText('E').width;
  ctx.fillStyle = corFresta;
  ctx.fillRect(x + wT + wE * 0.06, yBase - px * 0.94, wE * 0.86, px * 0.085);
  return ctx.measureText(texto).width;
}

/* ------------------------------------------------------------ logo à parte
   O logo das artes pode ser o procedural (TERA + fresta, acima) ou um dos
   SVGs monoline do repertório em brand/logo — tingidos na cor pedida via
   source-in, já que vêm com fundo transparente. O matéria (plasma) passa
   sem tinta. */

const tintas = new Map(); // src|cor → canvas tingido

function logoTingido(img, aspecto, cor) {
  const chave = `${img.src}|${cor}`;
  let cv = tintas.get(chave);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = 1600;
  cv.height = Math.round(1600 / aspecto);
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = cor;
  c.fillRect(0, 0, cv.width, cv.height);
  tintas.set(chave, cv);
  return cv;
}

/* desenha o logo escolhido centrado em (cx, cy) com largura-alvo; devolve
   a altura ocupada. hMax segura o logo dentro de uma região. */
export function logoNoCanvas(ctx, o, cx, cy, wAlvo, cor, corFresta, hMax = 0) {
  if (!o.logoImg) {
    ctx.font = EXP(100);
    const w100 = ctx.measureText('TERA').width;
    let px = (100 * wAlvo) / w100;
    if (hMax && px > hMax) { px = hMax; wAlvo = (px / 100) * w100; }
    desenhaTera(ctx, cx - wAlvo / 2, cy + px * 0.36, px, cor, corFresta);
    return px;
  }
  const aspecto = o.logoAspecto || 2;
  let w = wAlvo, h = w / aspecto;
  if (hMax && h > hMax) { h = hMax; w = h * aspecto; }
  const fonte = o.logoTinta === false ? o.logoImg : logoTingido(o.logoImg, aspecto, cor);
  ctx.drawImage(fonte, cx - w / 2, cy - h / 2, w, h);
  return h;
}

/* uma linha que pode conter a palavra TÉRA (vira o wordmark com fresta) */
function linhaComTera(ctx, texto, cx, yBase, px, corTipo, corFresta, fonte = EXP) {
  ctx.font = fonte(px);
  const partes = texto.split(/TÉRA/);
  if (partes.length === 1) {
    ctx.fillStyle = corTipo;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(texto, cx, yBase);
    return;
  }
  const wTera = ctx.measureText('TERA').width;
  const wTotal = partes.reduce((s, p) => s + ctx.measureText(p).width, 0)
    + wTera * (partes.length - 1);
  let x = cx - wTotal / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < partes.length; i++) {
    ctx.fillStyle = corTipo;
    ctx.fillText(partes[i], x, yBase);
    x += ctx.measureText(partes[i]).width;
    if (i < partes.length - 1) x += desenhaTera(ctx, x, yBase, px, corTipo, corFresta, fonte);
  }
}

/* ajusta o corpo até a linha caber numa largura */
function corpoQueCabe(ctx, texto, larguraMax, px, fonte) {
  ctx.font = fonte(px);
  const w = ctx.measureText(texto.replace(/TÉRA/g, 'TERA')).width;
  return w > larguraMax ? Math.floor(px * (larguraMax / w)) : px;
}

/* ---------------------------------------------------------------- artes */

/* FRESTA — a menor unidade de luz circunda a sala inteira: uma linha de
   fósforo pelas três paredes. A frase atravessa a fresta no fundo e muda
   de cor dentro dela; a luz vaza pela dobra e escorre pelo teto. */
function fresta(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);

  const yF = Y_TELA(0.52), hF = 30;

  // o vazamento no teto: um véu de fósforo que morre longe da dobra
  const veu = ctx.createLinearGradient(0, FOLD, 0, 0);
  veu.addColorStop(0, 'rgba(44,245,160,0.16)');
  veu.addColorStop(1, 'rgba(44,245,160,0)');
  ctx.fillStyle = veu;
  ctx.fillRect(0, 0, WT, FOLD);

  // a fresta dá a volta: esquerda → fundo → direita, sem emenda
  ctx.save();
  ctx.shadowColor = CORES.fosforo;
  ctx.shadowBlur = 90;
  ctx.fillStyle = CORES.fosforo;
  ctx.fillRect(-60, yF - hF / 2, WT + 120, hF);
  ctx.restore();

  // a frase cruza no fundo: papel fora da fresta, preto dentro dela
  const frase = (o.frase || 'A TÉRA ABRE').toUpperCase();
  const px = corpoQueCabe(ctx, frase, FACE * 0.88, 190, EXP);
  const yBase = yF + px * 0.36;
  linhaComTera(ctx, frase, CX, yBase, px, CORES.papel, CORES.fosforo);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, yF - hF / 2, WT, hF);
  ctx.clip();
  linhaComTera(ctx, frase, CX, yBase, px, CORES.preto, CORES.preto);
  ctx.restore();
}

/* ESTADO — o número no fundo; a persiana de frestas verticais fatia as
   três paredes e as colunas de luz sobem pelo teto. */
function estado(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);

  const num = String(o.estado || '001');
  ctx.font = COND(900);
  const yBase = Y_TELA(0.78);

  ctx.save();
  ctx.shadowColor = CORES.fosforo;
  ctx.shadowBlur = 60;
  ctx.fillStyle = CORES.fosforo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(num, CX, yBase);
  ctx.restore();

  // ecos do número nas paredes laterais, mais fracos — a sala repete
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = CORES.fosforo;
  ctx.fillText(num, X0 / 2, yBase);
  ctx.fillText(num, X1 + FACE / 2, yBase);
  ctx.restore();

  // persiana: colunas pretas finas fatiam o anel inteiro
  ctx.fillStyle = CORES.preto;
  const passo = 62;
  for (let x = 0; x < WT; x += passo) ctx.fillRect(x, 0, 10, H);

  // as colunas continuam teto adentro como linhas de luz que se apagam
  const gradTeto = ctx.createLinearGradient(0, FOLD, 0, FOLD - 620);
  gradTeto.addColorStop(0, 'rgba(44,245,160,0.34)');
  gradTeto.addColorStop(1, 'rgba(44,245,160,0)');
  ctx.fillStyle = gradTeto;
  for (let x = X0 + 26; x < X1; x += passo) ctx.fillRect(x, FOLD - 620, 4, 620);

  ctx.fillStyle = CORES.papel;
  ctx.font = MONO(34, 700);
  ctx.textAlign = 'center';
  ctx.fillText(`ESTADO ${num}`, CX, Y_TELA(0.92));
}

/* STATEMENT — a caixa aberta: papel nas três paredes, o bloco preto fala
   no fundo e o Plano fechado paira no teto. */
function statement(ctx, o) {
  ctx.fillStyle = CORES.papel;
  ctx.fillRect(0, 0, WT, H);

  const pw = FACE * 0.62, ph = pw * (8.16 / 15.36) * 0.5;
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(CX - pw / 2, FOLD - 260 - ph, pw, ph);

  const frase = (o.frase || 'A TÉRA ABRE').toUpperCase();
  const palavras = frase.split(' ');
  const linhas = [];
  if (palavras.length <= 2) linhas.push(...palavras);
  else {
    const alvo = Math.ceil(palavras.length / (palavras.length <= 4 ? 2 : 3));
    for (let i = 0; i < palavras.length; i += alvo)
      linhas.push(palavras.slice(i, i + alvo).join(' '));
  }

  let y = Y_TELA(0.30);
  for (const linha of linhas) {
    const px = corpoQueCabe(ctx, linha, FACE * 0.9, 235, EXP);
    y += px * 0.94;
    linhaComTera(ctx, linha, CX, y, px, CORES.preto, CORES.fosforo);
  }

  // nas laterais, a frase corre na vertical como matéria gráfica
  ctx.save();
  ctx.fillStyle = 'rgba(10,10,12,0.16)';
  ctx.font = EXP(360);
  ctx.textAlign = 'center';
  for (const [cx, giro] of [[X0 / 2, -Math.PI / 2], [X1 + FACE / 2, Math.PI / 2]]) {
    ctx.save();
    ctx.translate(cx, Y_TELA(0.5));
    ctx.rotate(giro);
    ctx.fillText(frase, 0, 120);
    ctx.restore();
  }
  ctx.restore();
}

/* PLANO — a caixa abrindo em volta inteira: a faixa de papel rasga as
   três paredes e o nome está no fundo. */
function plano(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);

  // hairlines marcam o Plano fechado em cada superfície
  ctx.strokeStyle = 'rgba(244,244,241,0.28)';
  ctx.lineWidth = 3;
  for (const x of [0, X0, X1]) ctx.strokeRect(x + 40, FOLD + 40, FACE - 80, TELA - 80);
  ctx.strokeRect(X0 + 40, 60, FACE - 80, FOLD - 120);

  // a abertura circunda a sala: papel entrando pela fresta nas três paredes
  const hA = TELA * 0.40;
  const yA = Y_TELA(0.5) - hA / 2;
  ctx.fillStyle = CORES.papel;
  ctx.fillRect(0, yA, WT, hA);

  // dentro da abertura, no fundo, o logo escolhido
  logoNoCanvas(ctx, o, CX, yA + hA / 2, FACE * 0.58, CORES.preto, CORES.fosforo, hA * 0.72);

  // a luz da abertura vaza pro teto
  const veu = ctx.createLinearGradient(0, FOLD, 0, 200);
  veu.addColorStop(0, 'rgba(244,244,241,0.10)');
  veu.addColorStop(1, 'rgba(244,244,241,0)');
  ctx.fillStyle = veu;
  ctx.fillRect(0, 200, WT, FOLD - 200);

  ctx.fillStyle = CORES.papel;
  ctx.font = MONO(30);
  ctx.textAlign = 'center';
  ctx.fillText((o.frase || 'A TÉRA ABRE').toUpperCase(), CX, Y_TELA(0.93));
}

/* TÉCNICA — a sala falando de si: grade do módulo 0,48 no anel inteiro,
   as quinas marcadas, cada superfície com a própria medida. */
function tecnica(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);

  const passo = 48; // 0,48 m
  for (let x = 0; x <= WT; x += passo) {
    ctx.fillStyle = (x / passo) % 8 === 0 ? 'rgba(44,245,160,0.20)' : 'rgba(44,245,160,0.07)';
    ctx.fillRect(x, 0, 2, H);
  }
  for (let y = H; y >= 0; y -= passo) {
    ctx.fillStyle = ((H - y) / passo) % 8 === 0 ? 'rgba(44,245,160,0.20)' : 'rgba(44,245,160,0.07)';
    ctx.fillRect(0, y - 1, WT, 2);
  }
  // a linha do topo do anel (e a dobra do teto) é viva; as quinas também
  ctx.fillStyle = 'rgba(44,245,160,0.55)';
  ctx.fillRect(0, FOLD - 2, WT, 4);
  ctx.fillRect(X0 - 2, FOLD, 4, TELA);
  ctx.fillRect(X1 - 2, FOLD, 4, TELA);

  ctx.textAlign = 'left';
  const etiqueta = (texto, x, y, corpo = 44) => {
    ctx.fillStyle = CORES.papel;
    ctx.font = MONO(corpo, 700);
    ctx.fillText(texto, x, y);
  };
  etiqueta('PAREDE ESQ 15,36 × 8,16 M — 125,3 M²', 72, Y_TELA(0.14));
  etiqueta('TELA DE FUNDO 15,36 × 8,16 M — 125,3 M²', X0 + 72, Y_TELA(0.14));
  etiqueta('PAREDE DIR 15,36 × 8,16 M — 125,3 M²', X1 + 72, Y_TELA(0.14));
  etiqueta('TETO-TELA 15,36 × 10,08 M — 154,8 M²', X0 + 72, FOLD - 80);

  ctx.font = MONO(30);
  ctx.fillStyle = 'rgba(244,244,241,0.55)';
  ctx.fillText('MÓDULO 0,48 M — LUZ TOTAL 530,9 M²', X0 + 72, Y_TELA(0.14) + 52);
  ctx.fillText('MATA SÃO PAULO — COMPLEXO MATARAZZO', X0 + 72, Y_TELA(0.14) + 96);

  logoNoCanvas(ctx, o, X1 - 72 - FACE * 0.20, Y_TELA(0.80), FACE * 0.40, CORES.papel, CORES.fosforo, TELA * 0.30);
}

/* MARCA — o logo é o mapping: a marca em escala de sala, posicionada pelo
   modo de mapeamento escolhido. */
function marca(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);

  const modo = o.mapear || 'cobrir';
  if (modo === 'mosaico') {
    const wTile = FACE / 5;
    const hTile = wTile / (o.logoImg ? (o.logoAspecto || 2) : 2.9);
    const passoY = hTile * 1.9;
    let fila = 0;
    for (let y = hTile; y < H + hTile; y += passoY, fila++) {
      for (let x = wTile * 0.6 + (fila % 2 ? wTile * 0.55 : 0); x < WT; x += wTile * 1.1) {
        logoNoCanvas(ctx, o, x, y, wTile, CORES.papel, CORES.fosforo);
      }
    }
  } else if (modo === 'dupla') {
    logoNoCanvas(ctx, o, CX, Y_TELA(0.46), FACE * 0.7, CORES.papel, CORES.fosforo, TELA * 0.7);
    logoNoCanvas(ctx, o, CX, FOLD * 0.5, FACE * 0.7, CORES.papel, CORES.fosforo, FOLD * 0.62);
  } else if (modo === 'panorama') {
    // um logo por parede: a marca circunda quem está dentro
    for (const cx of [X0 / 2, CX, X1 + FACE / 2])
      logoNoCanvas(ctx, o, cx, Y_TELA(0.48), FACE * 0.78, CORES.papel, CORES.fosforo, TELA * 0.76);
  } else if (modo === 'conter' || modo === 'sotela') {
    logoNoCanvas(ctx, o, CX, Y_TELA(0.48), FACE * 0.82, CORES.papel, CORES.fosforo, TELA * 0.8);
  } else { // cobrir e esticar: a marca cruza a dobra do teto
    logoNoCanvas(ctx, o, CX, FOLD, FACE * 0.94, CORES.papel, CORES.fosforo);
  }
}

/* IMAGEM — o que você subiu, mapeado no desdobrado pelo modo escolhido. */
function imagem(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, WT, H);
  const img = o.imagem;
  if (!img) return;

  const cobre = (dx, dy, dw, dh) => {
    const s = Math.max(dw / img.width, dh / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.save();
    ctx.beginPath(); ctx.rect(dx, dy, dw, dh); ctx.clip();
    ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
    ctx.restore();
  };

  const corMedia = () => {
    if (!img.__media) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1;
      const c = cv.getContext('2d');
      c.drawImage(img, 0, 0, 1, 1);
      img.__media = c.getImageData(0, 0, 1, 1).data;
    }
    return img.__media;
  };

  const ecoTeto = () => {
    const [r, g, b] = corMedia();
    const veu = ctx.createLinearGradient(0, FOLD, 0, 0);
    veu.addColorStop(0, `rgba(${r},${g},${b},0.30)`);
    veu.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = veu;
    ctx.fillRect(0, 0, WT, FOLD);
  };

  switch (o.mapear || 'cobrir') {
    case 'conter': {
      const s = Math.min(WT / img.width, H / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (WT - w) / 2, (H - h) / 2, w, h);
      break;
    }
    case 'esticar':
      ctx.drawImage(img, 0, 0, WT, H);
      break;
    case 'mosaico': {
      const w = FACE / 3, h = (img.height / img.width) * w;
      for (let y = 0; y < H; y += h)
        for (let x = 0; x < WT; x += w) ctx.drawImage(img, x, y, w, h);
      break;
    }
    case 'sotela': {
      // só a tela clássica do fundo; paredes e teto ficam com o eco
      cobre(X0, FOLD, FACE, TELA);
      const [r, g, b] = corMedia();
      for (const [x0, x1] of [[X0, 0], [X1, WT]]) {
        const veu = ctx.createLinearGradient(x0, 0, x1, 0);
        veu.addColorStop(0, `rgba(${r},${g},${b},0.26)`);
        veu.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = veu;
        ctx.fillRect(Math.min(x0, x1), FOLD, FACE, TELA);
      }
      ecoTeto();
      break;
    }
    case 'panorama':
      // a imagem envelopa o anel de paredes; o teto recebe o eco
      cobre(0, FOLD, WT, TELA);
      ecoTeto();
      break;
    case 'dupla':
      cobre(X0, FOLD, FACE, TELA);
      cobre(X0, 0, FACE, TETO);
      break;
    default:
      cobre(0, 0, WT, H);
  }
}

export const ARTES = {
  fresta: { label: 'FRESTA', luz: CORES.fosforo, draw: fresta },
  estado: { label: 'ESTADO', luz: CORES.fosforo, draw: estado },
  statement: { label: 'STATEMENT', luz: CORES.papel, draw: statement },
  plano: { label: 'PLANO', luz: CORES.papel, draw: plano },
  marca: { label: 'MARCA', luz: CORES.papel, draw: marca },
  tecnica: { label: 'TÉCNICA', luz: CORES.fosforo, draw: tecnica },
  imagem: { label: 'IMAGEM', luz: CORES.papel, draw: imagem, oculta: true },
};

/* quais artes escutam o modo de mapeamento */
export const USA_MAPEAR = new Set(['marca', 'imagem']);

export const MAPEAMENTOS = {
  cobrir: 'COBRIR',
  panorama: 'PANORAMA',
  conter: 'CONTER',
  esticar: 'ESTICAR',
  mosaico: 'MOSAICO',
  sotela: 'SÓ TELA',
  dupla: 'DUPLA',
};
