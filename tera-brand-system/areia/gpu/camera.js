/* Lab 02 · Areia GPU — câmera em órbita, sem dependência de biblioteca.

   A versão WebGL usava OrbitControls do Three; aqui não há Three, então a
   matemática mora neste arquivo: perspectiva, look-at e o arrasto que gira o
   volume em qualquer direção (sem trava de polo — o cubo vira de cabeça para
   baixo se você quiser). Matrizes em column-major, como o WGSL espera. */

const TAU = Math.PI * 2;
const SWING_RANGE = 0.42;       // ±24° em torno da frente

export function perspective(out, fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = far / (near - far);          // WebGPU usa profundidade 0..1
  out[11] = -1;
  out[14] = (far * near) / (near - far);
  return out;
}

export function lookAt(out, eye, target, up) {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

export function multiply(out, a, b) {
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4];
    const b1 = b[c * 4 + 1];
    const b2 = b[c * 4 + 2];
    const b3 = b[c * 4 + 3];
    out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

export class OrbitCamera {
  constructor(canvas, { target, distance, fov = 42 }) {
    this.canvas = canvas;
    this.target = target;
    this.distance = distance;
    this.fov = (fov * Math.PI) / 180;
    this.theta = 0.22;              // azimute
    this.thetaBase = 0.22;
    this.swing = 0;                 // fase do vaivém automático
    this.phi = 1.46;                // polar (0 = de cima; perto de π/2 lê o logo de frente)
    this.minDistance = distance * 0.2;
    this.maxDistance = distance * 4;
    this.autoRotate = 0;
    this.view = new Float32Array(16);
    this.proj = new Float32Array(16);
    this.viewProj = new Float32Array(16);
    this.eye = [0, 0, 0];
    this.wire(canvas);
  }

  wire(canvas) {
    const drag = { active: false, x: 0, y: 0 };
    canvas.addEventListener('pointerdown', (e) => {
      drag.active = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag.active) return;
      this.theta -= (e.clientX - drag.x) * 0.006;
      this.thetaBase = this.theta;                       // arrastar assume o comando
      this.swing = 0;
      this.phi -= (e.clientY - drag.y) * 0.006;
      // o polo não trava: passando dele, o mundo vira — é o giro livre pedido
      this.phi = ((this.phi % Math.PI) + Math.PI) % Math.PI;
      drag.x = e.clientX;
      drag.y = e.clientY;
    });
    const stop = (e) => { drag.active = false; canvas.releasePointerCapture?.(e.pointerId); };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance *= e.deltaY > 0 ? 1.08 : 1 / 1.08;
      this.distance = Math.min(this.maxDistance, Math.max(this.minDistance, this.distance));
    }, { passive: false });
  }

  update(aspect, dt, near, far) {
    // vaivém, não volta completa: girar 360° deixa o wordmark de costas metade do tempo
    if (this.autoRotate > 0) {
      this.swing += dt * this.autoRotate * 0.45;
      this.theta = this.thetaBase + Math.sin(this.swing) * SWING_RANGE;
    }
    const sp = Math.sin(this.phi);
    this.eye = [
      this.target[0] + this.distance * sp * Math.sin(this.theta),
      this.target[1] + this.distance * Math.cos(this.phi),
      this.target[2] + this.distance * sp * Math.cos(this.theta),
    ];
    // perto do polo o "up" canônico degenera; inclinamos de leve para não piscar
    const up = Math.abs(sp) < 0.02 ? [Math.sin(this.theta), 0, Math.cos(this.theta)] : [0, 1, 0];
    lookAt(this.view, this.eye, this.target, up);
    perspective(this.proj, this.fov, aspect, near, far);
    multiply(this.viewProj, this.proj, this.view);
    return this.viewProj;
  }
}

export { TAU };
