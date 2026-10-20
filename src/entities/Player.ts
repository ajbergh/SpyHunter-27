import * as THREE from 'three';
import type { Controls } from '../core/Input';
import { approach, clamp, PLAYER_Z, ROAD_HALF_WIDTH, type RectHitbox } from '../core/logic';
import { makeInterceptor, makeSpeedboat } from './VehicleModels';

export class Player {
  readonly mesh = new THREE.Group();
  private readonly car = makeInterceptor();
  private readonly boat = makeSpeedboat(false);
  isBoat = false;
  private elapsed = 0;
  x = 0;
  speed = 25;
  invulnerability = 0;

  constructor(scene: THREE.Scene) {
    this.mesh.add(this.car, this.boat);
    this.setBoat(false);
    this.mesh.position.set(0, 0.12, PLAYER_Z);
    scene.add(this.mesh);
  }

  reset(): void {
    this.x = 0;
    this.speed = 25;
    this.invulnerability = 0;
    this.mesh.visible = true;
    this.elapsed = 0;
    this.setBoat(false);
    this.mesh.position.set(0, 0.12, PLAYER_Z);
  }

  setBoat(enabled: boolean): void {
    this.isBoat = enabled;
    this.car.visible = !enabled;
    this.boat.visible = enabled;
  }

  step(dt: number, controls: Controls): void {
    this.elapsed += dt;
    const desired = this.isBoat
      ? controls.brake ? 13 : controls.throttle ? 46 : 29
      : controls.brake ? 10 : controls.throttle ? 54 : 30;
    this.speed = approach(this.speed, desired, controls.brake ? 4.2 : 1.6, dt);
    const steerSpeed = (this.isBoat ? 8.0 : 10.0) + this.speed * 0.065;
    this.x = clamp(this.x + controls.steer * steerSpeed * dt, -ROAD_HALF_WIDTH + 1.45, ROAD_HALF_WIDTH - 1.45);
    this.mesh.position.x = approach(this.mesh.position.x, this.x, 24, dt);
    this.mesh.rotation.z = approach(this.mesh.rotation.z, -controls.steer * 0.075, 9, dt);
    this.mesh.rotation.y = approach(this.mesh.rotation.y, controls.steer * (this.isBoat ? 0.09 : 0.035), 8, dt);
    this.mesh.position.y = this.isBoat ? 0.16 + Math.sin(this.elapsed * 8) * 0.12 : 0.12;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.mesh.visible = this.invulnerability === 0 || Math.floor(this.invulnerability * 12) % 2 === 0;
  }

  hitbox(): RectHitbox { return { x: this.x, z: PLAYER_Z, halfWidth: 1.03, halfLength: 2.16 }; }
}
