import * as THREE from 'three';

interface Wheel {
  readonly pivot: THREE.Group;
  readonly radius: number;
  readonly front: boolean;
}
interface BrakeLamp {
  readonly material: THREE.MeshStandardMaterial;
  readonly idle: number;
}

/**
 * Cosmetic-only drivetrain for the fixed-step arcade simulation. Wheel and
 * lamp references are discovered once when each vehicle spawns, never while
 * rendering. Independent of Three.js frame rate and collision/AI state.
 */
export class VehicleMotionRig {
  private readonly wheels: Wheel[] = [];
  private readonly lamps: BrakeLamp[] = [];
  private travelled = 0;

  constructor(vehicle: THREE.Group) {
    vehicle.traverse(node => {
      if (node instanceof THREE.Group &&
          (node.name === 'FrontWheelPivot' || node.name === 'RearWheelPivot')) {
        const radius: unknown = node.userData.wheelRadius;
        if (typeof radius === 'number' && Number.isFinite(radius) && radius > 0) {
          this.wheels.push({ pivot: node, radius, front: node.name === 'FrontWheelPivot' });
        }
      } else if (node instanceof THREE.Mesh &&
                 node.name === 'BrakeLamp' &&
                 node.material instanceof THREE.MeshStandardMaterial) {
        this.lamps.push({ material: node.material, idle: node.material.emissiveIntensity });
      }
    });
  }

  get wheelCount(): number { return this.wheels.length; }
  get brakeLampCount(): number { return this.lamps.length; }

  /** dt is fixed simulation time, speed is world-space metres per second. */
  step(dt: number, speed: number, steer = 0, braking = false): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const frame = Math.min(dt, 0.05);
    const speedNow = Number.isFinite(speed) ? Math.max(0, speed) : 0;
    const steering = Number.isFinite(steer) ? Math.max(-1, Math.min(1, steer)) : 0;
    this.travelled += speedNow * frame;
    const blend = Math.min(1, frame * 12);
    for (const wheel of this.wheels) {
      wheel.pivot.rotation.x = -this.travelled / wheel.radius;
      const target = wheel.front ? steering * 0.26 : 0;
      wheel.pivot.rotation.y += (target - wheel.pivot.rotation.y) * blend;
    }
    for (const lamp of this.lamps) {
      const goal = braking ? Math.max(lamp.idle, 2.8) : lamp.idle;
      lamp.material.emissiveIntensity += (goal - lamp.material.emissiveIntensity) *
        Math.min(1, frame * 20);
    }
  }

  reset(): void {
    this.travelled = 0;
    for (const wheel of this.wheels) wheel.pivot.rotation.set(0, 0, 0);
    for (const lamp of this.lamps) lamp.material.emissiveIntensity = lamp.idle;
  }
}
