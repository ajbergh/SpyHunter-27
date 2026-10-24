import * as THREE from 'three';
import type { Controls } from '../core/Input';
import { approach, clamp, ROAD_HALF_WIDTH, type RectHitbox } from '../core/logic';
import { makeInterceptor, makeSpeedboat } from './VehicleModels';
import { VehicleMotionRig } from './VehicleMotion';
import { VehicleDamageFeedback } from './VehicleDamageFeedback';
import { damagedHeadlampFactors } from '../rendering/HeadlightDamage';
import { SuspensionDynamics } from './SuspensionDynamics';
import type { Biome } from '../world/WorldPlan';
import { drivingTargetZ, DRIVE_Z_NEUTRAL } from '../gameplay/LongitudinalDriving';
import { INITIAL_GEAR, nextGear, transmissionResponse, type DriveGear } from '../gameplay/Transmission';

export class Player {
  readonly mesh = new THREE.Group();
  private readonly car = makeInterceptor();
  private readonly carMotion = new VehicleMotionRig(this.car);
  private readonly suspension = new SuspensionDynamics();
  private readonly boat = makeSpeedboat(false);
  private readonly carWear = new VehicleDamageFeedback(this.car);
  private readonly boatWear = new VehicleDamageFeedback(this.boat);
  private readonly headlampLeft: THREE.MeshStandardMaterial;
  private readonly headlampRight: THREE.MeshStandardMaterial;
  private readonly headlampLeftOriginal: number;
  private readonly headlampRightOriginal: number;
  private wear = 0;
  private impactSide = 0;
  isBoat = false;
  gear: DriveGear = INITIAL_GEAR;
  private elapsed = 0;
  private lateralVelocity = 0;
  x = 0;
  z = DRIVE_Z_NEUTRAL;
  speed = 25;
  invulnerability = 0;

  constructor(scene: THREE.Scene) {
    const left = this.car.getObjectByName('FrontHeadlampLeft');
    const right = this.car.getObjectByName('FrontHeadlampRight');
    if (!(left instanceof THREE.Mesh) || !(right instanceof THREE.Mesh) ||
        !(left.material instanceof THREE.MeshStandardMaterial) ||
        !(right.material instanceof THREE.MeshStandardMaterial))
      throw new Error('Interceptor headlamp model must expose independent emissive materials');
    this.headlampLeft = left.material;
    this.headlampRight = right.material;
    this.headlampLeftOriginal = this.headlampLeft.emissiveIntensity;
    this.headlampRightOriginal = this.headlampRight.emissiveIntensity;
    this.mesh.add(this.car, this.boat);
    this.setBoat(false);
    this.mesh.position.set(0, 0.12, DRIVE_Z_NEUTRAL);
    scene.add(this.mesh);
  }

  reset(): void {
    this.x = 0;
    this.z = DRIVE_Z_NEUTRAL;
    this.speed = 25;
    this.gear = INITIAL_GEAR;
    this.invulnerability = 0;
    this.mesh.visible = true;
    this.wear = 0;
    this.impactSide = 0;
    this.carWear.reset();
    this.boatWear.reset();
    this.updateHeadlamps();
    this.elapsed = 0;
    this.lateralVelocity = 0;
    this.carMotion.reset();
    this.suspension.reset();
    this.car.rotation.x = 0;
    this.car.rotation.z = 0;
    this.car.position.y = 0;
    this.setBoat(false);
    this.mesh.position.set(0, 0.12, DRIVE_Z_NEUTRAL);
  }

  setBoat(enabled: boolean): void {
    if (enabled !== this.isBoat) {
      this.suspension.reset();
      this.car.rotation.x = 0;
      this.car.rotation.z = 0;
      this.car.position.y = 0;
    }
    if (enabled) this.gear = INITIAL_GEAR;
    this.isBoat = enabled;
    this.car.visible = !enabled;
    this.boat.visible = enabled;
  }

  /** Visual-only cumulative wear per impact, independent of remaining lives.
   *  Extra-life pickups do not magically repair the original bodywork; a new
   *  run restores pristine paint and geometry.
   */
  takeImpact(side = 0): void {
    this.wear = Math.min(3, this.wear + 1);
    this.impactSide = Number.isFinite(side) ? Math.sign(side) : 0;
    this.carWear.hit(this.impactSide);
    this.boatWear.hit(this.impactSide);
    this.carWear.step(0, 3 - this.wear, 3);
    this.boatWear.step(0, 3 - this.wear, 3);
    this.updateHeadlamps();
  }

