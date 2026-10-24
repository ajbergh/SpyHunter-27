import * as THREE from 'three';

const CAPACITY = 128;
const FADE_SECONDS = 0.54;
type Puff = { x: number; y: number; z: number; remaining: number };

/**
 * Fixed-size instanced missile smoke in curved-road coordinates.
 * Empty puffs no longer trigger centerline work, instance uploads or a draw
 * call. Previously drawn slots clear exactly once on a later active burst.
 */
export class MissileContrails {
  readonly mesh: THREE.InstancedMesh;
  private readonly puffs: Puff[] = Array.from({ length: CAPACITY },
    () => ({ x: 0, y: 0, z: 0, remaining: 0 }));
  private readonly rendered = new Uint8Array(CAPACITY);
  private readonly transform = new THREE.Object3D();
  private next = 0;
  private living = 0;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.IcosahedronGeometry(0.34, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xc4d6df, transparent: true, opacity: 0.48,
      depthWrite: false, blending: THREE.NormalBlending,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
    this.mesh.name = 'PooledMissileContrails';
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.reset();
  }

  get activeCount(): number { return this.living; }
  get capacity(): number { return CAPACITY; }

  emit(x: number, y: number, z: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      return;
    const puff = this.puffs[this.next];
    if (puff.remaining <= 0) this.living++;
    puff.x = x;
    puff.y = y;
    puff.z = z;
    puff.remaining = FADE_SECONDS;
    this.next = (this.next + 1) % CAPACITY;
    this.mesh.visible = true;
  }

  step(dt: number, playerSpeed: number): void {
    if (this.living === 0 || !Number.isFinite(dt) || dt <= 0) return;
    const scroll = Number.isFinite(playerSpeed) ? Math.max(0, playerSpeed) : 0;
    for (const puff of this.puffs) {
      if (puff.remaining <= 0) continue;
      puff.remaining = Math.max(0, puff.remaining - dt);
      puff.z += scroll * dt;
      puff.y += 0.36 * dt;
      if (puff.remaining === 0) this.living--;
    }
    this.mesh.visible = this.living > 0;
  }

  renderAt(center: (z: number) => number): void {
    if (!this.mesh.visible) return;
    for (let i = 0; i < CAPACITY; i++) {
      const puff = this.puffs[i];
      if (puff.remaining <= 0 && !this.rendered[i]) continue;
      if (puff.remaining > 0) {
        this.transform.position.set(puff.x + center(puff.z), puff.y, puff.z);
        const age = 1 - puff.remaining / FADE_SECONDS;
        const scale = (0.45 + age * 1.25) * (1 - age);
        this.transform.scale.setScalar(scale);
        this.rendered[i] = 1;
      } else {
        this.transform.scale.setScalar(0);
        this.rendered[i] = 0;
      }
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(i, this.transform.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.next = 0;
    this.living = 0;
    this.rendered.fill(0);
    for (const puff of this.puffs) puff.remaining = 0;
    this.mesh.visible = false;
    this.transform.scale.setScalar(0);
    this.transform.updateMatrix();
    for (let i = 0; i < CAPACITY; i++)
      this.mesh.setMatrixAt(i, this.transform.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
