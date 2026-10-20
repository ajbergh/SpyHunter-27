import * as THREE from 'three';
import { intersects, type RectHitbox } from '../core/logic';

interface Bullet { mesh: THREE.Mesh; x: number; z: number; active: boolean }

/** A fixed capacity pool avoids geometry allocations during sustained gunfire. */
export class Projectiles {
  private readonly bullets: Bullet[] = [];
  private readonly geometry = new THREE.BoxGeometry(0.14, 0.11, 1.35);
  private readonly material = new THREE.MeshBasicMaterial({ color: 0xffe38c });

  constructor(scene: THREE.Scene) {
    for (let i = 0; i < 80; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.visible = false;
      scene.add(mesh);
      this.bullets.push({ mesh, x: 0, z: 0, active: false });
    }
  }

  fire(x: number, z: number): void {
    for (const offset of [-0.63, 0.63]) {
      const bullet = this.bullets.find((b) => !b.active);
      if (!bullet) return;
      bullet.active = true;
      bullet.x = x + offset;
      bullet.z = z - 2.9;
      bullet.mesh.position.set(bullet.x, 0.73, bullet.z);
      bullet.mesh.visible = true;
    }
  }

  step(dt: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.z -= 103 * dt;
      bullet.mesh.position.z = bullet.z;
      if (bullet.z < -85) this.deactivate(bullet);
    }
  }

  hitTest(hitbox: RectHitbox): boolean {
    for (const bullet of this.bullets) {
      if (bullet.active && intersects({ x: bullet.x, z: bullet.z, halfWidth: 0.1, halfLength: 0.65 }, hitbox)) {
        this.deactivate(bullet);
        return true;
      }
    }
    return false;
  }

  renderAt(center: (z: number) => number): void {
    for (const bullet of this.bullets) {
      if (bullet.active) bullet.mesh.position.x = bullet.x + center(bullet.z);
    }
  }

  reset(): void { for (const bullet of this.bullets) this.deactivate(bullet); }

  private deactivate(bullet: Bullet): void {
    bullet.active = false;
    bullet.mesh.visible = false;
  }
}
