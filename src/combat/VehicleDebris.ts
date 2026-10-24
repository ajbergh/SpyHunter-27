import * as THREE from 'three';

const CAPACITY = 96;
const SHARDS_PER_BLAST = 10;
const LIFE = 1.45;
type Shard = {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  remaining: number; bounced: boolean;
};

/**
 * Cinematic metallic fragments use one preallocated instanced batch and the
 * curved road renderer. Empty batches incur no draw call or per-frame GPU
 * upload. Scrappy, elongated silhouettes are formed by nonuniform instance
 * scales, never by creating new meshes, materials or physics bodies.
 */
export class VehicleDebris {
  readonly mesh: THREE.InstancedMesh;
  private readonly shards: Shard[] = Array.from({ length: CAPACITY }, () => ({
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, remaining: 0, bounced: false,
  }));
  private readonly rendered = new Uint8Array(CAPACITY);
  private readonly transform = new THREE.Object3D();
  private readonly enemyColor = new THREE.Color(0xe8a471);
  private readonly civilianColor = new THREE.Color(0xa8c6d9);
  private cursor = 0;
  private living = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.TetrahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, metalness: 0.81, roughness: 0.30, flatShading: true,
      }), CAPACITY,
    );
    this.mesh.name = 'PooledVehicleFragments';
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.reset();
  }

  get activeCount(): number { return this.living; }
  get capacity(): number { return CAPACITY; }

  emit(x: number, z: number, hostile: boolean, altitude = 1.1): void {
    if (!Number.isFinite(x) || !Number.isFinite(z) ||
        !Number.isFinite(altitude)) return;
    for (let i = 0; i < SHARDS_PER_BLAST; i++) {
      const index = this.cursor;
      const shard = this.shards[index];
      if (shard.remaining <= 0) this.living++;
      const angle = i * Math.PI * 2 / SHARDS_PER_BLAST + (index % 3) * 0.12;
      const velocity = 2.9 + (i % 4) * 0.9;
      shard.x = x; shard.y = altitude; shard.z = z;
      shard.vx = Math.cos(angle) * velocity;
      shard.vz = Math.sin(angle) * velocity;
      shard.vy = 3.0 + (i % 5) * 1.1;
      shard.remaining = LIFE;
      shard.bounced = false;
      this.mesh.setColorAt(index, hostile ? this.enemyColor : this.civilianColor);
      this.cursor = (index + 1) % CAPACITY;
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = this.living > 0;
  }

  step(dt: number, playerSpeed: number): void {
    if (this.living === 0 || !Number.isFinite(dt) || dt <= 0) return;
    const scroll = Number.isFinite(playerSpeed) ? playerSpeed : 0;
    for (const shard of this.shards) {
      if (shard.remaining <= 0) continue;
      shard.remaining = Math.max(0, shard.remaining - dt);
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.z += (shard.vz + scroll) * dt;
      shard.vy -= 12.5 * dt;
      shard.vx *= Math.max(0, 1 - dt * 0.9);
      shard.vz *= Math.max(0, 1 - dt * 0.9);
      if (shard.y <= 0.18 && shard.vy < 0) {
        shard.y = 0.18;
        if (shard.bounced) shard.remaining = Math.min(shard.remaining, 0.2);
        else { shard.vy *= -0.3; shard.bounced = true; }
      }
      if (shard.z > 75) shard.remaining = 0;
      if (shard.remaining === 0) this.living--;
    }
    this.mesh.visible = this.living > 0;
  }

  renderAt(center: (z: number) => number): void {
    if (!this.mesh.visible) return;
    for (let i = 0; i < CAPACITY; i++) {
      const shard = this.shards[i];
      if (shard.remaining <= 0 && !this.rendered[i]) continue;
      if (shard.remaining > 0) {
        this.transform.position.set(shard.x + center(shard.z), shard.y, shard.z);
        const fade = Math.min(1, shard.remaining * 4);
        // Deterministic irregular splinters instead of identical scaled
        // tetrahedrons. Thin cross sections catch studio/environment lighting.
        this.transform.scale.set(
          fade * (0.36 + (i % 4) * 0.07),
          fade * (0.65 + (i % 3) * 0.18),
          fade * (1.35 + (i % 5) * 0.21),
        );
        this.transform.rotation.set(
          shard.y * 1.3 + i,
          shard.z * 0.1 + i * 0.23,
          shard.x * 0.6,
        );
        this.rendered[i] = 1;
      } else {
        // Previously painted instance must be erased before the next visible
        // explosion batch, otherwise a stale fragment can reappear.
        this.transform.scale.setScalar(0);
        this.rendered[i] = 0;
      }
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(i, this.transform.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.cursor = 0;
    this.living = 0;
    this.rendered.fill(0);
    this.mesh.visible = false;
    for (const shard of this.shards) shard.remaining = 0;
    this.transform.scale.setScalar(0);
    this.transform.updateMatrix();
    for (let i = 0; i < CAPACITY; i++)
      this.mesh.setMatrixAt(i, this.transform.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
