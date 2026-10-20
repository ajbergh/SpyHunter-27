import * as THREE from 'three';

type Instance = {
  group: THREE.Group;
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  sparks: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>[];
  life: number;
  duration: number;
  strength: number;
};

/**
 * Limited reusable explosion pool: fiery core, expanding road-plane shockwave
 * and eight ballistic sparks. No scene graph or geometry allocations per impact.
 */
export class ExplosionEffects {
  private readonly pool: Instance[] = [];
  private readonly sphere = new THREE.SphereGeometry(1, 12, 8);
  private readonly ringGeometry = new THREE.RingGeometry(0.82, 1, 28);
  private readonly sparkGeometry = new THREE.BoxGeometry(0.12, 0.13, 0.48);
  private cursor = 0;

  constructor(private readonly scene: THREE.Scene, capacity = 24) {
    for (let i = 0; i < capacity; i++) this.pool.push(this.makeInstance());
  }

  get activeCount(): number { return this.pool.filter(e => e.group.visible).length; }
  get capacity(): number { return this.pool.length; }

  private makeInstance(): Instance {
    const group = new THREE.Group();
    const core = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({
      color: 0xffab40, transparent: true, opacity: 0, depthWrite: false,
    }));
    group.add(core);
    const ring = new THREE.Mesh(this.ringGeometry, new THREE.MeshBasicMaterial({
      color: 0xffc269, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.68;
    group.add(ring);
    const sparks: Instance['sparks'] = [];
    for (let j = 0; j < 8; j++) {
      const spark = new THREE.Mesh(this.sparkGeometry, new THREE.MeshBasicMaterial({
        color: 0xffe79e, transparent: true, opacity: 0, depthWrite: false,
      }));
      group.add(spark);
      sparks.push(spark);
    }
    group.visible = false;
    this.scene.add(group);
    return { group, core, ring, sparks, life: 0, duration: 1, strength: 1 };
  }

  emit(x: number, z: number, duration = 0.5, color = 0xffaa44): void {
    if (!this.pool.length) return;
    const effect = this.pool.find(e => !e.group.visible) ?? this.pool[this.cursor++ % this.pool.length];
    effect.life = duration;
    effect.duration = duration;
    effect.strength = Math.max(0.4, duration * 2.5);
    effect.group.position.set(x, 1.1, z);
    effect.group.visible = true;
    effect.core.material.color.setHex(color);
    effect.ring.material.color.setHex(color);
    effect.core.material.opacity = 0.95;
    effect.ring.material.opacity = 0.75;
  }

  step(dt: number): void {
    for (const effect of this.pool) {
      if (!effect.group.visible) continue;
      effect.life -= dt;
      if (effect.life <= 0) {
        effect.group.visible = false;
        continue;
      }
      const p = 1 - effect.life / effect.duration;
      const fade = Math.pow(1 - p, 1.3);
      effect.core.scale.setScalar((0.4 + p * 1.9) * effect.strength);
      effect.core.material.opacity = fade * 0.85;
      effect.ring.scale.setScalar((0.6 + p * 4.6) * effect.strength);
      effect.ring.material.opacity = fade * 0.6;
      for (let i = 0; i < effect.sparks.length; i++) {
        const angle = (i / effect.sparks.length) * Math.PI * 2;
        const speed = (1.8 + (i % 3) * 0.7) * effect.strength;
        const spark = effect.sparks[i];
        spark.position.set(Math.cos(angle) * p * speed * 2.3,
          Math.sin(p * Math.PI) * 1.7 + p * 0.25,
          Math.sin(angle) * p * speed * 2.3);
        spark.rotation.y = angle;
        spark.material.opacity = fade;
      }
    }
  }

  reset(): void {
    for (const effect of this.pool) { effect.life = 0; effect.group.visible = false; }
    this.cursor = 0;
  }
}
