/* Lab 02 · Areia 3D — a cena: o wordmark em cada extremidade, areia no meio.

   Nas duas pontas do volume flutua o VETOR do TÉRA (o traço do logo, e só ele —
   sem laje, sem chapa em volta). O de cima é de onde a areia nasce; o de baixo é
   onde ela se deposita. A areia passa à frente dos dois.

   Tudo é grão de 1 pixel: rocha e areia em voo são nuvens de Points com
   `sizeAttenuation: false`, então o grão mede um pixel de tela a qualquer
   distância — a rocha é feita de pixels de areia, não de cubos. */

import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const INK = { subsolo: 0x0a0908, chao: 0x0d0a10, cal: 0xf2efe9 };
const CAM_START = { theta: -0.6, phi: 1.12, dist: 1.95 };  // dist em múltiplos do grid
const GRAIN_PX = 1;             // um grão = um pixel de tela, perto ou longe

export class Scene3D {
  constructor(canvas, { nx, ny, nz, maxSettled, maxFlying }) {
    this.dims = { nx, ny, nz };
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: false, preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(INK.subsolo, 1);
    this.renderer.localClippingEnabled = true;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(INK.subsolo, nx * 1.5, nx * 3.6);

    this.camera = new THREE.PerspectiveCamera(42, 1, 1, nx * 8);
    this.setCameraStart();

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = nx * 0.3;
    this.controls.maxDistance = nx * 4;
    // sem trava de polo: o volume gira em qualquer direção, inclusive de cabeça para baixo
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.target.set(0, ny * 0.45, 0);

    this.world = new THREE.Group();
    this.world.position.set(-nx / 2, 0, -nz / 2);           // grid em coordenadas de célula
    this.scene.add(this.world);

    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), nz);
    this.addLights();
    this.addFrame();
    this.addGrains(maxSettled, maxFlying);
  }

  /** Começa de frente para o wordmark, levemente de lado — a leitura vem primeiro. */
  setCameraStart() {
    const { nx, ny } = this.dims;
    this.camera.position.set(nx * 0.42, ny * 0.62, nx * 1.15);
  }

  addLights() {
    const { nx, ny } = this.dims;
    const sun = new THREE.DirectionalLight(0xfff0dc, 1.6);
    sun.position.set(nx * 0.6, ny * 2.2, nx * 0.35);
    const rim = new THREE.DirectionalLight(0x31c4ff, 0.5);   // biolum na contraluz
    rim.position.set(-nx * 0.7, ny * 0.4, -nx * 0.6);
    this.scene.add(sun, rim, new THREE.HemisphereLight(0x9fb6c8, 0x2c2018, 0.7));
  }

  /** A caixa do volume: só a moldura, e o usuário liga e desliga. */
  addFrame() {
    const { nx, ny, nz } = this.dims;
    const box = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(nx, ny, nz));
    const frame = new THREE.Box3Helper(box, new THREE.Color(0x37303f));
    frame.material.transparent = true;
    frame.material.opacity = 0.55;
    this.world.add(frame);
    this.frame = frame;
  }

  setBox(on) {
    this.frame.visible = on;
  }

  addGrains(maxSettled, maxFlying) {
    this.rock = this.makePointCloud(maxSettled);
    this.fly = this.makePointCloud(maxFlying);
    this.world.add(this.rock, this.fly);
  }

  /** Nuvem de grãos de 1 px, com o corte aplicado. */
  makePointCloud(capacity) {
    const geo = new THREE.BufferGeometry();
    const pos = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    const col = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    col.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', pos);
    geo.setAttribute('color', col);
    geo.setDrawRange(0, 0);
    const points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: GRAIN_PX, vertexColors: true, sizeAttenuation: false,
      clippingPlanes: [this.clipPlane],
    }));
    points.frustumCulled = false;
    return points;
  }

  /** Copia a faixa nova de rocha para a nuvem (cada grão sobe à GPU uma vez só). */
  pushSettled(positions, colors, from, count) {
    const pos = this.rock.geometry.attributes.position;
    if (from >= pos.count) return;
    count = Math.min(count, pos.count - from);     // passar da capacidade zeraria o draw call
    if (count <= 0) return;
    const col = this.rock.geometry.attributes.color;
    pos.array.set(positions.subarray(from * 3, (from + count) * 3), from * 3);
    col.array.set(colors.subarray(from * 3, (from + count) * 3), from * 3);
    pos.addUpdateRange(from * 3, count * 3);
    pos.needsUpdate = true;
    col.addUpdateRange(from * 3, count * 3);
    col.needsUpdate = true;
    this.rock.geometry.setDrawRange(0, from + count);
  }

  /** Grãos em voo: poucos, reenviados inteiros a cada frame. */
  updateFlying(vol) {
    const pos = this.fly.geometry.attributes.position;
    const col = this.fly.geometry.attributes.color;
    const n = Math.min(vol.flying, pos.count);
    for (let i = 0; i < n; i++) {
      const o = i * 3;
      pos.array[o] = vol.fx[i] + 0.5;
      pos.array[o + 1] = vol.fy[i] + 0.5;
      pos.array[o + 2] = vol.fz[i] + 0.5;
      col.array[o] = vol.fr[i];
      col.array[o + 1] = vol.fg[i];
      col.array[o + 2] = vol.fb[i];
    }
    pos.addUpdateRange(0, n * 3);
    col.addUpdateRange(0, n * 3);
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.fly.geometry.setDrawRange(0, n);
  }

  reset() {
    this.rock.geometry.setDrawRange(0, 0);
    this.fly.geometry.setDrawRange(0, 0);
  }

  /** Corte: 1 mostra a rocha inteira, 0 fatia até a face da frente.
      O plano é avaliado em world space — daí o -nz/2 do grupo entrar na conta. */
  setClip(t) {
    this.clipPlane.constant = this.dims.nz * (t - 0.5);
  }

  setAutoRotate(speed) {
    this.controls.autoRotate = speed > 0;
    this.controls.autoRotateSpeed = speed * 2.2;
  }

  resize(w, h, dpr) {
    const ratio = Math.min(dpr, 2);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    // size é medido no buffer de desenho: em tela retina o grão precisa de
    // `ratio` pixels de buffer para valer 1 pixel do olho
    for (const cloud of [this.rock, this.fly]) cloud.material.size = GRAIN_PX * ratio;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
