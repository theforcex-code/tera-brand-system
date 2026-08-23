/* Lab 02 · Areia 3D — autômato de areia volumétrico (1 célula = 1 grão de 1 px).

   O mesmo princípio da versão 2D, agora em três eixos: o grão cai em Y e, quando
   encontra chão, escorrega para uma das oito direções do plano XZ. O que se
   deposita nunca mais se move — é isso que transforma a pilha em ROCHA: cada
   camada guarda a cor do instante em que caiu, e o corte revela o tempo gravado.

   O grid é indexado com Y CONTÍGUO (idx = y + ny*(x + nx*z)): a operação mais
   frequente é descer uma célula, e assim ela anda 1 byte na memória em vez de
   pular um plano inteiro — 6,9 MB de grid não cabem em cache, e o layout ingênuo
   transformava cada queda num cache miss (16,5 ms por passo contra 3,3 ms).

   Dois buffers, dois destinos de render:
   - grãos EM VOO ficam em arrays SoA (x, y, z, cor) e viram Points;
   - grãos ASSENTADOS são escritos uma única vez em `positions`/`colors`, que
     alimentam um InstancedMesh por faixa (só o trecho novo sobe para a GPU). */

const LCG_A = 1664525;
const LCG_C = 1013904223;
const P16 = 65536;
const WIND_DRIFT = 0.5;         // quanto o vento entorta a queda livre
const SLIDE_TRIES = 3;          // direções testadas antes de o grão assentar

