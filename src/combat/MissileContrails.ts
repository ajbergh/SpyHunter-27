import * as THREE from 'three';

const CAPACITY = 128;
const FADE_SECONDS = 0.54;
type Puff = { x: number; y: number; z: number; remaining: number };

/**
 * Fixed-size, single-draw-call instanced missile smoke. Puff positions stay in
 * lane-relative world coordinates and follow the same curved renderer as shots.
 * No geometries, meshes or materials are allocated during gameplay.
 */
export class MissileContrails {
  readonly mesh: THREE.InstancedMesh;
  private readonly puffs: Puff[] = Array.from({ length: CAPACITY },
    () => ({ x: 0, y: 0, z: 0, remaining: 0 }));
  private readonly transform = new THREE.Object3D();
  private next = 0;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.IcosahedronGeometry(0.34, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xc4d6df, transparent: true, opacity: 0.48,
      depthWrite: false, blending: THREE.NormalBlending,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.renderAt(() => 0);
  }

  get activeCount(): number {
    return this.puffs.filter(puff => puff.remaining > 0).length;
  }

  emit(x: number, y: number, z: number): void {
    const puff = this.puffs[this.next];
    puff.x = x;
    puff.y = y;
    puff.z = z;
    puff.remaining = FADE_SECONDS;
    this.next = (this.next + 1) % CAPACITY;
  }

  step(dt: number, playerSpeed: number): void {
    for (const puff of this.puffs) {
      if (puff.remaining <= 0) continue;
      puff.remaining = Math.max(0, puff.remaining - dt);
      puff.z += Math.max(0, playerSpeed) * dt;
      puff.y += 0.36 * dt;
    }
  }

  renderAt(center: (z: number) => number): void {
    for (let i = 0; i < CAPACITY; i++) {
      const puff = this.puffs[i];
      this.transform.position.set(puff.x + center(puff.z), puff.y, puff.z);
      const age = 1 - puff.remaining / FADE_SECONDS;
      const scale = puff.remaining > 0 ? (0.45 + age * 1.25) * (1 - age) : 0;
      this.transform.scale.setScalar(scale);
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(i, this.transform.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.next = 0;
    for (const puff of this.puffs) puff.remaining = 0;
    this.renderAt(() => 0);
  }
}
