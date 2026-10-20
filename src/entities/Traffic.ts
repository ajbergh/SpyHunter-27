import * as THREE from 'three';
import { approach, type RectHitbox } from '../core/logic';
import { makeTrafficVehicle } from './VehicleModels';

export class TrafficVehicle {
  readonly mesh: THREE.Group;
  readonly hostile: boolean;
  readonly halfWidth: number;
  readonly halfLength: number;
  readonly speed: number;
  hp: number;
  x: number;
  z: number;
  private sway = 0;

  constructor(scene: THREE.Scene, x: number, z: number, hostile: boolean, variant: number, color: number, speed: number) {
    this.hostile = hostile;
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.halfWidth = variant === 2 ? 1.4 : variant === 1 ? 0.95 : 1.13;
    this.halfLength = variant === 2 ? 3.05 : variant === 1 ? 1.98 : 2.37;
    this.hp = hostile && variant === 2 ? 3 : hostile ? 2 : 1;
    this.mesh = makeTrafficVehicle(hostile, color, variant);
    this.mesh.position.set(x, 0.12, z);
    scene.add(this.mesh);
  }

  step(dt: number, playerSpeed: number, playerX: number): void {
    this.z += Math.max(9, playerSpeed - this.speed) * dt;
    if (this.hostile && this.z > -32 && this.z < 6) {
      this.sway += dt;
      const targetX = Math.max(-7.2, Math.min(7.2, playerX + Math.sin(this.sway * 2.3) * 1.7));
      this.x = approach(this.x, targetX, 0.55, dt);
    }
    this.mesh.position.set(this.x, 0.12, this.z);
  }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: this.halfWidth, halfLength: this.halfLength }; }
  dispose(scene: THREE.Scene): void { scene.remove(this.mesh); this.mesh.traverse((item) => { if (item instanceof THREE.Mesh) { item.geometry.dispose(); const materials = Array.isArray(item.material) ? item.material : [item.material]; for (const m of materials) m.dispose(); } }); }
}
