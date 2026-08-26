/* Lab 02 · Areia GPU — o autômato de areia rodando em compute shader.

   Três decisões que separam esta versão da que roda na CPU:

   1. Ninguém dorme. Na CPU valia manter um bitmap de grãos acordados; na GPU,
      lançar uma thread por grão e deixá-la desistir em duas instruções sai mais
      barato que gerir estado.

   2. A ordem deixa de existir. Milhões de threads disputam as mesmas células,
      então todo movimento é uma RESERVA atômica (`atomicCompareExchangeWeak`).
      Quem chega primeiro leva. O preço é o determinismo.

   3. O buffer de cor guarda o ÍNDICE da paleta, não o RGB. O grão nasce com o
      índice do instante em que caiu — o tempo continua gravado nele —, mas o
      vertex shader soma a esse índice o relógio e a profundidade antes de ler a
      LUT. Três consequências, e é isso que faz a peça funcionar:

      · a paleta ROLA para sempre pelo volume, mesmo com a areia parada, então a
        animação nunca acaba;
      · cada camada Z lê a paleta deslocada, e o fundo deixa de ser igual à
        frente — o volume não é mais uma extrusão chapada do desenho;
      · e nada disso custa um passo de simulação.

   A matéria também circula: grão que assenta no fundo é reciclado para uma boca
   do topo. Mas a reciclagem só liga depois que a cavidade encheu — enquanto
   enche, ela competiria com a emissão pelas mesmas bocas e o logo nunca fechava.

   Posição empacotada em 32 bits (x:11 | y:10 | z:9 + bit de vida). */

const WG = 256;
export const EMPTY = 0xffffffff;
export const WALL = 0xfffffffe;
export const LUT_ROWS = 4;
export const LUT_SIZE = 1024;

