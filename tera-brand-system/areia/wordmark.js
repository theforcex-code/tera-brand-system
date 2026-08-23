/* Lab 02 · Areia — o wordmark como máscara da grade de simulação.
   Fonte única do desenho: brand/logo/tera_ink_subsolo.svg
   (gerado por scripts/wordmark_arcos.py — regenerar o SVG atualiza o lab). */

// primeiro o SVG oficial do projeto; depois a cópia que viaja no deploy
const SVG_URLS = ['../brand/logo/tera_ink_subsolo.svg', 'logo/tera_ink_subsolo.svg'];

// Cópia do último SVG gerado — só entra se o fetch falhar (ex.: abrir via file://).
const FALLBACK = {
  viewBox: [-40, 2, 544.2842712474619, 248],
  strokeWidth: 20,
  d: 'M 12.00 52.00 L 12.00 150.00 M 12.00 150.00 A 40.0 40.0 0 0 0 88.54 166.27 '
    + 'M 2.00 110.00 L 98.00 110.00 M 214.00 150.00 A 40.0 40.0 0 1 0 196.94 182.77 '
    + 'M 134.00 150.00 L 214.00 150.00 M 190.00 38.00 L 190.00 78.00 '
    + 'M 244.00 200.00 L 244.00 150.00 M 244.00 150.00 A 40.0 40.0 0 1 1 312.28 178.28 '
    + 'M 392.28 110.00 A 40.0 40.0 0 0 0 392.28 190.00 M 392.28 190.00 A 40.0 40.0 0 0 0 392.28 110.00 '
    + 'M 442.28 100.00 L 442.28 200.00',
};

/** Lê o SVG oficial e extrai viewBox, path e espessura. */
export async function loadWordmark() {
  for (const url of SVG_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const svg = doc.querySelector('svg');
      const path = doc.querySelector('path');
      if (!svg || !path) throw new Error('SVG sem <path>');
      return {
        viewBox: svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number),
        strokeWidth: Number(path.getAttribute('stroke-width')) || FALLBACK.strokeWidth,
        d: path.getAttribute('d'),
      };
    } catch {
      // tenta o próximo caminho
    }
  }
  console.warn('[areia] wordmark: usando cópia embutida');
  return FALLBACK;
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
  ctx.lineWidth = wm.strokeWidth;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#fff';
  ctx.stroke(new Path2D(wm.d));

  const alpha = ctx.getImageData(0, 0, w, h).data;
  const inside = new Uint8Array(w * h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < inside.length; i++) {
    if (alpha[(i << 2) | 3] < 128) continue;
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
