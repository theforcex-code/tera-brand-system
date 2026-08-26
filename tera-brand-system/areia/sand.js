/* Lab 02 · Areia — motor de areia (autômato celular, 1 célula = 1 pixel).
   Regra base (a mesma do This is Sand): cada grão tenta cair reto; se está
   bloqueado, escorrega para uma diagonal de baixo — daí o talude das dunas.
   Cada passo move um grão até `fall` células (queda rápida com poucos passos/s).

   A física é aberta: `step(phys)` recebe vento, talude, dispersão e erosão por
   passo, então os controles do painel entram direto na regra, sem pós-efeito.

   A grade de pixels do ImageData É o estado: célula aberta vazia = `emptyPix`,
   parede = `wallPix`, qualquer outro valor em célula aberta é um grão com sua cor.
   Um bitmap (1 bit por célula) marca os grãos ACORDADOS: só eles são visitados.
   Um grão que não consegue se mover dorme; quem esvazia uma célula acorda os três
   vizinhos de cima. Custo por passo ∝ grãos em movimento, não ao tamanho da tela. */

import { LUT_SHIFT } from './palette.js?v=24';

const LCG_A = 1664525;
const LCG_C = 1013904223;
const P16 = 65536;              // as probabilidades vivem em 0..65535
const WIND_DRIFT = 0.55;        // quanto o vento entorta a queda livre
const EROSION_STRIDE = 4;       // 1/4 das linhas por passo — erodir custa o dobro de acordar
const EROSION_GAIN = 0.09;      // chance máxima de um grão exposto ser arrancado
const EROSION_MIN_WIND = 0.05;  // abaixo disso o vento não arranca nada
const RAIN_TRIES = 4;           // sorteios por grão pedido quando os topos enchem

const DEFAULT_PHYS = { fall: 4, wind: 0, talude: 0, spread: 1, erosion: 0 };

