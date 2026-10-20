import * as THREE from 'three';

type Wake = { mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; x: number; z: number; life: number };

/** Reusable wake rings drift behind the interceptor in water mode. */
export class BoatWake {
  private readonly wakes: Wake[] = [];
  private readonly geometry = new THREE.RingGeometry(0.85, 1.05, 18);
  private readonly material = new THREE.MeshBasicMaterial({
    color: 0xb5f6ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
  });
  private elapsed = 0;

  constructor(private readonly scene: THREE.Scene) {}

  get count(): number { return this.wakes.length; }

  reset(): void {
    for (const wake of this.wakes) this.scene.remove(wake.mesh);
    this.wakes.length = 0;
    this.elapsed = 0;
  }

  step(dt: number, speed: number, x: number, boat: boolean): void {
    if (boat) {
      this.elapsed += dt;
      if (this.elapsed > 0.14 && this.wakes.length < 32) {
        this.elapsed = 0;
        const mesh = new THREE.Mesh(this.geometry, this.material.clone());
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0.18, 14);
        this.scene.add(mesh);
        this.wakes.push({ mesh, x, z: 14, life: 1.2 });
      }
    } else {
      this.elapsed = 0;
    }
    for (let i = this.wakes.length - 1; i >= 0; i--) {
      const wake = this.wakes[i];
      wake.life -= dt;
      wake.z += speed * dt;
      wake.mesh.position.z = wake.z;
      wake.mesh.scale.setScalar(1 + (1.2 - wake.life) * 1.7);
      wake.mesh.material.opacity = Math.max(0, wake.life / 1.2) * 0.4;
      if (wake.life <= 0 || wake.z > 85) {
        this.scene.remove(wake.mesh);
        wake.mesh.material.dispose();
        this.wakes.splice(i, 1);
      }
    }
  }

  renderAt(center: (z: number) => number): void {
    for (const wake of this.wakes) wake.mesh.position.x = wake.x + center(wake.z);
  }
}
