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
 * A bounded one-draw-call metal fragmentation field. Shards are simulation-
 * relative while the renderer applies the curved-road centerline. No mesh,
 * material, geometry or physics-body allocations occur per explosion.
 */
export class VehicleDebris {
  readonly mesh: THREE.InstancedMesh;
  private readonly shards: Shard[] = Array.from({ length: CAPACITY }, () => ({
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, remaining: 0, bounced: false,
  }));
  private readonly transform = new THREE.Object3D();
  private readonly enemyColor = new THREE.Color(0xe8a471);
  private readonly civilianColor = new THREE.Color(0xa8c6d9);
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.TetrahedronGeometry(0.3, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.35, flatShading: true }),
      CAPACITY,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.reset();
  }

  get activeCount(): number { return this.shards.filter(s => s.remaining > 0).length; }
  get capacity(): number { return this.shards.length; }

  emit(x: number, z: number, hostile: boolean, altitude = 1.1): void {
    for (let i = 0; i < SHARDS_PER_BLAST; i++) {
      const shard = this.shards[this.cursor];
      const angle = i * Math.PI * 2 / SHARDS_PER_BLAST + (this.cursor % 3) * 0.12;
      const velocity = 2.9 + (i % 4) * 0.9;
      shard.x = x; shard.y = altitude; shard.z = z;
      shard.vx = Math.cos(angle) * velocity;
      shard.vz = Math.sin(angle) * velocity;
      shard.vy = 3.0 + (i % 5) * 1.1;
      shard.remaining = LIFE;
      shard.bounced = false;
      this.mesh.setColorAt(this.cursor, hostile ? this.enemyColor : this.civilianColor);
      this.cursor = (this.cursor + 1) % CAPACITY;
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  step(dt: number, playerSpeed: number): void {
    for (const shard of this.shards) {
      if (shard.remaining <= 0) continue;
      shard.remaining = Math.max(0, shard.remaining - dt);
      shard.x += shard.vx * dt;
      shard.y += shard.vy * dt;
      shard.z += (shard.vz + playerSpeed) * dt;
      shard.vy -= 12.5 * dt;
      shard.vx *= Math.max(0, 1 - dt * 0.9);
      shard.vz *= Math.max(0, 1 - dt * 0.9);
      if (shard.y <= 0.18 && shard.vy < 0) {
        shard.y = 0.18;
        if (shard.bounced) shard.remaining = Math.min(shard.remaining, 0.2);
        else { shard.vy *= -0.3; shard.bounced = true; }
      }
      if (shard.z > 75) shard.remaining = 0;
    }
  }

  renderAt(center: (z: number) => number): void {
    for (let i = 0; i < CAPACITY; i++) {
      const shard = this.shards[i];
      this.transform.position.set(shard.x + center(shard.z), shard.y, shard.z);
      const scale = shard.remaining > 0 ? Math.min(1, shard.remaining * 4) : 0;
      this.transform.scale.setScalar(scale);
      this.transform.rotation.set(shard.y * 1.3 + i, shard.z * 0.1, shard.x * 0.6);
      this.transform.updateMatrix();
      this.mesh.setMatrixAt(i, this.transform.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  reset(): void {
    this.cursor = 0;
    for (const shard of this.shards) shard.remaining = 0;
    this.renderAt(() => 0);
  }
}
