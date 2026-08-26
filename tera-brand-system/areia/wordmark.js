/* Lab 02 · Areia — o wordmark como máscara da grade de simulação.

   Três formas, e elas não vêm da mesma matéria:

   · CLIENTE é o arquivo original que o cliente mandou — e ele mandou um PNG,
     não um vetor. Reconstruir aquele desenho em arcos dá o gesto certo mas não
     as proporções: sobrepondo os dois, o kerning e as larguras de letra não
     batem. Então esta forma lê o bitmap dele — é literalmente o logo do
     cliente, com o "e" invertido de bico e cauda.
   · EVOLUÍDO é o wordmark do sistema (scripts/wordmark_arcos.py): mesma
     gramática de um raio e uma espessura, com o "e" redesenhado para legibilidade.
   · VERSAL é o TÉRA em caixa alta bold, na mesma régua e com o traço quase
     dobrado — é a forma que mais segura areia por letra.

   Quem consome só precisa de loadWordmark(forma) -> fitWordmark -> rasterizeWordmark;
   a diferença entre vetor e bitmap morre dentro deste módulo. */

/** Registro das formas. Cada uma tenta o caminho do projeto e depois a cópia
    local, que é a que viaja no deploy da pasta areia/. */
export const SHAPES = {
  cliente: {
    label: 'Cliente',
    hint: 'O original que o cliente mandou, com o "e" invertido',
    kind: 'raster',
    urls: ['../brand/logo/referencia_cliente.png', 'logo/referencia_cliente.png'],
  },
  evoluido: {
    label: 'Evoluído',
    hint: 'O wordmark do sistema, com o "e" redesenhado',
    kind: 'vector',
    urls: ['../brand/logo/tera_ink_subsolo.svg', 'logo/tera_ink_subsolo.svg'],
  },
  versal: {
    label: 'Versal',
    hint: 'TÉRA em caixa alta bold — traço grosso, mais areia por letra',
    kind: 'vector',
    urls: ['../brand/logo/tera_shape_caps.svg', 'logo/tera_shape_caps.svg'],
  },
};

export const DEFAULT_SHAPE = 'evoluido';

/** Nome de forma válido a partir da URL (?forma=), com queda para o padrão. */
export function shapeFromSearch(search = location.search) {
  const nome = new URLSearchParams(search).get('forma');
  return SHAPES[nome] ? nome : DEFAULT_SHAPE;
}

/** Liga os botões [data-forma] dos três labs.

    Trocar a forma refaz a máscara, a grade de paredes e a lista de bocas — em
    quantidades diferentes a cada desenho. Recarregar com ?forma= é o caminho
    honesto: é o que os botões de perfil já fazem, e de quebra deixa cada forma
    com link próprio. */
export function wireShapeButtons(atual = shapeFromSearch()) {
  document.querySelectorAll('[data-forma]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.forma === atual));
    b.title = SHAPES[b.dataset.forma]?.hint ?? '';
    b.addEventListener('click', () => {
      if (b.dataset.forma === atual) return;
      const q = new URLSearchParams(location.search);
      q.set('forma', b.dataset.forma);
      location.search = q.toString();
    });
  });
}

// Cópia do wordmark evoluído — só entra se o fetch falhar (ex.: abrir via file://).
const FALLBACK = {
  kind: 'vector',
  viewBox: [-40, 2, 544.2842712474619, 248],
  strokeWidth: 20,
  d: 'M 12.00 52.00 L 12.00 150.00 M 12.00 150.00 A 40.0 40.0 0 0 0 88.54 166.27 '
    + 'M 2.00 110.00 L 98.00 110.00 M 214.00 150.00 A 40.0 40.0 0 1 0 196.94 182.77 '
    + 'M 134.00 150.00 L 214.00 150.00 M 190.00 38.00 L 190.00 78.00 '
    + 'M 244.00 200.00 L 244.00 150.00 M 244.00 150.00 A 40.0 40.0 0 1 1 312.28 178.28 '
    + 'M 392.28 110.00 A 40.0 40.0 0 0 0 392.28 190.00 M 392.28 190.00 A 40.0 40.0 0 0 0 392.28 110.00 '
    + 'M 442.28 100.00 L 442.28 200.00',
};

/* A área de proteção dos SVGs do sistema é de 40 unidades num desenho de ~460:
   o bitmap precisa da mesma folga relativa, senão o logo do cliente entraria na
   caixa de areia num tamanho diferente do das outras duas formas. */
const CLEARSPACE = 0.087;
const TINTA = 140;        // limiar de luminância: abaixo disto é traço

/** Lê o SVG e extrai viewBox, path e espessura. */
async function loadVector(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const svg = doc.querySelector('svg');
      const path = doc.querySelector('path');
      if (!svg || !path) throw new Error('SVG sem <path>');
      return {
        kind: 'vector',
        viewBox: svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number),
        strokeWidth: Number(path.getAttribute('stroke-width')) || FALLBACK.strokeWidth,
        d: path.getAttribute('d'),
      };
    } catch {
      // tenta o próximo caminho
    }
  }
  return null;
}

const carregarImagem = (url) => new Promise((ok, falha) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => falha(new Error(`imagem não carregou: ${url}`));
  img.src = url;
});

