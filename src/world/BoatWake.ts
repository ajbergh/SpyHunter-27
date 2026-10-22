import * as THREE from 'three';
import { PLAYER_Z } from '../core/logic';
import type { Quality } from '../gameplay/Settings';

const CAPACITY = 80;
const LIFETIME = 1.55;
const BUDGET: Record<Quality, number> = { low: 12, medium: 40, high: CAPACITY };
const EMISSION: Record<Quality, number> = { low: 0.27, medium: 0.16, high: 0.095 };
type WakeMark = { x: number; z: number; life: number; heading: number; speed: number };

/**
 * Original V-hull wake ribbon with two tapered, fan-shaped foam trails and
 * centerline turbulence, all combined into one indexed mesh per instance.
 * The geometry lies directly on the water plane, ahead of instance transforms.
 */
export function createWakeGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const segments = 10;
  // Paired diverging stern wakes. Local positive Z points downstream,
  // matching the game's scrolling wake trail behind the player.
  for (const side of [-1, 1]) {
    const first = vertices.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = side * (0.25 + t * 2.75);
      const z = -0.5 + t * 3.8;
      const half = 0.055 + Math.sin(t * Math.PI) * 0.12;
      for (const edge of [-1, 1]) {
        vertices.push(x + side * edge * half, 0, z);
        const brightness = (edge === 1 ? 0.66 : 1) * (1 - t * 0.35);
        colors.push(0.72 * brightness, 0.95 * brightness, brightness);
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = first + i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  // Broken spine turbulence, concentrated immediately behind the twin engines.
  const first = vertices.length / 3;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -0.65 + t * 3.5;
    const half = 0.24 * (1 - t) + 0.05;
    for (const edge of [-1, 1]) {
      vertices.push(edge * half, 0.002, z);
      const brightness = (1 - t * 0.70) * (edge === 1 ? 0.72 : 0.92);
      colors.push(0.64 * brightness, 0.89 * brightness, brightness);
    }
  }
  for (let i = 0; i < segments; i++) {
    const a = first + i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Single-instanced-draw water wake with fixed allocation and no material,
 * mesh or geometry creation in the fixed-step game loop. Mark positions are
 * simulation-relative; curving the river is a rendering-only transform.
 */
export class BoatWake {
  readonly mesh: THREE.InstancedMesh;
  private readonly marks: WakeMark[] = Array.from({ length: CAPACITY },
    () => ({ x: 0, z: 0, life: 0, heading: 0, speed: 0 }));
  private readonly dummy = new THREE.Object3D();
  private readonly foamColor = new THREE.Color();
  private quality: Quality = 'medium';
  private cursor = 0;
  private clock = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      createWakeGeometry(),
      new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.63,
        depthWrite: false, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -1,
      }),
      CAPACITY,
    );
    this.mesh.name = 'PooledVHulFoamWake';
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.renderOrder = 2;
    scene.add(this.mesh);
    this.reset();
    this.mesh.count = BUDGET[this.quality];
  }

  get count(): number {
    let active = 0;
    for (let i = 0; i < BUDGET[this.quality]; i++) {
      if (this.marks[i].life > 0) active++;
    }
    return active;
  }
  get capacity(): number { return CAPACITY; }
  get budget(): number { return BUDGET[this.quality]; }

  setQuality(quality: Quality): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.reset();
    this.mesh.count = BUDGET[quality];
  }

  private emit(x: number, speed: number, steer: number, playerZ: number): void {
    const mark = this.marks[this.cursor];
    mark.x = x;
    mark.z = playerZ + 3.2;
    mark.life = LIFETIME;
    mark.heading = THREE.MathUtils.clamp(steer, -1, 1) * 0.11;
    mark.speed = THREE.MathUtils.clamp(speed, 12, 54);
    const lum = 0.82 + (this.cursor % 4) * 0.055;
    this.mesh.setColorAt(this.cursor, this.foamColor.setRGB(lum, lum, lum));
    this.cursor = (this.cursor + 1) % BUDGET[this.quality];
  }

  /** Emits a trail only in boat mode; existing foam decays after transfers. */
  step(dt: number, speed: number, x: number, boat: boolean, steer = 0, playerZ = PLAYER_Z): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const scroll = Math.max(0, Number.isFinite(speed) ? speed : 0);
    for (const mark of this.marks) {
      if (mark.life <= 0) continue;
      mark.life = Math.max(0, mark.life - dt);
      mark.z += scroll * dt;
      if (mark.z > 79) mark.life = 0;
    }
    if (!boat || scroll < 12) {
      this.clock = 0;
      return;
    }
    // Bound catch-up after a browser stall; don't flood the pool in one tick.
    this.clock += Math.min(dt, 0.20);
    const interval = EMISSION[this.quality];
    while (this.clock >= interval) {
      this.clock -= interval;
      this.emit(x, scroll, steer, playerZ);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  renderAt(center: (z: number) => number): void {
    for (let i = 0; i < this.budget; i++) {
      const mark = this.marks[i];
      const life = mark.life;
      const normalized = life / LIFETIME;
      const swell = 1 + (1 - normalized) * (0.55 + mark.speed / 70);
      const fade = life > 0 ? Math.min(1, life * 2.0) : 0;
      this.dummy.position.set(mark.x + center(mark.z), 0.18, mark.z);
      this.dummy.rotation.set(0, mark.heading, 0);
      this.dummy.scale.set(swell * fade, 1, swell * fade);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.cursor = 0;
    this.clock = 0;
    for (const mark of this.marks) mark.life = 0;
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < CAPACITY; i++) this.mesh.setMatrixAt(i, this.dummy.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
