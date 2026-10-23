import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';

const CAPACITY = 72;
const LIFE = 0.46;
const TWO_PI = Math.PI * 2;

type Spark = {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number; life: number;
};

/**
 * Directional, original geometry-only hit sparks: one pooled instanced draw.
 * Impact coordinates remain lane-relative; renderAt applies the road curve.
 * Nothing is allocated inside emit(), step() or renderAt().
 */
export class ImpactSparks {
  readonly mesh: THREE.InstancedMesh;
  private readonly sparks: Spark[] = Array.from({ length: CAPACITY }, () => ({
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0,
  }));
  private readonly rendered = new Uint8Array(CAPACITY);
  private readonly transform = new THREE.Object3D();
  private readonly hostileTint = new THREE.Color(0xffb369);
  private readonly civilianTint = new THREE.Color(0x8bddfb);
  private cursor = 0;
  private living = 0;
  private quality: Quality = 'medium';
  private reducedMotion = false;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.07, 0.075, 0.43),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.89,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }), CAPACITY,
    );
    this.mesh.name = 'PooledImpactSparks';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.reset();
  }

  get activeCount(): number { return this.living; }
  get capacity(): number { return CAPACITY; }

  setPreferences(quality: Quality, reducedMotion: boolean): void {
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    if (quality === 'low' || reducedMotion) this.reset();
    else this.mesh.visible = this.living > 0;
  }

  emit(x: number, z: number, hostile: boolean, side = 0): void {
    if (this.quality === 'low' || this.reducedMotion ||
        !Number.isFinite(x) || !Number.isFinite(z)) return;
    const amount = this.quality === 'high' ? 8 : 5;
    const direction = Number.isFinite(side) ? Math.max(-1, Math.min(1, side)) : 0;
    for (let i = 0; i < amount; i++) {
      const index = this.cursor;
      const particle = this.sparks[index];
      if (particle.life <= 0) this.living++;
      const angle = (i / amount) * TWO_PI + (index % 7) * 0.09;
      const impulse = 3.4 + (index % 4) * 0.6;
      particle.x = x;
      particle.y = 1.02;
      particle.z = z;
      particle.vx = Math.cos(angle) * impulse + direction * 2.2;
      particle.vy = 2.6 + (i % 3) * 0.66;
      particle.vz = Math.sin(angle) * impulse * 0.65;
      particle.life = LIFE;
      this.mesh.setColorAt(index, hostile ? this.hostileTint : this.civilianTint);
      this.cursor = (index + 1) % CAPACITY;
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = this.living > 0;
  }

  step(dt: number, playerSpeed: number): void {
    if (this.living === 0 || !Number.isFinite(dt) || dt <= 0) return;
    const elapsed = Math.min(dt, 0.1);
    const scroll = Number.isFinite(playerSpeed) ? playerSpeed : 0;
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      spark.life = Math.max(0, spark.life - elapsed);
      spark.x += spark.vx * elapsed;
      spark.y += spark.vy * elapsed;
      spark.z += (spark.vz + scroll) * elapsed;
      spark.vy -= 13.5 * elapsed;
      if (spark.life === 0 || spark.y < 0 || spark.z > 78) {
        spark.life = 0;
        this.living--;
      }
    }
    this.mesh.visible = this.living > 0;
  }

  renderAt(center: (z: number) => number): void {
    if (!this.mesh.visible) return;
    for (let i = 0; i < CAPACITY; i++) {
      const spark = this.sparks[i];
      if (spark.life <= 0 && !this.rendered[i]) continue;
      if (spark.life > 0) {
        this.transform.position.set(spark.x + center(spark.z), spark.y, spark.z);
        this.transform.rotation.set(spark.y * 0.25 + i * 0.23,
          spark.x * 0.1, spark.z * 0.2);
        this.transform.scale.setScalar(Math.min(1, spark.life * 5));
        this.rendered[i] = 1;
      } else {
        // Clear once so inactive GPU slots cannot reappear on the next burst.
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
    for (const spark of this.sparks) spark.life = 0;
    this.mesh.visible = false;
    this.transform.scale.setScalar(0);
    this.transform.updateMatrix();
    for (let i = 0; i < CAPACITY; i++)
      this.mesh.setMatrixAt(i, this.transform.matrix);
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
