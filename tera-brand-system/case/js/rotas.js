const ROUTES_BLACK = '#09090b';
const ROUTES_PLASMA = ['#4867ff', '#7b59ff', '#b657ff', '#ff4f72', '#ff754f', '#f0b34b', '#d8dbe8'];
const ROUTES_RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROUTES_DPR = Math.min(window.devicePixelRatio || 1, 2);

const routesClamp = (value) => Math.min(Math.max(value, 0), 1);
const routesEase = (value) => 1 - Math.pow(2, -10 * routesClamp(value));

function drawRoutePlasma(ctx, x, y, width, height, timeMs) {
  if (width <= 0 || height <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.fillStyle = ROUTES_BLACK;
  ctx.fillRect(x, y, width, height);

  const cell = Math.max(9, Math.min(24, Math.round(width / 62)));
  const columns = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const time = timeMs * 0.001;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const field =
        Math.sin(column * 0.21 + time * 0.92 + 0.7) +
        Math.cos(row * 0.27 - time * 0.71 + 0.3) +
        Math.sin((column + row) * 0.11 + time * 0.38 - 0.5);
      const normalized = routesClamp((field + 2.5) / 5);
      const colorIndex = Math.min(ROUTES_PLASMA.length - 1, Math.floor(normalized * ROUTES_PLASMA.length));
      const gate = Math.sin(column * 0.47 - row * 0.31 + time);

      if (gate < -0.82) continue;
      ctx.globalAlpha = 0.72 + normalized * 0.28;
      ctx.fillStyle = ROUTES_PLASMA[colorIndex];
      ctx.fillRect(x + column * cell, y + row * cell, cell + 0.6, cell + 0.6);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function initFieldStage() {
  const canvas = document.querySelector('#field-canvas');
  if (!canvas) return;

  const stage = canvas.closest('.brand-stage');
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let active = false;
  const startedAt = performance.now();

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * ROUTES_DPR);
    canvas.height = Math.round(height * ROUTES_DPR);
    ctx.setTransform(ROUTES_DPR, 0, 0, ROUTES_DPR, 0, 0);
    if (ROUTES_RM) drawRoutePlasma(ctx, 0, 0, width, height, 4400);
  };

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (ROUTES_RM) return;

  new IntersectionObserver((entries) => {
    active = entries[0]?.isIntersecting || false;
  }, { threshold: 0.08 }).observe(stage);

  const loop = (now) => {
    if (active && width) {
      ctx.fillStyle = ROUTES_BLACK;
      ctx.fillRect(0, 0, width, height);

      const cycleMs = 7600;
      const cycle = ((now - startedAt) % cycleMs) / cycleMs;
      let fieldWidth = width;
      let fieldHeight = height;

      if (cycle < 0.1) {
        fieldWidth = 0;
        fieldHeight = 0;
      } else if (cycle < 0.22) {
        fieldWidth = width * 0.68 * routesEase((cycle - 0.1) / 0.12);
        fieldHeight = 4;
      } else if (cycle < 0.42) {
        const progress = routesEase((cycle - 0.22) / 0.2);
        fieldWidth = width * (0.68 + 0.32 * progress);
        fieldHeight = 4 + (height - 4) * progress;
      } else if (cycle > 0.88) {
        const progress = routesEase((cycle - 0.88) / 0.12);
        fieldHeight = height + (4 - height) * progress;
      }

      drawRoutePlasma(
        ctx,
        (width - fieldWidth) / 2,
        (height - fieldHeight) / 2,
        fieldWidth,
        fieldHeight,
        now - startedAt
      );
    }
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

function initIndexStage() {
  const stage = document.querySelector('.brand-stage--index');
  const gridCells = Array.from(document.querySelectorAll('.index-grid i'));
  if (!stage || !gridCells.length) return;

  let step = 0;
  const render = () => {
    stage.dataset.step = String(step % 4);
    gridCells.forEach((cell, index) => cell.classList.toggle('active', index === (step * 5 + 2) % gridCells.length));
  };

  render();
  if (ROUTES_RM) return;

  let timer;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !timer) {
      timer = window.setInterval(() => {
        step += 1;
        render();
      }, 900);
    } else if (!entries[0]?.isIntersecting && timer) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }, { threshold: 0.08 });

  observer.observe(stage);
}

initFieldStage();
initIndexStage();