export class SandField {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.img = new ImageData(width, height);
    this.pix = new Uint32Array(this.img.data.buffer);
    this.solid = new Uint8Array(width * height);
    this.wpr = (width + 31) >> 5;                 // palavras de 32 bits por linha
    this.awake = new Uint32Array(this.wpr * height);
    this.region = { x0: 0, y0: 0, x1: width, y1: height };
    this.emptyPix = 0;
    this.wallPix = 0;
    this.count = 0;
    this.capacity = width * height;
    this.topY = height;                           // linha mais alta que já recebeu grão
    this.tick = 0;
    this.seed = 0x9e3779b9 | 0;
  }

  /** Define paredes, região varrida e aparência das células vazias. Limpa a areia. */
  configure({ solid, region, emptyPix, wallPix }) {
    this.solid = solid;
    this.region = region;
    this.emptyPix = emptyPix >>> 0;
    this.wallPix = wallPix >>> 0;
    let open = 0;
    for (let y = region.y0; y < region.y1; y++) {
      const row = y * this.w;
      for (let x = region.x0; x < region.x1; x++) if (solid[row + x] === 0) open++;
    }
    this.capacity = open;
    this.clear();
  }

  /** Semente do gerador — mesma semente + mesmos parâmetros = mesma cena. */
  reseed(n) {
    this.seed = (Math.imul(n | 0, 2654435761) ^ 0x9e3779b9) | 0;
    this.tick = 0;
  }

  clear() {
    const { pix, solid, emptyPix, wallPix } = this;
    for (let i = 0; i < pix.length; i++) pix[i] = solid[i] !== 0 ? wallPix : emptyPix;
    this.count = 0;
    this.topY = this.region.y1;
    this.awake.fill(0);
  }

  isOpen(x, y) {
    const { x0, y0, x1, y1 } = this.region;
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
    return this.solid[y * this.w + x] === 0;
  }

  /** Célula aberta mais próxima de (x, y) num raio r, ou null. */
  nearestOpen(x, y, r) {
    const { x0, y0, x1, y1 } = this.region;
    const yA = Math.max(y0, y - r);
    const yB = Math.min(y1, y + r + 1);
    const xA = Math.max(x0, x - r);
    const xB = Math.min(x1, x + r + 1);
    let best = null;
    let bestD = r * r + 1;
    for (let yy = yA; yy < yB; yy++) {
      const row = yy * this.w;
      const dy2 = (yy - y) * (yy - y);
      for (let xx = xA; xx < xB; xx++) {
        const d = (xx - x) * (xx - x) + dy2;
        if (d >= bestD || this.solid[row + xx] !== 0) continue;
        bestD = d;
        best = { x: xx, y: yy };
      }
    }
    return best;
  }

  /** Coloca um grão em (x, y) se a célula está aberta e vazia. */
  spawn(x, y, color) {
    const { x0, y0, x1, y1 } = this.region;
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false;
    const i = y * this.w + x;
    if (this.solid[i] !== 0 || this.pix[i] !== this.emptyPix) return false;
    this.pix[i] = color;
    this.awake[y * this.wpr + (x >> 5)] |= 1 << (x & 31);
    if (y < this.topY) this.topY = y;
    this.count++;
    return true;
  }

  /** Jato: disco de raio r preenchido com probabilidade `density`.
      A cor vem da LUT (linha de brilho aleatória → textura de grão). */
  spawnDisc(cx, cy, r, density, lut, lutIdx) {
    const r2 = r * r;
    const ri = Math.ceil(r);
    const threshold = (density * P16) | 0;
    let seed = this.seed;
    let n = 0;
    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
        if (((seed >>> 8) & 0xffff) >= threshold) continue;
        const color = lut[(((seed >>> 24) & 3) << LUT_SHIFT) | lutIdx];
        if (this.spawn(cx + dx, cy + dy, color)) n++;
      }
    }
    this.seed = seed;
    return n;
  }

  /** Chuva: k grãos em fontes sorteadas (pares [x, y] planos).
      Sorteia até RAIN_TRIES vezes o necessário — perto do fim quase todo topo
      já está ocupado, e sem isso a taxa pedida nunca é alcançada. */
  rain(sources, k, lut, lutIdx) {
    const m = sources.length >> 1;
    if (m === 0) return 0;
    const limit = Math.min(k * RAIN_TRIES, m * RAIN_TRIES);
    let seed = this.seed;
    let n = 0;
    for (let t = 0; t < limit && n < k; t++) {
      seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
      const s = ((seed >>> 8) % m) << 1;
      const color = lut[(((seed >>> 24) & 3) << LUT_SHIFT) | lutIdx];
      if (this.spawn(sources[s], sources[s + 1], color)) n++;
    }
    this.seed = seed;
    return n;
  }

  /** Um passo: queda de todos os grãos acordados, mais a erosão pelo vento.
      Retorna quantos grãos se moveram. */
  step(phys = DEFAULT_PHYS) {
    const moved = this.stepFall(phys);
    const wind = phys.wind ?? 0;
    if ((phys.erosion ?? 0) > 0 && Math.abs(wind) > EROSION_MIN_WIND) {
      this.stepErode(wind, phys.erosion);
    }
    this.tick++;
    return moved;
  }

  /** Varre os grãos acordados de baixo para cima (quem cai não é revisitado no
      mesmo passo), alternando o sentido horizontal para não enviesar as dunas. */
  stepFall({ fall, wind = 0, talude = 0, spread = 1 }) {
    const { w, wpr, pix, solid, awake, emptyPix } = this;
    const { x0, y0, x1, y1 } = this.region;
    const ltr = (this.tick & 1) === 0;
    const yLast = y1 - 1;
    const wordLo = x0 >> 5;
    const wordHi = (x1 - 1) >> 5;
    const windDir = wind < 0 ? -1 : 1;
    const driftP = (Math.abs(wind) * WIND_DRIFT * P16) | 0;   // entorta a queda livre
    const sideP = ((0.5 + 0.5 * Math.abs(wind)) * P16) | 0;   // lado preferido do talude
    const stickP = (talude * P16) | 0;                        // chance de travar
    let seed = this.seed;
    let moved = 0;

    for (let y = y1 - 2; y >= y0; y--) {
      const rowW = y * wpr;
      const row = y * w;
      for (let k = 0; k <= wordHi - wordLo; k++) {
        const wi = ltr ? wordLo + k : wordHi - k;
        let word = awake[rowW + wi] | 0;
        while (word !== 0) {
          const t = ltr ? word & -word : 1 << (31 - Math.clz32(word));
          word ^= t;
          const bit = 31 - Math.clz32(t);
          const x = (wi << 5) + bit;
          const i = row + x;
          const c = pix[i];
          if (c === emptyPix || solid[i] !== 0) {   // bit órfão: limpa e segue
            awake[rowW + wi] &= ~(1 << bit);
            continue;
          }

          let cx = x;
          let cy = y;
          let j = i;
          let n = 0;
          while (n < fall && cy < yLast) {
            const b = j + w;
            if (solid[b] === 0 && pix[b] === emptyPix) {
              // queda livre: o vento pode puxar a descida para o seu lado
              if (driftP !== 0) {
                seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
                const xd = cx + windDir;
                if (((seed >>> 8) & 0xffff) < driftP && xd >= x0 && xd < x1
                    && solid[b + windDir] === 0 && pix[b + windDir] === emptyPix
                    && solid[j + windDir] === 0) {
                  j = b + windDir; cx = xd; cy++; n++;
                  continue;
                }
              }
              j = b; cy++; n++;
              continue;
            }
            if (stickP !== 0) {                     // talude: o grão pode travar
              seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
              if (((seed >>> 8) & 0xffff) < stickP) break;
            }
            seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
            const first = ((seed >>> 8) & 0xffff) < sideP ? windDir : -windDir;
            const slid = this.slide(j, cx, b, first, spread) ?? this.slide(j, cx, b, -first, spread);
            if (slid === null || slid === undefined) break;
            const jump = slid - cx;
            if (jump > 1 || jump < -1) {           // rastro do salto: nada pode ficar preso
              const dir = jump > 0 ? 1 : -1;
              for (let k2 = 1; k2 < Math.abs(jump); k2++) this.wakeAbove(j + dir * k2, cx + dir * k2, cy * this.wpr);
            }
            j = b + jump; cx = slid; cy++; n++;
          }

          awake[rowW + wi] &= ~(1 << bit);
          if (n === 0) continue;                    // travado: dorme

          pix[j] = c;
          pix[i] = emptyPix;
          awake[cy * wpr + (cx >> 5)] |= 1 << (cx & 31);
          moved++;
          if (y > y0) this.wakeAbove(i, x, rowW);
        }
      }
    }

    this.seed = seed;
    return moved;
  }

  /** Escorrega de `cx` até `spread` células para o lado `dir`, sem atravessar
      parede: exige o caminho livre na linha atual e a célula de baixo vazia.
      Devolve o novo x, ou null. */
  slide(j, cx, b, dir, spread) {
    const { pix, solid, emptyPix } = this;
    const { x0, x1 } = this.region;
    for (let d = spread; d >= 1; d--) {
      const nx = cx + dir * d;
      if (nx < x0 || nx >= x1) continue;
      let blocked = false;
      for (let k = 1; k <= d; k++) {                // caminho lateral livre?
        const side = j + dir * k;
        if (solid[side] !== 0 || pix[side] !== emptyPix) { blocked = true; break; }
      }
      if (blocked) continue;
      const dest = b + dir * d;
      if (solid[dest] === 0 && pix[dest] === emptyPix) return nx;
    }
    return null;
  }

  /** A célula (x, y) esvaziou: acorda os três grãos que se apoiavam nela. */
  wakeAbove(i, x, rowW) {
    const { w, wpr, pix, solid, awake, emptyPix } = this;
    const { x0, x1 } = this.region;
    const above = i - w;
    const rowAbove = rowW - wpr;
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      if (xx < x0 || xx >= x1) continue;
      const a = above + dx;
      if (solid[a] === 0 && pix[a] !== emptyPix) {
        awake[rowAbove + (xx >> 5)] |= 1 << (xx & 31);
      }
    }
  }

  /** Erosão: o vento arranca grãos expostos da superfície e a duna migra.
      Amostra 1/EROSION_STRIDE das linhas por passo — é a parte cara da física. */
  stepErode(wind, erosion) {
    const { w, wpr, pix, solid, awake, emptyPix } = this;
    const { x0, y0, x1, y1 } = this.region;
    const dir = wind < 0 ? -1 : 1;
    const p = (Math.min(1, erosion * Math.abs(wind)) * EROSION_GAIN * P16) | 0;
    let seed = this.seed;

    const yTop = Math.max(y0, this.topY);         // acima disso não há o que erodir
    for (let y = yTop + (this.tick % EROSION_STRIDE); y < y1; y += EROSION_STRIDE) {
      const row = y * w;
      const up = row - w;
      for (let x = x0; x < x1; x++) {
        const i = row + x;
        if (solid[i] !== 0 || pix[i] === emptyPix) continue;
        if (y > y0 && (solid[up + x] !== 0 || pix[up + x] !== emptyPix)) continue;  // soterrado
        seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
        if (((seed >>> 8) & 0xffff) >= p) continue;
        const nx = x + dir;
        if (nx < x0 || nx >= x1) continue;
        // saltação: vai para o lado, ou sobe um degrau se houver parede à frente
        let dest = i + dir;
        let dy = 0;
        if (solid[dest] !== 0 || pix[dest] !== emptyPix) {
          if (y === y0) continue;
          dest = up + nx;
          dy = -1;
          if (solid[dest] !== 0 || pix[dest] !== emptyPix) continue;
        }
        pix[dest] = pix[i];
        pix[i] = emptyPix;
        if (y + dy < this.topY) this.topY = y + dy;
        awake[(y + dy) * wpr + (nx >> 5)] |= 1 << (nx & 31);
        if (y > y0) this.wakeAbove(i, x, y * wpr);
      }
    }

    this.seed = seed;
  }

  /** Copia o buffer para o canvas (só a região varrida, salvo `full`). */
  draw(ctx, full = false) {
    if (full) {
      ctx.putImageData(this.img, 0, 0);
      return;
    }
    const { x0, y0, x1, y1 } = this.region;
    ctx.putImageData(this.img, 0, 0, x0, y0, x1 - x0, y1 - y0);
  }
}
