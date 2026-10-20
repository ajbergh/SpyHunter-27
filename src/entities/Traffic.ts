import * as THREE from 'three';
import { approach, clamp, type RectHitbox } from '../core/logic';
import { makeTrafficVehicle } from './VehicleModels';
import type { SquadOrder } from '../gameplay/SquadTactics';

export type EnemyRole = 'civilian' | 'interceptor' | 'weaver' | 'blocker' | 'enforcer' | 'motorcycle' | 'boat' | 'switchblade';
export type EnemyState = 'approach' | 'intercept' | 'disrupted' | 'spinning';

export class TrafficVehicle {
  readonly mesh: THREE.Group;
  readonly hostile: boolean;
  readonly role: EnemyRole;
  readonly halfWidth: number;
  readonly halfLength: number;
  readonly speed: number;
  readonly squadId: number | null;
  hp: number;
  x: number;
  z: number;
  state: EnemyState = 'approach';
  private sway = 0;
  private fireClock = 1.3;
  private spinTimer = 0;
  private disruption = 0;
  private spinDirection: number;

  constructor(scene: THREE.Scene, x: number, z: number, hostile: boolean, variant: number, color: number, speed: number, squadId: number | null = null) {
    this.squadId = squadId;
    this.hostile = hostile;
    this.role = !hostile ? 'civilian' : variant === 6 ? 'switchblade' : variant === 5 ? 'boat' : variant === 4 ? 'motorcycle' : variant === 3 ? 'enforcer' : variant === 2 ? 'blocker' : variant === 1 ? 'weaver' : 'interceptor';
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.spinDirection = x >= 0 ? 1 : -1;
    this.halfWidth = variant === 6 ? 1.82 : variant === 5 ? 1.1 : variant === 4 ? 0.63 : variant === 2 ? 1.4 : variant === 1 ? 0.95 : 1.13;
    this.halfLength = variant === 5 ? 2.52 : variant === 4 ? 1.65 : variant === 3 ? 3.32 : variant === 2 ? 3.05 : variant === 1 ? 1.98 : 2.37;
    this.hp = hostile && variant === 2 ? 4 : hostile && variant === 4 ? 1 : hostile ? 2 : 1;
    this.mesh = makeTrafficVehicle(hostile, color, variant);
    this.mesh.position.set(x, 0.12, z);
    scene.add(this.mesh);
  }

  disrupt(seconds: number): void { this.disruption = Math.max(this.disruption, seconds); }

  spinOut(seconds: number): void {
    this.spinTimer = Math.max(this.spinTimer, seconds);
    this.disruption = Math.max(this.disruption, seconds);
  }

  step(dt: number, playerSpeed: number, playerX: number, order?: SquadOrder): void {
    this.spinTimer = Math.max(0, this.spinTimer - dt);
    this.disruption = Math.max(0, this.disruption - dt);
    this.fireClock = Math.max(0, this.fireClock - dt);
    this.z += Math.max(8, playerSpeed - this.speed * (this.disruption > 0 ? 0.5 : 1)) * dt;
    if (this.spinTimer > 0) {
      this.state = 'spinning';
      this.x += this.spinDirection * 7.5 * dt;
      this.mesh.rotation.y += this.spinDirection * dt * 8;
      if (Math.abs(this.x) > 9.6) this.hp = 0;
    } else if (this.disruption > 0) {
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.state = 'disrupted';
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.hostile && this.z > -48 && this.z < 8) {
      this.state = 'intercept';
      this.sway += dt;
      if (order?.type === 'pincer') {
        this.x = clamp(approach(this.x, order.targetX,
          this.role === 'switchblade' ? 1.5 : 1.05, dt), -7.4, 7.4);
        this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      } else if (this.role === 'interceptor') {
        const target = clamp(playerX + Math.sin(this.sway * 2.1) * 1.0, -7.4, 7.4);
        this.x = approach(this.x, target, 0.7, dt);
      } else if (this.role === 'enforcer') {
        this.x = approach(this.x, clamp(playerX, -6.4, 6.4), 0.15, dt);
      } else if (this.role === 'weaver') {
        this.x = clamp(this.x + Math.sin(this.sway * 5.0) * dt * 6, -7.4, 7.4);
      } else if (this.role === 'switchblade') {
        const target = clamp(playerX + Math.sin(this.sway * 4.1) * 0.5, -7.0, 7.0);
        this.x = approach(this.x, target, 1.3, dt);
        this.mesh.rotation.z = approach(this.mesh.rotation.z, Math.sin(this.sway * 4.1) * 0.04, 5, dt);
      } else if (this.role === 'boat') {
        this.x = clamp(this.x + Math.sin(this.sway * 3.2) * dt * 4.4, -7.1, 7.1);
        this.mesh.position.y = 0.16 + Math.sin(this.sway * 6.5) * 0.1;
      } else if (this.role === 'motorcycle') {
        // A narrow high-frequency slalom, with slight pursuit bias.
        this.x = clamp(this.x + (Math.sin(this.sway * 8) * 10 +
          clamp(playerX - this.x, -3, 3) * 0.28) * dt, -7.8, 7.8);
        this.mesh.rotation.z = Math.sin(this.sway * 8) * -0.13;
      }
      // Armored blockers intentionally hold their lane.
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else {
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.state = 'approach';
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    }
    this.mesh.position.set(this.x, 0.12, this.z);
  }

  /** Enforcer rounds fire only from a stable attack lane and respect smoke/oil disruption. */
  tryFire(playerX: number): boolean {
    if ((this.role !== 'enforcer' && this.role !== 'boat') || this.state !== 'intercept' ||
        this.fireClock > 0 || this.z < -38 || this.z > -6 ||
        Math.abs(this.x - playerX) > 6.5) return false;
    this.fireClock = 2.4;
    return true;
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
