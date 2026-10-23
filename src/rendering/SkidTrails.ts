import * as THREE from 'three';
import { PLAYER_Z } from '../core/logic';
import type { Quality } from '../gameplay/Settings';
import type { Biome } from '../world/WorldPlan';

const POOL_SIZE = 160;
const DURATION = 3.2;
type Mark = { x: number; z: number; life: number };

export function skidCondition(
  speed: number, steer: number, brake: boolean, biome: Biome, isBoat: boolean,
): boolean {
  if (isBoat || biome === 'water') return false;
  return (Math.abs(steer) > 0.62 && speed > (biome === 'snow' ? 20 : 33)) ||
    (brake && speed > 22);
}

/** Reusable instanced tire rubber scuffs following the curved roadway. */
export class SkidTrails {
  readonly mesh: THREE.InstancedMesh;
  private readonly marks: Mark[] = Array.from({ length: POOL_SIZE },
    () => ({ x: 0, z: 0, life: 0 }));
  private readonly dummy = new THREE.Object3D();
  private readonly shade = new THREE.Color();
  // Only live or previously rendered marks need matrix uploads. Inactive
  // instances stay hidden without calling roadCenterAt or touching the GPU.
  private readonly rendered = new Uint8Array(POOL_SIZE);
  private liveCount = 0;
  private quality: Quality = 'medium';
  private cursor = 0;
  private clock = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.14, 0.88),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.38,
        depthWrite: false, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -1,
      }), POOL_SIZE,
    );
    this.mesh.name = 'PooledTireSkids';
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.reset();
  }

  get activeCount(): number { return this.liveCount; }
  get capacity(): number { return POOL_SIZE; }

  setQuality(quality: Quality): void {
    this.quality = quality;
    this.mesh.visible = quality !== 'low' && this.liveCount > 0;
    if (quality === 'low') this.reset();
  }

  private mark(x: number, z: number, biome: Biome): void {
    const entry = this.marks[this.cursor];
    if (entry.life <= 0) this.liveCount++;
    entry.x = x; entry.z = z; entry.life = DURATION;
    const color = biome === 'snow' ? 0x8293a7 : biome === 'desert' ? 0x534439 : 0x131d20;
    this.mesh.setColorAt(this.cursor, this.shade.setHex(color));
    this.cursor = (this.cursor + 1) % POOL_SIZE;
  }

  step(
    dt: number, speed: number, x: number, steer: number,
    braking: boolean, biome: Biome, isBoat: boolean, playerZ = PLAYER_Z,
  ): void {
    const d = Math.max(0, dt);
    if (this.liveCount > 0) {
      for (const m of this.marks) {
        if (m.life <= 0) continue;
        m.z += speed * d;
        m.life = Math.max(0, m.life - d);
        if (m.z > 65) m.life = 0;
        if (m.life === 0) this.liveCount--;
      }
    }
    this.mesh.visible = this.quality !== 'low' && this.liveCount > 0;
    if (this.quality === 'low' || !skidCondition(speed, steer, braking, biome, isBoat)) {
      this.clock = 0;
      return;
    }
    this.clock += d;
    const interval = this.quality === 'high' ? 0.085 : 0.14;
    while (this.clock >= interval) {
      this.clock -= interval;
      // Wheel tracks stay behind the car; no particles or geometry allocations.
      for (const side of [-1, 1]) this.mark(x + side * 0.85, playerZ + 1.64, biome);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = this.liveCount > 0;
  }

  renderAt(center: (z: number) => number): void {
    if (!this.mesh.visible) return;
    this.dummy.rotation.set(-Math.PI / 2, 0, 0);
    for (let i = 0; i < POOL_SIZE; i++) {
      const mark = this.marks[i];
      if (mark.life <= 0 && !this.rendered[i]) continue;
      if (mark.life > 0) {
        this.dummy.position.set(mark.x + center(mark.z), 0.051, mark.z);
        this.dummy.scale.set(1, Math.min(1, mark.life * 2.6), 1);
        this.rendered[i] = 1;
      } else {
        // Clear an expired GPU instance exactly once before any future batch
        // becomes visible. Avoid leaving stale black trails after quiet time.
        this.dummy.scale.setScalar(0);
        this.rendered[i] = 0;
      }
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.cursor = 0;
    this.clock = 0;
    this.liveCount = 0;
    this.rendered.fill(0);
    this.mesh.visible = false;
    for (const m of this.marks) m.life = 0;
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < POOL_SIZE; i++) this.mesh.setMatrixAt(i, this.dummy.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