  private updateHeadlamps(): void {
    const lamps = damagedHeadlampFactors(this.wear, this.impactSide);
    this.headlampLeft.emissiveIntensity = this.headlampLeftOriginal * lamps.left;
    this.headlampRight.emissiveIntensity = this.headlampRightOriginal * lamps.right;
  }

  get damageStage(): number { return this.wear; }
  get damageSide(): number { return this.impactSide; }
  get carDamagedPanelCount(): number { return this.carWear.sculptedPanelCount; }
  get boatDamagedPanelCount(): number { return this.boatWear.sculptedPanelCount; }

  shiftGear(): DriveGear | null {
    if (this.isBoat) return null;
    this.gear = nextGear(this.gear);
    return this.gear;
  }

  step(dt: number, controls: Controls, surface: Biome = 'forest', speedScale = 1, reducedMotion = false): void {
    this.elapsed += dt;
    const previousSpeed = this.speed;
    const response = this.isBoat
      ? { targetSpeed: controls.brake ? 13 : controls.throttle ? 46 : 29,
          responseRate: controls.brake ? 4.2 : 1.6 }
      : transmissionResponse(this.gear, this.speed / Math.max(0.2, speedScale),
        controls.throttle, controls.brake);
    this.speed = approach(this.speed, response.targetSpeed * speedScale, response.responseRate, dt);
    // The original arcade feel: accelerating climbs toward the screen horizon;
    // braking drops the actual vehicle back. Hitboxes/weapons use this same Z.
    this.z = approach(this.z, drivingTargetZ(this.speed, this.isBoat, speedScale), 2.6, dt);
    this.mesh.position.z = this.z;
    const steerSpeed = (this.isBoat ? 8.0 : 10.0) + this.speed * 0.065;
    // Icy roads retain lateral momentum; boats bank more softly than cars.
    const traction = surface === 'snow' ? 2.2 : this.isBoat ? 5.5 : 19;
    this.lateralVelocity = approach(this.lateralVelocity, controls.steer * steerSpeed, traction, dt);
    const nextX = clamp(this.x + this.lateralVelocity * dt, -ROAD_HALF_WIDTH + 1.45, ROAD_HALF_WIDTH - 1.45);
    if (nextX !== this.x + this.lateralVelocity * dt) this.lateralVelocity = 0;
    this.x = nextX;
    this.mesh.position.x = approach(this.mesh.position.x, this.x, 24, dt);
    this.mesh.rotation.z = approach(this.mesh.rotation.z, -controls.steer * 0.075, 9, dt);
    this.mesh.rotation.y = approach(this.mesh.rotation.y, controls.steer * (this.isBoat ? 0.09 : 0.035), 8, dt);
    this.mesh.position.y = this.isBoat ? 0.16 + Math.sin(this.elapsed * 8) * 0.12 : 0.12;
    if (!this.isBoat) {
      this.carMotion.step(dt, this.speed, controls.steer, controls.brake);
      // Separate, physically inspired springs affect the visible chassis
      // only, never the player coordinates or collision geometry.
      const acceleration = dt > 0 && Number.isFinite(dt)
        ? (this.speed - previousSpeed) / dt : 0;
      this.suspension.step(dt, acceleration, controls.steer,
        controls.brake, this.speed, reducedMotion);
      this.car.rotation.x = this.suspension.pitch;
      this.car.rotation.z = this.suspension.roll;
      this.car.position.y = this.suspension.heave;
    } else {
      this.suspension.reset();
      this.car.rotation.x = 0;
      this.car.rotation.z = 0;
      this.car.position.y = 0;
    }
    if (this.wear > 0 || this.carWear.flashing || this.boatWear.flashing) {
      this.carWear.step(dt, 3 - this.wear, 3);
      this.boatWear.step(dt, 3 - this.wear, 3);
    }
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.mesh.visible = this.invulnerability === 0 || Math.floor(this.invulnerability * 12) % 2 === 0;
  }

  get chassisPitch(): number { return this.car.rotation.x; }
  get chassisRoll(): number { return this.car.rotation.z; }
  get chassisHeave(): number { return this.car.position.y; }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: 1.03, halfLength: 2.16 }; }
}
