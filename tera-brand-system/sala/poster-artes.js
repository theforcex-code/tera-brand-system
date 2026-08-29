/* Sala · posters — as artes.
   Cada arte desenha num canvas ÚNICO que desdobra a caixa: a tela de fundo
   embaixo (15,36 × 8,16) e o teto-tela em cima (15,36 × 10,08), dobrados na
   aresta em que se encontram. 1 px = 1 cm. O que cruza a dobra continua no
   espaço — é o desenho de mapping, não um layout de post.

   Régua da marca (TERA_BRAND.md): preto #0A0A0C, papel #F4F4F1, fósforo
   #2CF5A0; TÉRA em Archivo Black (Expanded pra statements, Condensed pras
   frestas verticais); o acento do É é a própria fresta horizontal em
   fósforo; camada técnica em Space Mono. */

export const CORES = {
  preto: '#0A0A0C',
  papel: '#F4F4F1',
  fosforo: '#2CF5A0',
};

/* o desdobrado: teto em cima (y 0..1008), dobra em y=1008, tela embaixo */
export const UNFOLD = { W: 1536, TETO: 1008, TELA: 816, H: 1824, FOLD: 1008 };

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

const { W, H, FOLD, TELA } = UNFOLD;
const CX = W / 2;
const Y_TELA = (f) => FOLD + TELA * f; // fração da tela → y do desdobrado

/* FRESTA — o void e a menor unidade de luz. A frase atravessa a fresta e
   muda de cor dentro dela; a luz vaza pela dobra e escorre pelo teto. */
function fresta(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);

  const yF = Y_TELA(0.52), hF = 30;

  // o vazamento no teto: um véu de fósforo que morre longe da dobra
  const veu = ctx.createLinearGradient(0, FOLD, 0, 0);
  veu.addColorStop(0, 'rgba(44,245,160,0.16)');
  veu.addColorStop(1, 'rgba(44,245,160,0)');
  ctx.fillStyle = veu;
  ctx.fillRect(0, 0, W, FOLD);

  // a fresta, com halo
  ctx.save();
  ctx.shadowColor = CORES.fosforo;
  ctx.shadowBlur = 90;
  ctx.fillStyle = CORES.fosforo;
  ctx.fillRect(-60, yF - hF / 2, W + 120, hF);
  ctx.restore();

  // a frase cruza: papel fora da fresta, preto dentro dela
  const frase = (o.frase || 'A TÉRA ABRE').toUpperCase();
  const px = corpoQueCabe(ctx, frase, W * 0.88, 190, EXP);
  const yBase = yF + px * 0.36;
  linhaComTera(ctx, frase, CX, yBase, px, CORES.papel, CORES.fosforo);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, yF - hF / 2, W, hF);
  ctx.clip();
  linhaComTera(ctx, frase, CX, yBase, px, CORES.preto, CORES.preto);
  ctx.restore();

}

/* ESTADO — o número da vez em frestas verticais Condensed, fósforo. */
function estado(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);

  const num = String(o.estado || '001');
  const px = 900;
  ctx.font = COND(px);
  const yBase = Y_TELA(0.78);

  // o número, aceso
  ctx.save();
  ctx.shadowColor = CORES.fosforo;
  ctx.shadowBlur = 60;
  ctx.fillStyle = CORES.fosforo;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(num, CX, yBase);
  ctx.restore();

  // persiana: colunas pretas finas fatiam os dígitos em frestas verticais
  ctx.fillStyle = CORES.preto;
  const passo = 62;
  for (let x = CX - W / 2; x < CX + W / 2; x += passo) ctx.fillRect(x, 0, 10, H);

  // as colunas continuam teto adentro como linhas de luz que se apagam
  const gradTeto = ctx.createLinearGradient(0, FOLD, 0, FOLD - 620);
  gradTeto.addColorStop(0, 'rgba(44,245,160,0.34)');
  gradTeto.addColorStop(1, 'rgba(44,245,160,0)');
  ctx.fillStyle = gradTeto;
  for (let x = 26; x < W; x += passo) ctx.fillRect(x, FOLD - 620, 4, 620);

  ctx.fillStyle = CORES.papel;
  ctx.font = MONO(34, 700);
  ctx.textAlign = 'center';
  ctx.fillText(`ESTADO ${num}`, CX, Y_TELA(0.92));
}

