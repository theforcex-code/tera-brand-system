/* Lab 02 · Areia — parâmetros abertos da simulação.
   Fonte única: o schema abaixo gera o painel, o estado, a URL e os presets.
   Cada cena é reproduzível — mesma semente + mesmos parâmetros = mesma areia. */

export const PARAMS = {
  // ---- tempo ----
  velocidade: {
    group: 'tempo', label: 'Velocidade', min: 0, max: 4, step: 0.05, value: 1,
    unit: '×', hint: 'Multiplica os passos por segundo. 0 congela.',
  },
  duracao: {
    group: 'tempo', label: 'Encher em', min: 1, max: 60, step: 0.5, value: 8,
    unit: 's', hint: 'Tempo alvo do preenchimento cronometrado (botão Encher).',
  },
  nivel: {
    group: 'tempo', label: 'Nível', min: 5, max: 100, step: 1, value: 100,
    unit: '%', hint: 'Quanto da área disponível o preenchimento ocupa. Em Vão é o interior '
      + 'das letras; em Duna é a tela inteira — 100% ali são milhões de grãos.',
  },

  // ---- física ----
  gravidade: {
    group: 'fisica', label: 'Gravidade', min: 1, max: 12, step: 1, value: 4,
    unit: ' px', hint: 'Células que um grão desce por passo.',
  },
  vento: {
    group: 'fisica', label: 'Vento', min: -1, max: 1, step: 0.01, value: 0,
    hint: 'Desvia o grão em queda e enviesa o lado para onde ele escorrega.',
  },
  rajada: {
    group: 'fisica', label: 'Rajada', min: 0, max: 1, step: 0.01, value: 0,
    hint: 'Oscilação do vento no tempo (soma de senóides).',
  },
  periodo: {
    group: 'fisica', label: 'Período', min: 1, max: 30, step: 0.5, value: 7,
    unit: 's', hint: 'Ciclo da rajada.',
  },
  talude: {
    group: 'fisica', label: 'Talude', min: 0, max: 1, step: 0.01, value: 0,
    hint: 'Chance de o grão travar em vez de escorregar. 0 espalha, 1 empilha em coluna.',
  },
  dispersao: {
    group: 'fisica', label: 'Dispersão', min: 1, max: 4, step: 1, value: 1, scope: '2d',
    unit: ' px', hint: 'Salto lateral ao escorregar. Acima de 1 a areia corre como líquido.',
  },
  erosao: {
    group: 'fisica', label: 'Erosão', min: 0, max: 1, step: 0.01, value: 0, scope: '2d',
    hint: 'O vento arranca grãos já assentados e a duna migra. Custa caro — deixe em 0 se pesar.',
  },
  direcao: {
    group: 'fisica', label: 'Direção', min: 0, max: 360, step: 5, value: 0, scope: '3d',
    unit: '°', hint: 'Para onde o vento sopra no plano do chão.',
  },

  // ---- matéria ----
  chuva: {
    group: 'materia', label: 'Chuva', min: 1, max: 100, step: 1, value: 45,
    unit: '%', hint: 'Densidade da chuva contínua.',
  },
  jato: {
    group: 'materia', label: 'Jato', min: 1, max: 24, step: 1, value: 0,
    unit: ' px', hint: 'Raio do despejo no toque. 0 usa a espessura do traço.',
  },
  deriva: {
    group: 'materia', label: 'Deriva', min: 0, max: 6, step: 0.1, value: 1,
    unit: '×', hint: 'Velocidade com que a cor caminha na paleta — desenha os estratos.',
  },
  semente: {
    group: 'materia', label: 'Semente', min: 1, max: 9999, step: 1, value: 1,
    hint: 'Mesma semente + mesmos parâmetros = mesma cena.',
  },

  // ---- câmera ----
  corte: {
    group: 'camera', label: 'Corte', min: 0, max: 100, step: 1, value: 100, scope: '3d',
    unit: '%', hint: 'Fatia a rocha e mostra os estratos — cada camada é um instante do despejo.',
  },
  orbita: {
    group: 'camera', label: 'Órbita', min: 0, max: 1, step: 0.05, value: 0.25, scope: '3d',
    unit: '×', hint: 'Giro automático da câmera. Arraste para conduzir; role para aproximar.',
  },
};

export const GROUPS = [
  { id: 'tempo', label: 'Tempo' },
  { id: 'fisica', label: 'Física' },
  { id: 'materia', label: 'Matéria' },
  { id: 'camera', label: 'Câmera' },
];

/** Presets: só o que difere do padrão. */
export const PRESETS = {
  calmaria: { label: 'Calmaria', values: {} },
  vendaval: {
    label: 'Vendaval',
    values: { vento: 0.62, rajada: 0.55, periodo: 5, erosao: 0.35, dispersao: 2,
      velocidade: 1.4, direcao: 20, orbita: 0.5 },
  },
  ampulheta: {
    label: 'Ampulheta',
    values: { talude: 0.55, gravidade: 2, velocidade: 0.55, chuva: 18, duracao: 20,
      deriva: 0.4, orbita: 0.12 },
  },
  avalanche: {
    label: 'Avalanche',
    values: { gravidade: 10, dispersao: 3, velocidade: 2.2, chuva: 85, duracao: 3,
      deriva: 2.6, orbita: 0.45 },
  },
  rocha: {
    label: 'Rocha',
    values: { talude: 0.45, gravidade: 6, chuva: 70, duracao: 14, nivel: 100,
      deriva: 1.8, orbita: 0.18, corte: 100 },
  },
  poeira: {
    label: 'Poeira',
    values: { gravidade: 1, vento: -0.28, rajada: 0.4, periodo: 12, chuva: 12,
      velocidade: 0.7, deriva: 0.3, direcao: 200, orbita: 0.08 },
  },
};

export const DEFAULTS = Object.fromEntries(
  Object.entries(PARAMS).map(([k, p]) => [k, p.value]),
);

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** Ajusta ao intervalo e ao passo declarados (protege contra URL adulterada). */
export function coerce(key, raw) {
  const p = PARAMS[key];
  const n = Number(raw);
  if (!p || !Number.isFinite(n)) return DEFAULTS[key];
  const snapped = Math.round((n - p.min) / p.step) * p.step + p.min;
  return Number(clamp(snapped, p.min, p.max).toFixed(4));
}

export function fromSearch(search) {
  const q = new URLSearchParams(search);
  const values = { ...DEFAULTS };
  const preset = PRESETS[q.get('preset')];
  if (preset) Object.assign(values, preset.values);
  for (const key of Object.keys(PARAMS)) {
    if (q.has(key)) values[key] = coerce(key, q.get(key));
  }
  return values;
}

/** Query com apenas o que difere do padrão, mais o estado de cena passado em `extra`. */
export function toSearch(values, extra = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== false) q.set(k, v === true ? '' : String(v));
  }
  for (const [k, v] of Object.entries(values)) {
    if (v !== DEFAULTS[k]) q.set(k, String(v));
  }
  return q.toString();
}

export function format(key, v) {
  const p = PARAMS[key];
  const dec = p.step < 0.1 ? 2 : p.step < 1 ? 1 : 0;
  return `${v.toFixed(dec)}${p.unit ?? ''}`;
}