const COMPUTE_SRC = /* wgsl */`
struct Params {
  dims: vec4<u32>,        // nx, ny, nz, maxGrains
  motion: vec4<f32>,      // fall, wind, talude, frame
  extra: vec4<f32>,       // windX, windZ, spawnCount, lutPos
  flow: vec4<f32>,        // zSpread, recycle, drainY, mouthCount
  depth: vec4<f32>,       // turbulência, frequência em Z, tempo, _
};

const EMPTY: u32 = 0xffffffffu;
const ALIVE: u32 = 0x80000000u;
const RESERVING: u32 = 0xfffffffdu;   // célula tomada, grão ainda sem índice

@group(0) @binding(0) var<storage, read_write> posBuf: array<u32>;
@group(0) @binding(1) var<storage, read_write> colBuf: array<u32>;
@group(0) @binding(2) var<storage, read_write> grid: array<atomic<u32>>;
@group(0) @binding(3) var<uniform> P: Params;
@group(0) @binding(4) var<storage, read_write> counter: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read> mouths: array<u32>;
@group(0) @binding(6) var<storage, read> lut: array<u32>;

/** Libera a célula que é minha. Duas armadilhas moram aqui:

    · um um atomicStore cego apagaria a marca de outro grão que reservou
      esta célula entre eu sair e limpar;
    · e atomicCompareExchangeWeak pode falhar ESPURIAMENTE — falhar com o valor
      certo na mão. Uma única falha dessas deixa a célula marcada para sempre com
      um grão que já foi embora: um fantasma que entope a coluna e, multiplicado
      por milhões de passos, trava o volume antes de encher.

    Por isso insistimos, e só desistimos se a célula já pertence a outro. */
/** Reserva a célula vazia. Insiste enquanto ela continuar vazia — desistir na
    primeira falha espúria custaria um movimento que era legítimo. */
fn claimCell(idx: u32, mine: u32) -> bool {
  for (var t = 0u; t < 4u; t = t + 1u) {     // teto: um spin sem fim numa GPU trava a tela
    let r = atomicCompareExchangeWeak(&grid[idx], EMPTY, mine);
    if (r.exchanged) { return true; }
    if (r.old_value != EMPTY) { return false; }
  }
  return false;
}

fn releaseCell(idx: u32, mine: u32) {
  for (var t = 0u; t < 4u; t = t + 1u) {
    let r = atomicCompareExchangeWeak(&grid[idx], mine, EMPTY);
    if (r.exchanged) { return; }
    if (r.old_value != mine) { return; }
  }
}

fn cellIndex(x: i32, y: i32, z: i32) -> u32 {
  return u32(x) + P.dims.x * (u32(y) + P.dims.y * u32(z));
}

fn pack(x: i32, y: i32, z: i32) -> u32 {
  return ALIVE | u32(x) | (u32(y) << 11u) | (u32(z) << 21u);
}

fn hash(v: u32) -> u32 {
  var x = v;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

/** O índice da paleta no instante em que o grão nasce, mais a linha de brilho.
    O RGB só é resolvido na hora de desenhar — assim a paleta pode rolar. */
fn stampAt(rng: u32) -> u32 {
  let idx = u32(fract(P.extra.w) * ${LUT_SIZE}.0) & ${LUT_SIZE - 1}u;
  return ((rng & 3u) << 16u) | idx;
}

/** Reserva a célula de destino. Só se move quem ganhar o compare-exchange.

    A origem é liberada com compare-exchange TAMBÉM, nunca com store: entre eu
    reservar o destino e limpar a origem, outro grão pode ter reservado a minha
    origem. Um store cego apagaria a marca dele — a célula ficaria livre no grid
    com um grão dentro, e a partir daí o grid mente. Era isso que criava grãos
    congelados entupindo as bocas e colunas que nunca fechavam. */
fn tryMove(i: u32, fx: i32, fy: i32, fz: i32, tx: i32, ty: i32, tz: i32) -> bool {
  if (tx < 0 || tz < 0 || ty < 0) { return false; }
  if (u32(tx) >= P.dims.x || u32(tz) >= P.dims.z) { return false; }
  let ti = cellIndex(tx, ty, tz);
  if (atomicLoad(&grid[ti]) != EMPTY) { return false; }
  if (!claimCell(ti, i)) { return false; }
  releaseCell(cellIndex(fx, fy, fz), i);
  return true;
}

/** Manda o grão de volta ao topo, por uma boca livre, com a cor de agora. */
fn recycle(i: u32, x: i32, y: i32, z: i32, rng: u32) -> bool {
  let m = u32(P.flow.w);
  if (m == 0u) { return false; }
  let b = mouths[rng % m];
  let bx = i32(b & 2047u);
  let by = i32((b >> 11u) & 1023u);
  let bz = i32((b >> 21u) & 511u);
  let ti = cellIndex(bx, by, bz);
  if (atomicLoad(&grid[ti]) != EMPTY) { return false; }
  if (!claimCell(ti, i)) { return false; }
  releaseCell(cellIndex(x, y, z), i);
  posBuf[i] = b | ALIVE;
  colBuf[i] = stampAt(hash(rng));
  return true;
}

@compute @workgroup_size(${WG})
fn stepSand(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.dims.w) { return; }
  let packed = posBuf[i];
  if ((packed & ALIVE) == 0u) { return; }

  var x = i32(packed & 2047u);
  var y = i32((packed >> 11u) & 1023u);
  var z = i32((packed >> 21u) & 511u);
  var rng = hash(i ^ hash(u32(P.motion.w)));
  let fall = i32(P.motion.x);
  let talude = P.motion.z;
  let windMag = abs(P.motion.y);
  let dx = i32(round(P.extra.x));
  let dz = i32(round(P.extra.y));
  var moved = 0;

  loop {
    if (moved >= fall || y == 0) { break; }

    if (tryMove(i, x, y, z, x, y - 1, z)) {
      y = y - 1;
      moved = moved + 1;
      if (windMag > 0.02 && (dx != 0 || dz != 0)) {     // o vento entorta a descida
        rng = hash(rng);
        if (f32(rng & 0xffffu) / 65535.0 < windMag * 0.55) {
          if (tryMove(i, x, y, z, x + dx, y, z + dz)) {
            x = x + dx;
            z = z + dz;
          }
        }
      }
      continue;
    }

    // cada camada de profundidade tem sua própria corrente lateral: sem isto o
    // volume desce igual em todo Z e vira uma extrusão do desenho
    let turb = P.depth.x;
    if (turb > 0.0) {
      let bias = sin(f32(z) * P.depth.y + P.depth.z) * turb;
      rng = hash(rng);
      if (f32(rng & 0xffffu) / 65535.0 < abs(bias)) {
        let sdir = select(-1, 1, bias > 0.0);
        if (tryMove(i, x, y, z, x + sdir, y, z)) {
          x = x + sdir;
          moved = moved + 1;
          continue;
        }
      }
    }

    if (talude > 0.0) {
      rng = hash(rng);
      if (f32(rng & 0xffffu) / 65535.0 < talude) { break; }
    }

    var slid = false;
    for (var t = 0u; t < 4u; t = t + 1u) {             // procura uma diagonal livre
      rng = hash(rng);
      let d = rng & 7u;
      let sx = select(select(0, 1, d == 0u || d == 1u || d == 7u), -1, d == 3u || d == 4u || d == 5u);
      let sz = select(select(0, 1, d == 1u || d == 2u || d == 3u), -1, d == 5u || d == 6u || d == 7u);
      if (sx == 0 && sz == 0) { continue; }
      if (tryMove(i, x, y, z, x + sx, y - 1, z + sz)) {
        x = x + sx;
        z = z + sz;
        y = y - 1;
        moved = moved + 1;
        slid = true;
        break;
      }
    }
    if (!slid) { break; }
  }

  if (moved > 0) {
    posBuf[i] = pack(x, y, z);
    return;
  }
  // parado no fundo: volta para o topo e o movimento nunca acaba
  if (P.flow.y > 0.0 && f32(y) <= P.flow.z) {
    rng = hash(rng);
    if (f32(rng & 0xffffu) / 65535.0 < P.flow.y) {
      recycle(i, x, y, z, hash(rng));
    }
  }
}

/** Semeadura. Duas escolhas importam aqui:

    · cada thread pega a boca (k + deslocamento) — bocas DISTINTAS, não sorteadas.
      Sorteando, várias threads caem na mesma boca e só uma entra; as outras já
      teriam consumido um slot.
    · o slot alocado nunca é devolvido. Um atomicSub num contador compartilhado
      não desfaz nada: outra thread já pegou um índice maior, e o índice devolvido
      volta a ser entregue a um segundo grão. O primeiro fica órfão com a célula
      marcada no grid — a boca entope com um grão que não existe, e o trecho
      inteiro para de receber areia. Era isso que segurava o volume em 58%. */
@compute @workgroup_size(${WG})
fn emitSand(@builtin(global_invocation_id) gid: vec3<u32>) {
  let k = gid.x;
  if (k >= u32(P.extra.z)) { return; }
  let m = u32(P.flow.w);
  if (m == 0u) { return; }
  var rng = hash(k ^ hash(u32(P.motion.w) * 2654435761u));
  let b = mouths[(k + hash(u32(P.motion.w))) % m];
  let x = i32(b & 2047u);
  let y = i32((b >> 11u) & 1023u);
  let z = i32((b >> 21u) & 511u);
  let ti = cellIndex(x, y, z);
  if (atomicLoad(&grid[ti]) != EMPTY) { return; }

  // a CÉLULA vem primeiro, o slot depois: assim quem perde a disputa não gasta
  // índice nenhum. Alocar antes e desistir depois queimava milhões de slots.
  if (!claimCell(ti, RESERVING)) { return; }
  let slot = atomicAdd(&counter[0], 1u);
  if (slot >= P.dims.w) {
    atomicStore(&grid[ti], EMPTY);         // seguro: a célula é minha, ninguém mais a viu vazia
    return;
  }
  atomicStore(&grid[ti], slot);
  posBuf[slot] = b | ALIVE;
  colBuf[slot] = stampAt(hash(rng));
}
`;