/* STATEMENT — a caixa aberta: papel total, o bloco preto fala. */
function statement(ctx, o) {
  ctx.fillStyle = CORES.papel;
  ctx.fillRect(0, 0, W, H);

  // no teto, o Plano fechado: um void preto na proporção da tela
  const pw = W * 0.62, ph = pw * (8.16 / 15.36) * 0.5;
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(CX - pw / 2, FOLD - 260 - ph, pw, ph);

  const frase = (o.frase || 'A TÉRA ABRE').toUpperCase();
  const palavras = frase.split(' ');
  const linhas = [];
  // quebra equilibrada: 2 linhas até 4 palavras, 3 daí em diante
  if (palavras.length <= 2) linhas.push(...palavras);
  else {
    const alvo = Math.ceil(palavras.length / (palavras.length <= 4 ? 2 : 3));
    for (let i = 0; i < palavras.length; i += alvo)
      linhas.push(palavras.slice(i, i + alvo).join(' '));
  }

  let y = Y_TELA(0.30);
  for (const linha of linhas) {
    const px = corpoQueCabe(ctx, linha, W * 0.9, 235, EXP);
    y += px * 0.94;
    linhaComTera(ctx, linha, CX, y, px, CORES.preto, CORES.fosforo);
  }

}

/* PLANO — a caixa abrindo: a faixa de papel rasga o preto e o nome está lá. */
function plano(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);

  // hairlines marcam o retângulo do Plano fechado (tela toda) e o eco no teto
  ctx.strokeStyle = 'rgba(244,244,241,0.28)';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, FOLD + 40, W - 80, TELA - 80);
  ctx.strokeRect(40, 60, W - 80, FOLD - 120);

  // a abertura: papel entrando pela fresta central
  const hA = TELA * 0.40;
  const yA = Y_TELA(0.5) - hA / 2;
  ctx.fillStyle = CORES.papel;
  ctx.fillRect(0, yA, W, hA);

  // dentro da abertura, o logo escolhido
  logoNoCanvas(ctx, o, CX, yA + hA / 2, W * 0.58, CORES.preto, CORES.fosforo, hA * 0.72);

  // a luz da abertura vaza pro teto
  const veu = ctx.createLinearGradient(0, FOLD, 0, 200);
  veu.addColorStop(0, 'rgba(244,244,241,0.10)');
  veu.addColorStop(1, 'rgba(244,244,241,0)');
  ctx.fillStyle = veu;
  ctx.fillRect(0, 200, W, FOLD - 200);

  ctx.fillStyle = CORES.papel;
  ctx.font = MONO(30);
  ctx.textAlign = 'center';
  ctx.fillText((o.frase || 'A TÉRA ABRE').toUpperCase(), CX, Y_TELA(0.93));
}

/* TÉCNICA — a sala falando de si: grade do módulo 0,48 e as medidas. */
function tecnica(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);

  const passo = 48; // 0,48 m
  for (let x = 0; x <= W; x += passo) {
    ctx.fillStyle = (x / passo) % 8 === 0 ? 'rgba(44,245,160,0.20)' : 'rgba(44,245,160,0.07)';
    ctx.fillRect(x, 0, 2, H);
  }
  for (let y = H; y >= 0; y -= passo) {
    ctx.fillStyle = ((H - y) / passo) % 8 === 0 ? 'rgba(44,245,160,0.20)' : 'rgba(44,245,160,0.07)';
    ctx.fillRect(0, y - 1, W, 2);
  }
  // a dobra é uma linha viva
  ctx.fillStyle = 'rgba(44,245,160,0.55)';
  ctx.fillRect(0, FOLD - 2, W, 4);

  ctx.textAlign = 'left';
  ctx.fillStyle = CORES.papel;
  ctx.font = MONO(44, 700);
  ctx.fillText('TELA DE FUNDO 15,36 × 8,16 M — 125,3 M²', 72, Y_TELA(0.14));
  ctx.fillText('TETO-TELA 15,36 × 10,08 M — 154,8 M²', 72, FOLD - 80);
  ctx.font = MONO(30);
  ctx.fillStyle = 'rgba(244,244,241,0.55)';
  ctx.fillText('MÓDULO 0,48 M — 32 × 17 + 32 × 21', 72, Y_TELA(0.14) + 52);
  ctx.fillText('MATA SÃO PAULO — COMPLEXO MATARAZZO', 72, Y_TELA(0.14) + 96);

  logoNoCanvas(ctx, o, W - 72 - W * 0.20, Y_TELA(0.80), W * 0.40, CORES.papel, CORES.fosforo, TELA * 0.30);
}

