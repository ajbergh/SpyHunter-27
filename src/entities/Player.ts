import * as THREE from 'three';
import type { Controls } from '../core/Input';
import { approach, clamp, ROAD_HALF_WIDTH, type RectHitbox } from '../core/logic';
import { makeInterceptor, makeSpeedboat } from './VehicleModels';
import { VehicleMotionRig } from './VehicleMotion';
import type { Biome } from '../world/WorldPlan';
import { drivingTargetZ, DRIVE_Z_NEUTRAL } from '../gameplay/LongitudinalDriving';
import { INITIAL_GEAR, nextGear, transmissionResponse, type DriveGear } from '../gameplay/Transmission';

export class Player {
  readonly mesh = new THREE.Group();
  private readonly car = makeInterceptor();
  private readonly carMotion = new VehicleMotionRig(this.car);
  private readonly boat = makeSpeedboat(false);
  isBoat = false;
  gear: DriveGear = INITIAL_GEAR;
  private elapsed = 0;
  private lateralVelocity = 0;
  x = 0;
  z = DRIVE_Z_NEUTRAL;
  speed = 25;
  invulnerability = 0;

  constructor(scene: THREE.Scene) {
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
    this.elapsed = 0;
    this.lateralVelocity = 0;
    this.carMotion.reset();
    this.car.rotation.x = 0;
    this.setBoat(false);
    this.mesh.position.set(0, 0.12, DRIVE_Z_NEUTRAL);
  }

  setBoat(enabled: boolean): void {
    if (enabled) this.gear = INITIAL_GEAR;
    this.isBoat = enabled;
    this.car.visible = !enabled;
    this.boat.visible = enabled;
  }

  shiftGear(): DriveGear | null {
    if (this.isBoat) return null;
    this.gear = nextGear(this.gear);
    return this.gear;
  }

  step(dt: number, controls: Controls, surface: Biome = 'forest', speedScale = 1, reducedMotion = false): void {
    this.elapsed += dt;
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
      // Cosmetic chassis loading adds braking/acceleration weight without
      // influencing collision geometry; reduced motion suppresses the tilt.
      const pitch = reducedMotion ? 0 : controls.brake ? -0.035 : controls.throttle ? 0.014 : 0;
      this.car.rotation.x = reducedMotion ? 0 : approach(this.car.rotation.x, pitch, 0.4, dt);
    } else {
      this.car.rotation.x = 0;
    }
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.mesh.visible = this.invulnerability === 0 || Math.floor(this.invulnerability * 12) % 2 === 0;
  }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: 1.03, halfLength: 2.16 }; }
}
