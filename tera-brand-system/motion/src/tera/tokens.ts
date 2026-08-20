// Tokens da marca Téra — fonte: brand/logo/*.svg (gerados por scripts/wordmark_arcos.py).
// Se o wordmark for regenerado, atualizar os paths daqui.

export const PALETTE = {
  ink: '#0A0908',
  cal: '#F2EFE9',
  subsoloDeep: '#120e14',
  plasma: ['#F0529C', '#FF6B2C', '#35D06E', '#31C4FF'],
} as const;

export const VIEWBOX = {x: -40, y: 2, w: 544.2842712474619, h: 248} as const;

export const STROKE_WIDTH = 20;

// Variante com épsilon aberto (bico + rabo sub-baseline) — tera_ink_subsolo.svg
export const WORDMARK_EPSILON =
  'M 12.00 52.00 L 12.00 150.00 M 12.00 150.00 A 40.0 40.0 0 0 0 88.54 166.27 M 2.00 110.00 L 98.00 110.00 M 198.63 118.48 A 40.0 40.0 0 1 0 210.25 166.90 M 209.41 163.77 A 60 60 0 0 1 113.44 207.50 M 190.00 38.00 L 190.00 78.00 M 244.00 200.00 L 244.00 150.00 M 244.00 150.00 A 40.0 40.0 0 1 1 312.28 178.28 M 392.28 110.00 A 40.0 40.0 0 0 0 392.28 190.00 M 392.28 190.00 A 40.0 40.0 0 0 0 392.28 110.00 M 442.28 100.00 L 442.28 200.00';

// Variante com "e" de barra — tera_ink_cal_sobre_subsolo.svg / tera_materia.svg
export const WORDMARK_BARRA =
  'M 12.00 52.00 L 12.00 150.00 M 12.00 150.00 A 40.0 40.0 0 0 0 88.54 166.27 M 2.00 110.00 L 98.00 110.00 M 214.00 150.00 A 40.0 40.0 0 1 0 196.94 182.77 M 134.00 150.00 L 214.00 150.00 M 190.00 38.00 L 190.00 78.00 M 244.00 200.00 L 244.00 150.00 M 244.00 150.00 A 40.0 40.0 0 1 1 312.28 178.28 M 392.28 110.00 A 40.0 40.0 0 0 0 392.28 190.00 M 392.28 190.00 A 40.0 40.0 0 0 0 392.28 110.00 M 442.28 100.00 L 442.28 200.00';

// Quebra um path com múltiplos subpaths ("M ... M ...") em segmentos independentes.
export const splitSubpaths = (d: string): string[] =>
  d
    .split(/(?=M )/)
    .map((s) => s.trim())
    .filter(Boolean);
