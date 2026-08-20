/* Téra case. Gramática única: nada aparece, tudo se abre. Easing seco. */

const BLACK = '#0a0a0c';
const PAPER = '#f4f4f1';
const WHITE = '#fafafa';
const FOSFORO = '#2cf5a0';
const GREY = '#8a8a86';
const PLANO = 32 / 9; // proporção provisória do painel

const QA = new URLSearchParams(location.search).has('qa'); // estado final estático p/ screenshots
const RM = QA || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) document.documentElement.classList.add('static');
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const eo = (x) => 1 - Math.pow(2, -10 * Math.min(Math.max(x, 0), 1)); // expo out, seco
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const phase = (t, a, b) => clamp01((t - a) / (b - a));

/* ---------- fontes prontas antes de desenhar em canvas ---------- */

const fontsReady = Promise.all([
  document.fonts.load('900 100px "Archivo Exp"'),
  document.fonts.load('900 100px "Archivo Cond"'),
  document.fonts.load('900 100px Archivo'),
  document.fonts.load('700 16px "Space Mono"'),
  document.fonts.load('400 16px "Space Mono"'),
]).catch(() => {});

/* ---------- wordmark em canvas: acento do É = fresta ---------- */

// canvas ignora eixos de fonte variável: usa instâncias estáticas (fonttools)
function setDisplayFont(ctx, size, stretch) {
  const family = stretch === 'extra-condensed' ? 'Archivo Cond' : 'Archivo Exp';
  ctx.font = `900 ${size}px "${family}"`;
}

function drawWordmark(ctx, cx, cy, size, color, accent, reveal = 1) {
  setDisplayFont(ctx, size, 'expanded');
  ctx.textBaseline = 'alphabetic';
  const letters = ['T', 'E', 'R', 'A'];
  const track = -0.025 * size;
  const widths = letters.map((l) => ctx.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (letters.length - 1);
  const baseline = cy + size * 0.36;
  const capTop = baseline - size * 0.72;
  let x = cx - total / 2;

  letters.forEach((l, i) => {
    const p = eo(clamp01(reveal * letters.length - i));
    if (p > 0) {
      const h = size * 1.3 * p;
      const mid = baseline - size * 0.36;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - size * 0.05, mid - h / 2, widths[i] + size * 0.1, h);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillText(l, x, baseline);
      ctx.restore();
      if (l === 'E' && p > 0.6) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + widths[i] * 0.1, capTop - size * 0.24, widths[i] * 0.8, size * 0.1);
      }
    }
    x += widths[i] + track;
  });
}

/* ---------- controllers de canvas ---------- */

const controllers = [];

