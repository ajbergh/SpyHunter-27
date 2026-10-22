import * as THREE from 'three';
import { approach, clamp, PLAYER_Z, type RectHitbox } from '../core/logic';
import { makeTrafficVehicle } from './VehicleModels';
import { VehicleMotionRig } from './VehicleMotion';
import { VehicleDamageFeedback } from './VehicleDamageFeedback';
import type { SquadOrder } from '../gameplay/SquadTactics';

export type EnemyRole = 'civilian' | 'interceptor' | 'weaver' | 'blocker' | 'enforcer' | 'motorcycle' | 'boat' | 'switchblade' | 'head-on' | 'rear-pursuer';
export type EnemyState = 'approach' | 'intercept' | 'disrupted' | 'spinning' | 'retreating' | 'pursuing' | 'overtaking' | 'screening' | 'pressuring';

export class TrafficVehicle {
  readonly mesh: THREE.Group;
  private readonly motion: VehicleMotionRig;
  readonly damageFeedback: VehicleDamageFeedback;
  private lastHp: number;
  private readonly maxHp: number;
  readonly hostile: boolean;
  readonly oncoming: boolean;
  readonly rearPursuer: boolean;
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
  private passingLane: number | null = null;

  constructor(scene: THREE.Scene, x: number, z: number, hostile: boolean, variant: number, color: number, speed: number, squadId: number | null = null, oncoming = false, rearPursuer = false) {
    this.squadId = squadId;
    this.hostile = hostile;
    this.oncoming = hostile && oncoming;
    this.rearPursuer = hostile && !this.oncoming && rearPursuer;
    if (this.oncoming) this.fireClock = 0.66;
    this.role = !hostile ? 'civilian' : this.oncoming ? 'head-on' : this.rearPursuer ? 'rear-pursuer' : variant === 6 ? 'switchblade' : variant === 5 ? 'boat' : variant === 4 ? 'motorcycle' : variant === 3 ? 'enforcer' : variant === 2 ? 'blocker' : variant === 1 ? 'weaver' : 'interceptor';
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.spinDirection = x >= 0 ? 1 : -1;
    this.halfWidth = variant === 6 ? 1.82 : variant === 5 ? 1.1 : variant === 4 ? 0.63 : variant === 2 ? 1.4 : variant === 1 ? 0.95 : 1.13;
    this.halfLength = variant === 5 ? 2.52 : variant === 4 ? 1.65 : variant === 3 ? 3.32 : variant === 2 ? 3.05 : variant === 1 ? 1.98 : 2.37;
    this.hp = hostile && variant === 2 ? 4 : hostile && variant === 4 ? 1 : hostile ? 2 : 1;
    this.maxHp = this.hp;
    this.lastHp = this.hp;
    const vehicle = makeTrafficVehicle(hostile, color, variant);
    if (this.oncoming) {
      // Rotate the real model (not the AI steering group) 180 degrees toward
      // the player, preserving collision width and independent steering sway.
      const facing = new THREE.Group();
      facing.rotation.y = Math.PI;
      facing.name = 'HeadOnFacing';
      facing.add(vehicle);
      this.mesh = new THREE.Group();
      this.mesh.add(facing);
    } else this.mesh = vehicle;
    this.motion = new VehicleMotionRig(this.mesh);
    this.damageFeedback = new VehicleDamageFeedback(this.mesh);
    this.mesh.position.set(x, 0.12, z);
    scene.add(this.mesh);
  }

  recordImpact(): void {
    this.lastHp = this.hp;
    this.damageFeedback.hit();
    this.damageFeedback.step(0, this.hp, this.maxHp);
  }

  disrupt(seconds: number): void { this.disruption = Math.max(this.disruption, seconds); }

  spinOut(seconds: number): void {
    this.spinTimer = Math.max(this.spinTimer, seconds);
    this.disruption = Math.max(this.disruption, seconds);
  }

