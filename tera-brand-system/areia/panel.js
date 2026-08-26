/* Lab 02 · Areia — painel de ajustes gerado a partir do schema de params.js.
   Não conhece a simulação: só lê/escreve valores e avisa quem o criou. */

import { PARAMS, GROUPS, PRESETS, DEFAULTS, format } from './params.js?v=30';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export class Panel {
  /** @param {object} values estado vivo (mutado no lugar)
      @param {(key: string) => void} onChange
      @param {'2d'|'3d'} scope qual lab está pedindo — esconde o que não se aplica */
  constructor(values, onChange, scope = '2d') {
    this.values = values;
    this.onChange = onChange;
    this.scope = scope;
    // scope pode listar mais de um lab: '3d gpu'
    this.keys = Object.keys(PARAMS)
      .filter((k) => !PARAMS[k].scope || PARAMS[k].scope.split(' ').includes(scope));
    this.inputs = new Map();
    this.outputs = new Map();
    this.root = el('aside', 'painel mono');
    this.root.id = 'painel';
    this.root.hidden = true;
    this.root.setAttribute('aria-label', 'Ajustes da simulação');
    this.build();
    document.body.appendChild(this.root);
  }

  build() {
    const head = el('header', 'painel__head');
    head.append(el('h2', 'painel__title', 'Ajustes'));
    const close = el('button', 'painel__close', 'fechar');
    close.type = 'button';
    close.addEventListener('click', () => this.toggle(false));
    head.append(close);
    this.root.append(head, this.buildPresets());
    for (const g of GROUPS) {
      const sec = this.buildGroup(g);
      if (sec) this.root.append(sec);
    }
    this.root.append(this.buildFoot());
  }

  buildPresets() {
    const box = el('div', 'painel__presets');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Presets');
    for (const [id, preset] of Object.entries(PRESETS)) {
      const b = el('button', 'chip', preset.label);
      b.type = 'button';
      b.dataset.preset = id;
      b.addEventListener('click', () => this.applyPreset(id));
      box.append(b);
    }
    return box;
  }

  buildGroup(group) {
    const keys = this.keys.filter((k) => PARAMS[k].group === group.id);
    if (keys.length === 0) return null;
    const sec = el('section', 'painel__grupo');
    sec.append(el('h3', 'painel__legenda', group.label));
    for (const key of keys) sec.append(this.buildRow(key, PARAMS[key]));
    return sec;
  }

  buildRow(key, p) {
    const row = el('label', 'ctl');
    row.title = p.hint ?? '';
    const out = el('output', 'ctl__val', format(key, this.values[key]));
    const input = Object.assign(document.createElement('input'), {
      type: 'range', min: p.min, max: p.max, step: p.step, value: this.values[key],
    });
    input.setAttribute('aria-label', p.label);
    input.addEventListener('input', () => {
      this.values[key] = Number(input.value);
      out.textContent = format(key, this.values[key]);
      this.markPresets();
      this.onChange(key);
    });
    this.inputs.set(key, input);
    this.outputs.set(key, out);
    const head = el('span', 'ctl__head');
    head.append(el('span', 'ctl__nome', p.label), out);
    row.append(head, input);
    return row;
  }

  buildFoot() {
    const foot = el('div', 'painel__foot');
    const reset = el('button', 'chip', 'restaurar');
    reset.type = 'button';
    reset.addEventListener('click', () => this.applyPreset('calmaria'));
    const copy = el('button', 'chip', 'copiar link');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        copy.textContent = 'copiado';
      } catch {
        copy.textContent = location.href;   // sem permissão: mostra para copiar à mão
      }
      setTimeout(() => { copy.textContent = 'copiar link'; }, 1800);
    });
    foot.append(reset, copy);
    return foot;
  }

  applyPreset(id) {
    const preset = PRESETS[id];
    if (!preset) return;
    for (const key of this.keys) {
      const v = preset.values[key] ?? DEFAULTS[key];
      if (this.values[key] === v) continue;
      this.values[key] = v;
      this.onChange(key);
    }
    this.sync();
    this.markPresets(id);
  }

  /** Reflete `values` nos controles (após preset, URL ou mudança externa). */
  sync() {
    for (const [key, input] of this.inputs) {
      input.value = this.values[key];
      this.outputs.get(key).textContent = format(key, this.values[key]);
    }
    this.markPresets();
  }

  /** Acende o preset cujos valores batem exatamente com o estado atual. */
  markPresets(forced) {
    const active = forced ?? Object.entries(PRESETS).find(([, preset]) => (
      this.keys.every((k) => this.values[k] === (preset.values[k] ?? DEFAULTS[k]))
    ))?.[0];
    this.root.querySelectorAll('[data-preset]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.preset === active));
    });
  }

  toggle(open = this.root.hidden) {
    this.root.hidden = !open;
    document.getElementById('ajustes')?.setAttribute('aria-pressed', String(open));
  }

  get open() {
    return !this.root.hidden;
  }
}