function makeCanvas(card, draw, staticDraw) {
  const canvas = card.querySelector('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const ctl = { card, canvas, ctx, draw, staticDraw, active: false, w: 0, h: 0, start: performance.now() };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    canvas.width = Math.round(r.width * DPR);
    canvas.height = Math.round(r.height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctl.w = r.width;
    ctl.h = r.height;
    if (RM) staticDraw(ctx, ctl.w, ctl.h);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  controllers.push(ctl);
  return ctl;
}

/* ---------- 01 · hero: preto → fresta → plano → mundo → assinatura ---------- */

function heroFrame(ctx, W, H, t) {
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  const fw = 0.62 * W;
  const fh = Math.max(2.5, 0.004 * H);
  const pw = 0.86 * W;
  const ph = Math.min(pw / PLANO, 0.5 * H);
  let w = 0, h = 0, on = false;

  if (t < 0.06) return;

  if (t < 0.12) { on = true; w = fw * eo(phase(t, 0.06, 0.12)); h = fh; }
  else if (t < 0.2) {
    on = true; w = fw; h = fh;
    const f = phase(t, 0.12, 0.2);
    if ((f > 0.3 && f < 0.38) || (f > 0.62 && f < 0.68)) on = false; // flicker: liga/desliga, não fade
  } else if (t < 0.34) {
    on = true;
    const f = eo(phase(t, 0.2, 0.34));
    w = fw + (pw - fw) * f;
    h = fh + (ph - fh) * f;
  } else if (t < 0.46) { on = true; w = pw; h = ph; }
  else if (t < 0.58) {
    on = true;
    const f = eo(phase(t, 0.46, 0.58));
    w = pw + (W - pw) * f;
    h = ph + (H - ph) * f;
  } else if (t < 0.86) { on = true; w = W; h = H; }
  else if (t < 0.93) {
    on = true;
    const f = eo(phase(t, 0.86, 0.93));
    w = W;
    h = H + (fh - H) * f;
  }

  if (!on || w <= 0) return;

  const x = (W - w) / 2, y = (H - h) / 2;
  ctx.fillStyle = FOSFORO;
  ctx.fillRect(x, y, w, h);

  if (t >= 0.34) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const grow = eo(phase(t, 0.46, 0.58));
    const s = ph * 0.52 + (Math.min(W / 5.4, H * 0.3) - ph * 0.52) * grow;
    const reveal = t < 0.46 ? phase(t, 0.35, 0.44) : 1;
    drawWordmark(ctx, W / 2, H / 2, s, BLACK, BLACK, reveal);
    if (t >= 0.58 && t < 0.86) {
      ctx.fillStyle = BLACK;
      ctx.font = '700 13px "Space Mono"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('MATA SÃO PAULO', 24, H - 28);
      const m = ctx.measureText('TEMPORADA 01, SET 2027');
      ctx.fillText('TEMPORADA 01, SET 2027', W - m.width - 24, H - 28);
    }
    ctx.restore();
  }
}

/* ---------- 04 · estados: o generativo é conteúdo, nunca marca ---------- */

const ESTADOS = [
  { n: '001', nome: 'GRAVIDADE' },
  { n: '002', nome: 'MARÉ' },
  { n: '003', nome: 'FEBRE' },
];

function estadoPattern(ctx, x, y, w, h, idx, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = BLACK;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = FOSFORO;

  if (idx === 0) {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const ly = y + (h * (i + 0.5)) / n;
      const amp = h * 0.09 * Math.sin(i * 1.7 + time * 0.0012);
      for (let sx = 0; sx < w; sx += 3) {
        const dy = amp * Math.sin((sx / w) * Math.PI * 2 + time * 0.0009 + i);
        ctx.fillRect(x + sx, ly + dy, 2.2, 1.4);
      }
    }
  } else if (idx === 1) {
    const step = w / 42;
    for (let gx = 0; gx < 42; gx++) {
      for (let gy = 0; gy < Math.ceil(h / step); gy++) {
        const px = x + gx * step + step / 2;
        const py = y + gy * step + step / 2;
        const r = step * 0.34 * (0.5 + 0.5 * Math.sin(gx * 0.6 + gy * 0.8 + time * 0.0016));
        if (r > step * 0.12) { ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  } else {
    const n = 46;
    const slot = Math.floor(time / 110); // troca em passos, sem interpolar
    for (let i = 0; i < n; i++) {
      const seed = Math.sin(i * 127.1 + slot * 311.7) * 43758.5453;
      const v = seed - Math.floor(seed);
      const bh = h * (0.15 + 0.85 * v);
      const bw = w / n;
      ctx.fillRect(x + i * bw + bw * 0.18, y + (h - bh) / 2, bw * 0.64, bh);
    }
  }
  ctx.restore();
}

function estadoFrame(ctx, W, H, timeMs) {
  const CYCLE = 3600;
  const total = CYCLE * ESTADOS.length;
  const tm = timeMs % total;
  const idx = Math.floor(tm / CYCLE);
  const local = (tm % CYCLE) / CYCLE;

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  const m = W * 0.09;
  const bw = W - 2 * m;
  const bhFull = bw / PLANO;
  const by = H * 0.14;

  // abertura entre estados: a banda fecha em fresta e reabre
  let bh = bhFull;
  if (local < 0.09) bh = Math.max(2, bhFull * eo(local / 0.09));
  else if (local > 0.94) bh = Math.max(2, bhFull * eo((1 - local) / 0.06));
  estadoPattern(ctx, m, by + (bhFull - bh) / 2, bw, bh, idx, timeMs);

  // tipo justificado na largura da mancha, como bloco
  const fitSize = (text, stretch, target, max) => {
    setDisplayFont(ctx, 100, stretch);
    return Math.min(max, (100 * target) / ctx.measureText(text).width);
  };
  const e = ESTADOS[idx];
  const labelA = `Estado ${e.n}`;
  const sA = fitSize(labelA, 'expanded', bw, W * 0.16);
  const sB = fitSize(e.nome, 'extra-condensed', bw, W * 0.26);
  const yA = by + bhFull + W * 0.06 + sA * 0.72;
  const yB = yA + sB * 0.82;

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = WHITE;
  setDisplayFont(ctx, sA, 'expanded');
  ctx.fillText(labelA, m, yA);

  ctx.fillStyle = FOSFORO;
  setDisplayFont(ctx, sB, 'extra-condensed');
  ctx.fillText(e.nome, m, yB);

  ctx.fillStyle = GREY;
  ctx.font = `700 ${Math.max(10, W * 0.024)}px "Space Mono"`;
  ctx.fillText('MATA SÃO PAULO', m, H - W * 0.155);
  ctx.fillText('TEMPORADA 01, SET 2027', m, H - W * 0.115);
  ctx.fillText('tera.art.br', m, H - W * 0.075);

  drawWordmark(ctx, W - m - W * 0.1, H - W * 0.115, W * 0.052, WHITE, FOSFORO, 1);
}

/* ---------- 05 · ooh: o tipo atravessa o Plano e acende ---------- */

function oohFrame(ctx, W, H, timeMs) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const pw = 0.82 * W;
  const ph = pw / PLANO;
  const px = (W - pw) / 2;
  const py = (H - ph) / 2;
  ctx.fillStyle = BLACK;
  ctx.fillRect(px, py, pw, ph);

  const size = ph * 0.92; // o tipo atravessa o Plano, um pouco maior que a banda
  setDisplayFont(ctx, size, 'extra-condensed');
  ctx.textBaseline = 'alphabetic';
  const msg = 'A SALA QUE ABRE DIMENSÕES.  ';
  const mw = ctx.measureText(msg).width;
  const speed = W / 9000;
  const off = -((timeMs * speed) % mw);
  const baseline = py + ph / 2 + size * 0.36;

  const paint = (color) => {
    ctx.fillStyle = color;
    for (let x = off; x < W; x += mw) ctx.fillText(msg, x, baseline);
  };

  paint(BLACK);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  paint(FOSFORO);
  ctx.restore();
}

/* ---------- 09 · construção: as guias contam a régua ---------- */

function constructionFrame(ctx, W, H, timeMs) {
  const t = Math.min(timeMs / 2000, 1);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const s = Math.min(W / 5.6, H * 0.34);
  const cx = W / 2;
  const cy = H * 0.54;
  const baseline = cy + s * 0.36;
  const capTop = baseline - s * 0.72;
  const accTop = capTop - s * 0.24;
  const accBot = capTop - s * 0.14;

  const guideP = eo(phase(t, 0, 0.45));
  const gw = W * 0.86 * guideP;
  const gx = cx - gw / 2;
  ctx.strokeStyle = 'rgba(10,10,12,0.32)';
  ctx.lineWidth = 1;
  [baseline, capTop, accTop, accBot].forEach((y, i) => {
    ctx.setLineDash(i > 1 ? [5, 6] : []);
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + gw, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  drawWordmark(ctx, cx, cy, s, BLACK, FOSFORO, phase(t, 0.4, 0.95));

  if (t > 0.6) {
    ctx.fillStyle = GREY;
    ctx.font = `700 ${Math.max(10, W * 0.011)}px "Space Mono"`;
    ctx.textBaseline = 'alphabetic';
    const lx = gx + 4;
    ctx.fillText('CAIXA-ALTA', lx, capTop - 6);
    ctx.fillText('BASE', lx, baseline - 6);
    ctx.fillText('FRESTA 0.10 EM', lx, accTop - 6);
    const rx = gx + gw;
    const spec = 'ARCHIVO VAR / WGHT 900 / WDTH 125';
    const sw = ctx.measureText(spec).width;
    ctx.fillText(spec, rx - sw - 4, baseline + 22);
  }
}

/* ---------- especímen: largura variável em passos, sem interpolação ---------- */

function initSpecimen() {
  const rows = document.querySelectorAll('.specimen__row');
  if (!rows.length) return;
  const widths = [62, 100, 125];
  if (RM) return;
  let step = 0;
  setInterval(() => {
    step++;
    rows.forEach((row) => {
      const off = Number(row.dataset.off || 0);
      const w = widths[(step + off) % widths.length];
      row.style.fontVariationSettings = `'wdth' ${w}, 'wght' 900`;
    });
  }, 700);
}

/* ---------- manifesto: linha a linha, por abertura ---------- */

function initManifesto() {
  const lines = document.querySelectorAll('.manifesto__line');
  if (!lines.length) return;
  if (RM) { lines.forEach((l) => l.classList.add('on')); document.querySelectorAll('.manifesto__line').forEach((l) => (l.style.transition = 'none')); return; }
  let i = 0;
  setInterval(() => {
    if (i < lines.length) { lines[i].classList.add('on'); i++; }
    else if (i === lines.length + 1) { lines.forEach((l) => l.classList.remove('on')); i = 0; }
    else i++;
  }, 850);
}

/* ---------- ingresso: código de barras de frestas ---------- */

function initTicket() {
  const bc = document.querySelector('.ticket__barcode');
  if (!bc) return;
  const N = 44;
  const bars = [];
  for (let i = 0; i < N; i++) {
    const bar = document.createElement('i');
    bar.style.flexGrow = String(0.4 + Math.random() * 2.6);
    bar.style.marginRight = Math.random() > 0.5 ? '3px' : '5px';
    bc.appendChild(bar);
    bars.push(bar);
  }
  let lit = Math.floor(Math.random() * N);
  bars[lit].classList.add('on');
  if (RM) return;
  setInterval(() => {
    bars[lit].classList.remove('on');
    lit = Math.floor(Math.random() * N);
    bars[lit].classList.add('on');
  }, 1600);
}

/* ---------- revelação por scroll + ativação dos canvases ---------- */

function initObservers() {
  const cards = document.querySelectorAll('.card, .card--text');

  const openCard = (c) => {
    c.classList.add('open');
    const story = c.querySelector('.story');
    if (story) story.classList.add('play');
  };

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        openCard(en.target);
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 12% 0px' });

  cards.forEach((c) => {
    if (RM) openCard(c);
    else revealIO.observe(c);
  });

  // rede de segurança: se em 4s nenhum card abriu, o observer falhou; abre tudo
  setTimeout(() => {
    if (!document.querySelector('.card.open')) cards.forEach(openCard);
  }, 4000);

  const activeIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const ctl = controllers.find((c) => c.card === en.target);
      if (!ctl) return;
      ctl.active = en.isIntersecting;
      if (en.isIntersecting && ctl.resetOnEnter) ctl.start = performance.now();
    });
  }, { threshold: 0.05 });

  controllers.forEach((c) => activeIO.observe(c.card));
}