/* MARCA — o logo é o mapping: a marca em escala de sala, posicionada pelo
   modo de mapeamento escolhido. */
function marca(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);

  const modo = o.mapear || 'cobrir';
  if (modo === 'mosaico') {
    const wTile = W / 5;
    const hTile = wTile / (o.logoImg ? (o.logoAspecto || 2) : 2.9);
    const passoY = hTile * 1.9;
    let fila = 0;
    for (let y = hTile; y < H + hTile; y += passoY, fila++) {
      for (let x = wTile * 0.6 + (fila % 2 ? wTile * 0.55 : 0); x < W; x += wTile * 1.1) {
        logoNoCanvas(ctx, o, x, y, wTile, CORES.papel, CORES.fosforo);
      }
    }
  } else if (modo === 'dupla') {
    logoNoCanvas(ctx, o, CX, Y_TELA(0.46), W * 0.7, CORES.papel, CORES.fosforo, TELA * 0.7);
    logoNoCanvas(ctx, o, CX, FOLD * 0.5, W * 0.7, CORES.papel, CORES.fosforo, FOLD * 0.62);
  } else if (modo === 'conter' || modo === 'sotela') {
    logoNoCanvas(ctx, o, CX, Y_TELA(0.48), W * 0.82, CORES.papel, CORES.fosforo, TELA * 0.8);
  } else { // cobrir e esticar: a marca cruza a dobra
    logoNoCanvas(ctx, o, CX, FOLD, W * 0.94, CORES.papel, CORES.fosforo);
  }
}

/* IMAGEM — o que você subiu, mapeado no desdobrado pelo modo escolhido. */
function imagem(ctx, o) {
  ctx.fillStyle = CORES.preto;
  ctx.fillRect(0, 0, W, H);
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

  switch (o.mapear || 'cobrir') {
    case 'conter': {
      const s = Math.min(W / img.width, H / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      break;
    }
    case 'esticar':
      ctx.drawImage(img, 0, 0, W, H);
      break;
    case 'mosaico': {
      const w = W / 4, h = (img.height / img.width) * w;
      for (let y = 0; y < H; y += h)
        for (let x = 0; x < W; x += w) ctx.drawImage(img, x, y, w, h);
      break;
    }
    case 'sotela': {
      cobre(0, FOLD, W, TELA);
      // no teto, só o eco: a cor média da imagem vazando pela dobra
      if (!img.__media) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 1;
        const c = cv.getContext('2d');
        c.drawImage(img, 0, 0, 1, 1);
        img.__media = c.getImageData(0, 0, 1, 1).data;
      }
      const [r, g, b] = img.__media;
      const veu = ctx.createLinearGradient(0, FOLD, 0, 0);
      veu.addColorStop(0, `rgba(${r},${g},${b},0.30)`);
      veu.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = veu;
      ctx.fillRect(0, 0, W, FOLD);
      break;
    }
    case 'dupla':
      cobre(0, FOLD, W, TELA);
      cobre(0, 0, W, UNFOLD.TETO);
      break;
    default:
      cobre(0, 0, W, H);
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
  conter: 'CONTER',
  esticar: 'ESTICAR',
  mosaico: 'MOSAICO',
  sotela: 'SÓ TELA',
  dupla: 'DUPLA',
};