const RENDER_SRC = /* wgsl */`
struct Camera {
  viewProj: mat4x4<f32>,
  center: vec4<f32>,      // xyz = centro do volume, w = plano de corte em Z
  anim: vec4<f32>,        // rolagem da paleta, deslocamento por camada Z, _, _
};

const ALIVE: u32 = 0x80000000u;

@group(0) @binding(0) var<uniform> C: Camera;
@group(0) @binding(1) var<storage, read> posBuf: array<u32>;
@group(0) @binding(2) var<storage, read> colBuf: array<u32>;
@group(0) @binding(3) var<storage, read> lut: array<u32>;

struct VSOut {
  @builtin(position) clip: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
  var out: VSOut;
  let packed = posBuf[vi];
  let z = f32((packed >> 21u) & 511u);
  if ((packed & ALIVE) == 0u || z > C.center.w) {
    out.clip = vec4<f32>(2.0, 2.0, 2.0, 1.0);
    out.color = vec4<f32>(0.0);
    return out;
  }
  let x = f32(packed & 2047u);
  let y = f32((packed >> 11u) & 1023u);
  out.clip = C.viewProj * vec4<f32>(x - C.center.x, y - C.center.y, z - C.center.z, 1.0);
  // o grão guarda o índice de quando caiu; aqui somamos o relógio e a camada
  let stamp = colBuf[vi];
  let base = f32(stamp & 1023u) / 1024.0;
  let t = base + C.anim.x + z * C.anim.y;
  let idx = u32(fract(t) * 1024.0) & 1023u;
  out.color = unpack4x8unorm(lut[(((stamp >> 16u) & 3u) << 10u) | idx]);
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4<f32> {
  return vec4<f32>(in.color.rgb, 1.0);
}
`;