/* ---------- loop ---------- */

function loop(now) {
  controllers.forEach((c) => {
    if (!c.active || !c.w) return;
    c.draw(c.ctx, c.w, c.h, now - c.start);
  });
  requestAnimationFrame(loop);
}

/* ---------- boot ---------- */

// boot não pode depender das fontes: se elas travarem, a página abre mesmo assim
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  const hero = document.querySelector('[data-motion="hero"]');
  if (hero) makeCanvas(hero,
    (ctx, w, h, t) => heroFrame(ctx, w, h, (t % 7500) / 7500),
    (ctx, w, h) => { heroFrame(ctx, w, h, 0.7); });

  const estado = document.querySelector('[data-motion="estado"]');
  if (estado) makeCanvas(estado, estadoFrame, (ctx, w, h) => estadoFrame(ctx, w, h, 600));

  const ooh = document.querySelector('[data-motion="ooh"]');
  if (ooh) makeCanvas(ooh, oohFrame, (ctx, w, h) => oohFrame(ctx, w, h, 2400));

  const cons = document.querySelector('[data-motion="construction"]');
  if (cons) {
    const ctl = makeCanvas(cons, constructionFrame, (ctx, w, h) => constructionFrame(ctx, w, h, 2000));
    if (ctl) ctl.resetOnEnter = true;
  }

  initSpecimen();
  initManifesto();
  initTicket();
  initObservers();

  if (!RM) requestAnimationFrame(loop);
  else controllers.forEach((c) => c.staticDraw(c.ctx, c.w, c.h));

  // garante redraw com as fontes definitivas (evita corrida em ambientes headless)
  document.fonts.ready.then(() => {
    if (RM) controllers.forEach((c) => c.staticDraw(c.ctx, c.w, c.h));
  });

  const scrollTo = new URLSearchParams(location.search).get('scroll');
  if (scrollTo !== null) {
    history.scrollRestoration = 'manual';
    const jump = () => {
      if (scrollTo.startsWith('s')) {
        const secs = document.querySelectorAll('main > section, footer');
        const sec = secs[Number(scrollTo.slice(1))];
        if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
      } else {
        window.scrollTo({ top: Number(scrollTo), behavior: 'instant' });
      }
    };
    jump();
    setTimeout(jump, 250);
    setTimeout(jump, 800);
  }
}

fontsReady.then(boot);
setTimeout(boot, 1500); // failsafe: fontes lentas ou travadas não seguram a página
