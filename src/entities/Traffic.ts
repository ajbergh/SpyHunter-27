import * as THREE from 'three';
import { approach, clamp, type RectHitbox } from '../core/logic';
import { makeTrafficVehicle } from './VehicleModels';

export type EnemyRole = 'civilian' | 'interceptor' | 'weaver' | 'blocker';
export type EnemyState = 'approach' | 'intercept' | 'disrupted' | 'spinning';

export class TrafficVehicle {
  readonly mesh: THREE.Group;
  readonly hostile: boolean;
  readonly role: EnemyRole;
  readonly halfWidth: number;
  readonly halfLength: number;
  readonly speed: number;
  hp: number;
  x: number;
  z: number;
  state: EnemyState = 'approach';
  private sway = 0;
  private spinTimer = 0;
  private disruption = 0;
  private spinDirection: number;

  constructor(scene: THREE.Scene, x: number, z: number, hostile: boolean, variant: number, color: number, speed: number) {
    this.hostile = hostile;
    this.role = !hostile ? 'civilian' : variant === 2 ? 'blocker' : variant === 1 ? 'weaver' : 'interceptor';
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.spinDirection = x >= 0 ? 1 : -1;
    this.halfWidth = variant === 2 ? 1.4 : variant === 1 ? 0.95 : 1.13;
    this.halfLength = variant === 2 ? 3.05 : variant === 1 ? 1.98 : 2.37;
    this.hp = hostile && variant === 2 ? 4 : hostile ? 2 : 1;
    this.mesh = makeTrafficVehicle(hostile, color, variant);
    this.mesh.position.set(x, 0.12, z);
    scene.add(this.mesh);
  }

  disrupt(seconds: number): void { this.disruption = Math.max(this.disruption, seconds); }

  spinOut(seconds: number): void {
    this.spinTimer = Math.max(this.spinTimer, seconds);
    this.disruption = Math.max(this.disruption, seconds);
  }

  step(dt: number, playerSpeed: number, playerX: number): void {
    this.spinTimer = Math.max(0, this.spinTimer - dt);
    this.disruption = Math.max(0, this.disruption - dt);
    this.z += Math.max(8, playerSpeed - this.speed * (this.disruption > 0 ? 0.5 : 1)) * dt;
    if (this.spinTimer > 0) {
      this.state = 'spinning';
      this.x += this.spinDirection * 7.5 * dt;
      this.mesh.rotation.y += this.spinDirection * dt * 8;
      if (Math.abs(this.x) > 9.6) this.hp = 0;
    } else if (this.disruption > 0) {
      this.state = 'disrupted';
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.hostile && this.z > -48 && this.z < 8) {
      this.state = 'intercept';
      this.sway += dt;
      if (this.role === 'interceptor') {
        const target = clamp(playerX + Math.sin(this.sway * 2.1) * 1.0, -7.4, 7.4);
        this.x = approach(this.x, target, 0.7, dt);
      } else if (this.role === 'weaver') {
        this.x = clamp(this.x + Math.sin(this.sway * 5.0) * dt * 6, -7.4, 7.4);
      }
      // Armored blockers intentionally hold their lane.
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else {
      this.state = 'approach';
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    }
    this.mesh.position.set(this.x, 0.12, this.z);
  }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: this.halfWidth, halfLength: this.halfLength }; }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    this.mesh.traverse((item) => {
      if (item instanceof THREE.Mesh) {
        item.geometry.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        for (const m of materials) m.dispose();
      }
    });
  }
}
