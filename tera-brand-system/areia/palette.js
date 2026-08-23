/* Lab 02 · Areia — paletas da marca como LUT de cor de grão.
   Cada paleta é cíclica (o último stop volta ao primeiro): a cor do grão
   deriva devagar ao longo do despejo e isso é o que desenha os estratos. */

export const LUT_SIZE = 1024;
export const LUT_SHIFT = 10;               // log2(LUT_SIZE) — usado pelo motor
const GRAIN_VARIANTS = [0.9, 0.96, 1.0, 1.06]; // textura: 4 brilhos por cor

export const PALETTES = {
  plasma: {
    label: 'Plasma',
    stops: ['#F0529C', '#FF6B2C', '#35D06E', '#31C4FF'],
  },
  subsolo: {
    label: 'Subsolo',
    stops: ['#F2EFE9', '#D9C3A0', '#C98F4A', '#8A5A2E', '#4F3320', '#A9713C'],
  },
  cal: {
    label: 'Cal',
    stops: ['#F2EFE9', '#B9B4AA', '#F2EFE9', '#7C7872'],
  },
};

const IS_LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/** Empacota RGBA no layout de bytes do ImageData como um Uint32 sem sinal. */
export function packRGB(r, g, b, a = 255) {
  const packed = IS_LITTLE_ENDIAN
    ? (a << 24) | (b << 16) | (g << 8) | r
    : (r << 24) | (g << 16) | (b << 8) | a;
  return packed >>> 0;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);

/** LUT cíclica: GRAIN_VARIANTS.length linhas × LUT_SIZE colunas (Uint32). */
export function buildLut(stops) {
  const rgb = stops.map(hexToRgb);
  const n = rgb.length;
  const lut = new Uint32Array(LUT_SIZE * GRAIN_VARIANTS.length);
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = (i / LUT_SIZE) * n;
    const k = Math.floor(t);
    const f = t - k;
    const s = f * f * (3 - 2 * f);                 // smoothstep: bandas macias
    const a = rgb[k % n];
    const b = rgb[(k + 1) % n];
    for (let v = 0; v < GRAIN_VARIANTS.length; v++) {
      const m = GRAIN_VARIANTS[v];
      lut[(v << LUT_SHIFT) | i] = packRGB(
        clamp255((a[0] + (b[0] - a[0]) * s) * m),
        clamp255((a[1] + (b[1] - a[1]) * s) * m),
        clamp255((a[2] + (b[2] - a[2]) * s) * m),
      );
    }
  }
  return lut;
}

/** Índice de LUT para uma posição cíclica 0..∞ na paleta. */
export function lutIndex(pos) {
  return ((pos - Math.floor(pos)) * LUT_SIZE) & (LUT_SIZE - 1);
}