export class SandGPU {
  constructor(device, canvas, format, dims, maxGrains, mouthCount) {
    this.device = device;
    this.canvas = canvas;
    this.dims = dims;
    this.max = maxGrains;
    this.mouthCount = mouthCount;
    this.count = 0;        // grãos vivos (lido da GPU, para exibição)
    this.slots = 0;        // slots já alocados — só cresce, e é ele que dimensiona o passo
    this.frame = 0;
    this.cut = dims.nz;
    this.build(format);
  }

  static async create(canvas, dims, maxGrains, mouths, lut) {
    if (!navigator.gpu) throw new Error('WebGPU indisponível neste navegador');
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('nenhum adaptador WebGPU');
    const cells = dims.nx * dims.ny * dims.nz;
    const need = Math.max(cells * 4, maxGrains * 4);
    const lim = adapter.limits;
    if (need > lim.maxStorageBufferBindingSize || need > lim.maxBufferSize) {
      throw new Error(`grade grande demais: ${(need / 1048576) | 0} MB por buffer, `
        + `limite de ${(Math.min(lim.maxStorageBufferBindingSize, lim.maxBufferSize) / 1048576) | 0} MB`);
    }
    const device = await adapter.requestDevice({
      requiredLimits: {
        maxStorageBufferBindingSize: Math.min(need * 2, lim.maxStorageBufferBindingSize),
        maxBufferSize: Math.min(need * 2, lim.maxBufferSize),
      },
    });
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });
    const sim = new SandGPU(device, canvas, format, dims, maxGrains, mouths.length);
    sim.context = context;
    sim.adapterInfo = { ...(adapter.info ?? {}), maxBufferMB: (lim.maxBufferSize / 1048576) | 0 };
    device.queue.writeBuffer(sim.mouthBuf, 0, mouths);
    sim.uploadLut(lut);
    return sim;
  }

  build(format) {
    const { device, dims, max } = this;
    const cells = dims.nx * dims.ny * dims.nz;
    const S = GPUBufferUsage.STORAGE;
    const mk = (size, usage) => device.createBuffer({ size, usage });

    this.posBuf = mk(max * 4, S | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.colBuf = mk(max * 4, S | GPUBufferUsage.COPY_DST);
    this.gridBuf = mk(cells * 4, S | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.counterBuf = mk(16, S | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
    this.readBuf = mk(16, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
    this.mouthBuf = mk(Math.max(4, this.mouthCount * 4), S | GPUBufferUsage.COPY_DST);
    this.lutBuf = mk(LUT_ROWS * LUT_SIZE * 4, S | GPUBufferUsage.COPY_DST);
    this.paramBuf = device.createBuffer({
      size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.camBuf = device.createBuffer({
      size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.computeModule = device.createShaderModule({ code: COMPUTE_SRC, label: 'areia-compute' });
    const cLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      ],
    });
    const computeLayout = device.createPipelineLayout({ bindGroupLayouts: [cLayout] });
    this.stepPipe = device.createComputePipeline({
      layout: computeLayout, compute: { module: this.computeModule, entryPoint: 'stepSand' },
    });
    this.emitPipe = device.createComputePipeline({
      layout: computeLayout, compute: { module: this.computeModule, entryPoint: 'emitSand' },
    });
    this.computeBind = device.createBindGroup({
      layout: cLayout,
      entries: [
        { binding: 0, resource: { buffer: this.posBuf } },
        { binding: 1, resource: { buffer: this.colBuf } },
        { binding: 2, resource: { buffer: this.gridBuf } },
        { binding: 3, resource: { buffer: this.paramBuf } },
        { binding: 4, resource: { buffer: this.counterBuf } },
        { binding: 5, resource: { buffer: this.mouthBuf } },
        { binding: 6, resource: { buffer: this.lutBuf } },
      ],
    });

    // render tem bindings próprios: o vertex não aceita storage read_write
    this.renderModule = device.createShaderModule({ code: RENDER_SRC, label: 'areia-render' });
    const rLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 3, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
      ],
    });
    this.drawPipe = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [rLayout] }),
      vertex: { module: this.renderModule, entryPoint: 'vs' },
      fragment: { module: this.renderModule, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'point-list' },
      depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
    });
    this.renderBind = device.createBindGroup({
      layout: rLayout,
      entries: [
        { binding: 0, resource: { buffer: this.camBuf } },
        { binding: 1, resource: { buffer: this.posBuf } },
        { binding: 2, resource: { buffer: this.colBuf } },
        { binding: 3, resource: { buffer: this.lutBuf } },
      ],
    });

    this.params = new ArrayBuffer(80);
    this.paramU32 = new Uint32Array(this.params, 0, 4);
    this.paramF32 = new Float32Array(this.params, 16, 16);
    this.camData = new Float32Array(24);
    this.anim = { roll: 0, zSpread: 0 };
  }

  uploadLut(lut) {
    this.device.queue.writeBuffer(this.lutBuf, 0, lut);
  }

  uploadWalls(gridData) {
    this.device.queue.writeBuffer(this.gridBuf, 0, gridData);
    this.walls = gridData;
    this.reset();
  }

  reset() {
    this.device.queue.writeBuffer(this.counterBuf, 0, new Uint32Array([0, 0, 0, 0]));
    if (this.walls) this.device.queue.writeBuffer(this.gridBuf, 0, this.walls);
    this.count = 0;
    this.slots = 0;
    this.frame = 0;
    const zeros = new Uint32Array(Math.min(this.max, 1 << 20));
    for (let off = 0; off < this.max; off += zeros.length) {
      const n = Math.min(zeros.length, this.max - off);
      this.device.queue.writeBuffer(this.posBuf, off * 4, zeros, 0, n);
    }
  }

  writeParams(p, spawnCount) {
    const u = this.paramU32;
    const f = this.paramF32;
    u[0] = this.dims.nx;
    u[1] = this.dims.ny;
    u[2] = this.dims.nz;
    u[3] = this.max;
    f[0] = p.fall;
    f[1] = p.wind;
    f[2] = p.talude;
    f[3] = this.frame;
    f[4] = p.windX * Math.sign(p.wind || 1);
    f[5] = p.windZ * Math.sign(p.wind || 1);
    f[6] = spawnCount;
    f[7] = p.lutPos;
    f[8] = p.zSpread;
    f[9] = p.recycle;
    f[10] = p.drainY;
    f[11] = this.mouthCount;
    f[12] = p.turbulencia;
    f[13] = p.zFreq;
    f[14] = p.tempo;
    this.device.queue.writeBuffer(this.paramBuf, 0, this.params);
  }

  /** Um passo: semeia (se pedido) e roda o autômato. */
  step(phys, spawnCount = 0) {
    const { device } = this;
    this.writeParams(phys, spawnCount);
    const enc = device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setBindGroup(0, this.computeBind);
    if (spawnCount > 0) {
      pass.setPipeline(this.emitPipe);
      pass.dispatchWorkgroups(Math.ceil(spawnCount / WG));
      // estimativa otimista: cobrir slots a mais é inofensivo, cobrir a menos
      // CONGELA os grãos de índice alto — e eles entopem as bocas de entrada
      this.slots = Math.min(this.max, this.slots + spawnCount);
    }
    pass.setPipeline(this.stepPipe);
    pass.dispatchWorkgroups(Math.ceil((this.slots || 1) / WG));
    pass.end();
    device.queue.submit([enc.finish()]);
    this.frame++;
  }

  ensureDepth(w, h) {
    if (this.depth && this.depthSize[0] === w && this.depthSize[1] === h) return;
    this.depth?.destroy();
    this.depth = this.device.createTexture({
      size: [w, h], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthSize = [w, h];
  }

  render(viewProj, center, clear = [0.039, 0.035, 0.031, 1]) {
    const { device, canvas } = this;
    this.ensureDepth(canvas.width, canvas.height);
    this.camData.set(viewProj, 0);
    this.camData.set([center.x, center.y, center.z, this.cut], 16);
    this.camData.set([this.anim.roll, this.anim.zSpread, 0, 0], 20);
    device.queue.writeBuffer(this.camBuf, 0, this.camData);

    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: clear[0], g: clear[1], b: clear[2], a: clear[3] },
        loadOp: 'clear', storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depth.createView(),
        depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store',
      },
    });
    pass.setPipeline(this.drawPipe);
    pass.setBindGroup(0, this.renderBind);
    pass.draw(this.count || 1);
    pass.end();
    device.queue.submit([enc.finish()]);
  }

  async readCount() {
    if (this.reading) return this.count;
    this.reading = true;
    try {
      const enc = this.device.createCommandEncoder();
      enc.copyBufferToBuffer(this.counterBuf, 0, this.readBuf, 0, 4);
      this.device.queue.submit([enc.finish()]);
      await this.readBuf.mapAsync(GPUMapMode.READ);
      const real = new Uint32Array(this.readBuf.getMappedRange().slice(0))[0];
      this.readBuf.unmap();
      this.count = Math.min(real, this.max);
      // a leitura chega atrasada: nunca deixar o passo encolher por causa dela
      this.slots = Math.min(this.max, Math.max(this.slots, this.count));
    } finally {
      this.reading = false;
    }
    return this.count;
  }
}

export { WG };