// 8 vizinhos do plano XZ, em ordem circular — o viés de vento escolhe onde começar
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export class SandVolume {
  constructor(nx, ny, nz, maxSettled, maxFlying = 120000) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.strideX = ny;            // idx = y + ny*(x + nx*z): Y contíguo, queda = idx - 1
    this.strideZ = nx * ny;
    this.grid = new Uint8Array(nx * ny * nz);

    // grãos em voo (SoA)
    this.fx = new Int16Array(maxFlying);
    this.fy = new Int16Array(maxFlying);
    this.fz = new Int16Array(maxFlying);
    this.fr = new Float32Array(maxFlying);
    this.fg = new Float32Array(maxFlying);
    this.fb = new Float32Array(maxFlying);
    this.flying = 0;
    this.maxFlying = maxFlying;

    // grãos assentados (escritos uma vez; a GPU só recebe o trecho novo)
    this.positions = new Float32Array(maxSettled * 3);
    this.colors = new Float32Array(maxSettled * 3);
    this.settled = 0;
    this.maxSettled = maxSettled;
    this.full = false;            // teto da rocha atingido
    this.dirtyFrom = 0;           // faixa ainda não enviada à GPU

    this.top = 0;                 // altura da pilha mais alta (células)
    this.capacity = nx * ny * nz; // células abertas dentro da cavidade
    this.seed = 0x9e3779b9 | 0;
  }

  reseed(n) {
    this.seed = (Math.imul(n | 0, 2654435761) ^ 0x9e3779b9) | 0;
  }

  /** Paredes da cavidade: célula fora do desenho vira 2 e bloqueia como rocha.
      O logo fica em pé no plano XY e é extrudado em Z, então `openAt(x, y)`
      responde pelo perfil e a espessura inteira herda a resposta. */
  setWalls(openAt) {
    const { nx, ny, nz, grid, strideZ } = this;
    let open = 0;
    for (let x = 0; x < nx; x++) {
      for (let y = 0; y < ny; y++) {
        const v = openAt(x, y) ? 0 : 2;
        if (v === 0) open += nz;
        const base = this.index(x, y, 0);
        for (let z = 0; z < nz; z++) grid[base + z * strideZ] = v;
      }
    }
    this.capacity = open;
  }

  clear() {
    const g = this.grid;
    for (let i = 0; i < g.length; i++) if (g[i] === 1) g[i] = 0;   // paredes ficam
    this.flying = 0;
    this.settled = 0;
    this.full = false;
    this.dirtyFrom = 0;
    this.top = 0;
  }

  index(x, y, z) {
    return y + this.ny * (x + this.nx * z);
  }

  inside(x, y, z) {
    return x >= 0 && x < this.nx && y >= 0 && y < this.ny && z >= 0 && z < this.nz;
  }

  /** Lança um grão do plano de cima. Cor em 0..1 (já convertida da paleta). */
  emit(x, y, z, r, g, b) {
    if (this.flying >= this.maxFlying) return false;
    if (this.settled + this.flying >= this.maxSettled) return false;   // já há material no ar
    if (!this.inside(x, y, z) || this.grid[this.index(x, y, z)] !== 0) return false;
    const i = this.flying++;
    this.fx[i] = x;
    this.fy[i] = y;
    this.fz[i] = z;
    this.fr[i] = r;
    this.fg[i] = g;
    this.fb[i] = b;
    return true;
  }

  /** Fixa o grão `i` no lugar: vira rocha e sai da lista de voo.
      No teto do buffer o grão apenas some — passar de `maxSettled` invalidaria o
      draw call inteiro do InstancedMesh e a rocha desapareceria da tela. */
  settle(i) {
    if (this.settled >= this.maxSettled) {
      this.full = true;
      this.swapRemove(i);
      return;
    }
    const x = this.fx[i];
    const y = this.fy[i];
    const z = this.fz[i];
    this.grid[this.index(x, y, z)] = 1;
    const s = this.settled++;
    const p = s * 3;
    this.positions[p] = x;
    this.positions[p + 1] = y;
    this.positions[p + 2] = z;
    this.colors[p] = this.fr[i];
    this.colors[p + 1] = this.fg[i];
    this.colors[p + 2] = this.fb[i];
    if (y > this.top) this.top = y;
    this.swapRemove(i);
  }

  /** Remove o grão em voo `i` trocando com o último (ordem não importa). */
  swapRemove(i) {
    const last = --this.flying;
    if (i === last) return;
    this.fx[i] = this.fx[last];
    this.fy[i] = this.fy[last];
    this.fz[i] = this.fz[last];
    this.fr[i] = this.fr[last];
    this.fg[i] = this.fg[last];
    this.fb[i] = this.fb[last];
  }

  /** Um passo: todo grão em voo cai até `fall` células, escorrega ou assenta. */
  step({ fall = 4, wind = 0, windX = 1, windZ = 0, talude = 0 }) {
    const { grid, nx, nz, strideX, strideZ } = this;
    const drift = (Math.abs(wind) * WIND_DRIFT * P16) | 0;
    const stick = (talude * P16) | 0;
    const bias = this.dirBias(wind, windX, windZ);
    const wx = wind >= 0 ? Math.round(windX) : -Math.round(windX);
    const wz = wind >= 0 ? Math.round(windZ) : -Math.round(windZ);
    let seed = this.seed;

    for (let i = this.flying - 1; i >= 0; i--) {
      let x = this.fx[i];
      let y = this.fy[i];
      let z = this.fz[i];
      let idx = this.index(x, y, z);
      let moved = 0;

      while (moved < fall) {
        if (y === 0) break;                                  // chegou ao plano de baixo
        const below = idx - 1;
        if (grid[below] === 0) {
          // queda livre: o vento pode arrastar o grão de lado enquanto desce
          seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
          if (drift !== 0 && ((seed >>> 8) & 0xffff) < drift) {
            const dx = x + wx;
            const dz = z + wz;
            if (dx >= 0 && dx < nx && dz >= 0 && dz < nz) {
              const drifted = below + wx * strideX + wz * strideZ;
              if (grid[drifted] === 0) {
                x = dx; z = dz; y--; idx = drifted; moved++;
                continue;
              }
            }
          }
          y--; idx = below; moved++;
          continue;
        }

        if (stick !== 0) {                                   // talude: pode travar aqui
          seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
          if (((seed >>> 8) & 0xffff) < stick) break;
        }

        // bloqueado: procura uma diagonal livre em volta, começando pelo vento
        seed = (Math.imul(seed, LCG_A) + LCG_C) | 0;
        const start = bias >= 0 && ((seed >>> 20) & 3) !== 0 ? bias : (seed >>> 8) & 7;
        let slid = false;
        for (let t = 0; t < SLIDE_TRIES; t++) {
          const d = DIRS[(start + (t & 1 ? t : -t) + 8) & 7];
          const dx = x + d[0];
          const dz = z + d[1];
          if (dx < 0 || dx >= nx || dz < 0 || dz >= nz) continue;
          const side = idx + d[0] * strideX + d[1] * strideZ;
          const diag = side - 1;
          if (grid[side] !== 0 || grid[diag] !== 0) continue;
          x = dx; z = dz; y--; idx = diag; moved++;
          slid = true;
          break;
        }
        if (!slid) break;
      }

      this.fx[i] = x;
      this.fy[i] = y;
      this.fz[i] = z;
      if (moved === 0) this.settle(i);                       // não saiu do lugar: virou rocha
    }

    this.seed = seed;
    return this.flying;
  }

  /** Direção de DIRS mais próxima do vento, ou -1 quando não há vento. */
  dirBias(wind, windX, windZ) {
    if (Math.abs(wind) < 0.02) return -1;
    const sx = wind >= 0 ? windX : -windX;
    const sz = wind >= 0 ? windZ : -windZ;
    const ang = Math.atan2(sz, sx);
    return ((Math.round((ang / (Math.PI * 2)) * 8) % 8) + 8) % 8;
  }

  /** Faixa de grãos assentados ainda não enviada à GPU; zera o marcador. */
  takeDirty() {
    const from = this.dirtyFrom;
    this.dirtyFrom = this.settled;
    return { from, count: this.settled - from };
  }
}