/** Caixa da tinta e espessura do traço de um bitmap monolinear.

    O viewBox do bitmap é a caixa da TINTA, não a do arquivo: o PNG do cliente
    tem margem branca própria, e usá-la como moldura encolheria o logo dentro da
    caixa de areia em relação às outras formas.

    A espessura sai da MODA das corridas horizontais de tinta — num desenho
    monolinear o comprimento que mais se repete é a própria espessura do traço.
    Média ou mediana não serviriam: as barras horizontais do "t" e do "e" são
    corridas longuíssimas e puxam as duas para cima. */
function medirBitmap(img) {
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth;
  cv.height = img.naturalHeight;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, cv.width, cv.height).data;

  let x0 = cv.width;
  let y0 = cv.height;
  let x1 = -1;
  let y1 = -1;
  const hist = new Uint32Array(cv.width + 2);
  for (let y = 0; y < cv.height; y++) {
    let corrida = 0;
    for (let x = 0; x <= cv.width; x++) {          // um passo além: fecha a corrida da borda
      const i = (y * cv.width + x) << 2;
      const tinta = x < cv.width && px[i + 3] > 128 && px[i] < TINTA;
      if (tinta) {
        corrida++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      } else if (corrida) {
        hist[corrida]++;
        corrida = 0;
      }
    }
  }
  if (x1 < 0) throw new Error('bitmap sem tinta');

  let moda = 1;
  for (let n = 2; n < hist.length; n++) if (hist[n] > hist[moda]) moda = n;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const pad = CLEARSPACE * w;
  return {
    viewBox: [x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad],
    strokeWidth: moda,
  };
}

async function loadRaster(urls) {
  for (const url of urls) {
    try {
      const img = await carregarImagem(url);
      return { kind: 'raster', image: img, ...medirBitmap(img) };
    } catch {
      // tenta o próximo caminho
    }
  }
  return null;
}

/** Carrega uma das formas de SHAPES. Devolve sempre algo desenhável. */
export async function loadWordmark(shape = DEFAULT_SHAPE) {
  const nome = SHAPES[shape] ? shape : DEFAULT_SHAPE;
  const entry = SHAPES[nome];
  const wm = entry.kind === 'raster'
    ? await loadRaster(entry.urls)
    : await loadVector(entry.urls);
  if (wm) return { ...wm, shape: nome };
  console.warn(`[areia] forma "${nome}": usando cópia embutida`);
  return { ...FALLBACK, shape: DEFAULT_SHAPE };
}

/** Encaixa o viewBox do wordmark numa grade w×h (pixels de simulação).
    O viewBox já traz 1R de área de proteção em volta das letras. */
export function fitWordmark(wm, w, h, { marginX = 0.06, marginY = 0.12, yBias = 0.5 } = {}) {
  const [vx, vy, vw, vh] = wm.viewBox;
  const scale = Math.min((w * (1 - 2 * marginX)) / vw, (h * (1 - 2 * marginY)) / vh);
  return {
    scale,
    tx: (w - vw * scale) / 2 - vx * scale,
    ty: (h - vh * scale) * yBias - vy * scale,
    strokePx: wm.strokeWidth * scale,
  };
}

/** Rasteriza o traço do wordmark na grade.
    Retorna `inside` (Uint8Array, 1 = dentro da letra) e o bbox das letras. */
export function rasterizeWordmark(wm, w, h, fit) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(fit.scale, 0, 0, fit.scale, fit.tx, fit.ty);
  if (wm.kind === 'raster') {
    // o viewBox do bitmap está em pixels da imagem, então ela entra na origem e
    // a transformada do fit resolve escala e centragem
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(wm.image, 0, 0);
  } else {
    ctx.lineWidth = wm.strokeWidth;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#fff';
    ctx.stroke(new Path2D(wm.d));
  }

  const px = ctx.getImageData(0, 0, w, h).data;
  const inside = new Uint8Array(w * h);
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  // no vetor o traço é branco sobre transparente; no bitmap do cliente o fundo
  // é BRANCO OPACO, e alpha sozinho aceitaria a folha inteira como letra
  const eTinta = wm.kind === 'raster'
    ? (i) => px[(i << 2) | 3] > 128 && px[i << 2] < TINTA
    : (i) => px[(i << 2) | 3] >= 128;
  for (let i = 0; i < inside.length; i++) {
    if (!eTinta(i)) continue;
    inside[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 < 0) return { inside, bbox: { x0: 0, y0: 0, x1: w, y1: h } };
  return { inside, bbox: { x0, y0, x1: x1 + 1, y1: y1 + 1 } };
}

/** Topo de cada trecho aberto, coluna a coluna, dentro de `bbox`.
    São as fontes da "chuva": pares planos [x, y, x, y, ...]. */
export function columnRunTops(solid, w, bbox) {
  const tops = [];
  for (let x = bbox.x0; x < bbox.x1; x++) {
    let prevSolid = 1;
    for (let y = bbox.y0; y < bbox.y1; y++) {
      const s = solid[y * w + x];
      if (s === 0 && prevSolid !== 0) tops.push(x, y);
      prevSolid = s;
    }
  }
  return Int32Array.from(tops);
}