  step(dt: number, playerSpeed: number, playerX: number, order?: SquadOrder, playerZ = PLAYER_Z): void {
    if (this.hp < this.lastHp) this.damageFeedback.hit();
    this.lastHp = this.hp;
    this.damageFeedback.step(dt, this.hp, this.maxHp);
    const previousX = this.x;
    this.spinTimer = Math.max(0, this.spinTimer - dt);
    this.disruption = Math.max(0, this.disruption - dt);
    this.fireClock = Math.max(0, this.fireClock - dt);
    const fleeing = (order?.type === 'retreat' || this.state === 'retreating') &&
      this.spinTimer <= 0 && this.disruption <= 0;
    if (fleeing) this.z -= Math.max(20, 19 + this.speed * 0.55) * dt;
    else if (this.oncoming) this.z += (playerSpeed + this.speed * (this.disruption > 0 ? 0.55 : 1)) * dt;
    else this.z += (playerSpeed - this.speed * (this.disruption > 0 ? 0.5 : 1)) * dt;
    // Signed relative speed matters: fast traffic can pull away when braking,
    // and a fast rear attacker closes in from the back unless outrun in High.
    if (this.spinTimer > 0) {
      this.state = 'spinning';
      this.x += this.spinDirection * 7.5 * dt;
      this.mesh.rotation.y += this.spinDirection * dt * 8;
      if (Math.abs(this.x) > 9.6) this.hp = 0;
    } else if (this.disruption > 0) {
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.state = 'disrupted';
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (fleeing) {
      this.state = 'retreating';
      const escapeSide = this.x < 0 ? -7.5 : 7.5;
      this.x = approach(this.x, order?.targetX ?? escapeSide, 2.4, dt);
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.rearPursuer && order?.type === 'hold-lane') {
      // Coordinated two-direction attack: hold the assigned outer lane, even
      // when the player steers. The neutral center corridor must remain open.
      this.state = 'pressuring';
      this.x = approach(this.x, order.targetX, 1.3, dt);
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.rearPursuer && this.z > playerZ - 18 && this.z < playerZ + 48) {
      // Commit to one safe passing lane when first given a flank order.
      // Never dynamically follow a dodging player across multiple lanes.
      if (this.passingLane === null && order?.type === 'overtake')
        this.passingLane = order.targetX;
      this.state = this.passingLane === null ? 'pursuing' : 'overtaking';
      this.x = approach(this.x,
        this.passingLane ?? clamp(playerX, -6.4, 6.4),
        this.passingLane === null ? 0.45 : 1.65, dt);
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.rearPursuer && this.passingLane !== null &&
               this.z <= playerZ - 18) {
      // Once a flank passes the player by 18 units it stays in the forward
      // screening phase until it exits the road. Do not accidentally fall
      // through to ordinary 'intercept' AI at 52 units of separation, since
      // that changes its warning and undermines the committed lane maneuver.
      // Only approach the player's forward lane while the car is still close
      // enough for an observable, avoidable cut-in.
      this.state = 'screening';
      if (this.z > playerZ - 52) {
        this.x = approach(this.x, clamp(playerX, -6.4, 6.4), 0.19, dt);
      }
      this.mesh.rotation.z = approach(this.mesh.rotation.z, 0, 5, dt);
      this.mesh.rotation.y = approach(this.mesh.rotation.y, 0, 4, dt);
    } else if (this.hostile && this.z > playerZ - 59 && this.z < playerZ - 3) {
      this.state = 'intercept';
      this.sway += dt;
      if (this.oncoming) {
        // Facing against traffic: commit to a predictable lane attack with a
        // restrained aim bias, preserving lateral evasion time for the player.
        this.x = approach(this.x, clamp(playerX, -6.4, 6.4), 0.55, dt);
      } else if (order?.type === 'pincer') {
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
    // Cosmetic wheel spin uses the vehicle's own velocity, not relative road
    // scroll. Disrupted cars illuminate their brakes; boats have no wheel rig.
    this.motion.step(dt, this.speed,
      (this.x - previousX) / Math.max(0.001, dt * 12),
      this.disruption > 0 || this.spinTimer > 0);
  }

  /** Enforcer rounds fire only from a stable attack lane and respect smoke/oil disruption. */
  tryFire(playerX: number, playerZ = PLAYER_Z): boolean {
    const faceAttack = this.role === 'head-on';
    if ((this.role !== 'enforcer' && this.role !== 'boat' && !faceAttack) ||
        this.state !== 'intercept' || this.fireClock > 0 ||
        this.z < playerZ - (faceAttack ? 44 : 49) ||
        this.z > playerZ - (faceAttack ? 13 : 17) ||
        Math.abs(this.x - playerX) > (faceAttack ? 4.5 : 6.5)) return false;
    this.fireClock = faceAttack ? 2.8 : 2.4;
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
