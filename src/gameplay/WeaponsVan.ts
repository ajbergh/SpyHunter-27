import * as THREE from 'three';
import { PLAYER_Z } from '../core/logic';

export type VanState = 'idle' | 'approaching' | 'docking';
export type VanEvent = 'docked' | 'missed' | 'align-lane' | 'adjust-speed' | null;

/** Animated support truck. The player must actually meet and align with the rear ramp. */
export class WeaponsVan {
  readonly mesh = new THREE.Group();
  private readonly ramp: THREE.Mesh;
  private readonly doorLeft: THREE.Mesh;
  private readonly doorRight: THREE.Mesh;
  private readonly beacon: THREE.Mesh;
  private elapsed = 0;
  private state: VanState = 'idle';
  private cooldown = 0;
  private dockTimer = 0;
  private approachHintGiven = false;
  private readonly lane = 6.4;

  constructor(scene: THREE.Scene) {
    const white = new THREE.MeshStandardMaterial({ color: 0xdbe4eb, metalness: 0.58, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x182735, metalness: 0.48, roughness: 0.4 });
    const amber = new THREE.MeshStandardMaterial({ color: 0xffc26c, emissive: 0xff8b15, emissiveIntensity: 0.8 });
    const add = (size: [number, number, number], pos: [number, number, number], material: THREE.Material): THREE.Mesh => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      m.position.set(...pos);
      this.mesh.add(m);
      return m;
    };
    add([3.6, 2.65, 7.8], [0, 1.64, 0], white);
    add([3.3, 1.55, 2.3], [0, 1.2, -4.35], dark);
    add([2.75, 0.25, 0.3], [0, 2.9, 3.83], amber);
    add([2.8, 0.25, 0.3], [0, 0.95, 3.86], dark);
    const wheels = new THREE.MeshStandardMaterial({ color: 0x121821, roughness: 0.9 });
    for (const x of [-1.84, 1.84]) {
      for (const z of [-3.15, 2.9]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.31, 12), wheels);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.74, z);
        this.mesh.add(wheel);
      }
    }
    this.ramp = add([3.05, 0.15, 3.2], [0, 0.58, 5.35], dark);
    this.ramp.rotation.x = -0.06;
    this.doorLeft = add([1.45, 1.9, 0.12], [-0.76, 1.63, 3.91], dark);
    this.doorRight = add([1.45, 1.9, 0.12], [0.76, 1.63, 3.91], dark);
    this.beacon = add([1.2, 0.25, 0.6], [0, 3.05, -1.5], amber);
    this.mesh.position.set(this.lane, 0, -85);
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  get status(): string {
    if (this.state === 'approaching') return 'APPROACH';
    if (this.state === 'docking') return 'RESUPPLY';
    return this.cooldown > 0 ? 'COOLDOWN ' + Math.ceil(this.cooldown) + 's' : 'READY [F]';
  }

  get isDocking(): boolean { return this.state === 'docking'; }
  get progress(): number { return this.state === 'docking' ? 1 - Math.max(0, this.dockTimer) / 1.3 : 0; }

  reset(): void {
    this.state = 'idle';
    this.cooldown = 0;
    this.elapsed = 0;
    this.dockTimer = 0;
    this.approachHintGiven = false;
    this.ramp.rotation.x = -0.06;
    this.doorLeft.rotation.y = 0;
    this.doorRight.rotation.y = 0;
    this.mesh.visible = false;
    this.mesh.position.set(this.lane, 0, -85);
  }

  call(): boolean {
    if (this.state !== 'idle' || this.cooldown > 0) return false;
    this.state = 'approaching';
    this.mesh.visible = true;
    this.mesh.position.set(this.lane, 0, -85);
    this.ramp.rotation.x = -0.06;
    this.doorLeft.rotation.y = 0;
    this.doorRight.rotation.y = 0;
    this.cooldown = 45;
    this.approachHintGiven = false;
    return true;
  }

  step(dt: number, playerSpeed: number, playerX: number): VanEvent {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.elapsed += dt;
    this.beacon.scale.x = 0.8 + Math.abs(Math.sin(this.elapsed * 5)) * 0.5;
    if (this.state === 'idle') return null;
    if (this.state === 'docking') {
      this.mesh.position.z += Math.min(22, playerSpeed * 0.5) * dt;
      this.ramp.rotation.x = Math.min(0.6, this.ramp.rotation.x + dt * 1.4);
      this.doorLeft.rotation.y = Math.max(0, this.doorLeft.rotation.y - dt * 0.8);
      this.doorRight.rotation.y = Math.min(0, this.doorRight.rotation.y + dt * 0.8);
      this.dockTimer -= dt;
      if (this.dockTimer <= 0) {
        this.state = 'idle';
        this.mesh.visible = false;
      }
      return null;
    }
    this.mesh.position.z += Math.max(11, playerSpeed - 11) * dt;
    if (this.mesh.position.z > -45) {
      this.ramp.rotation.x = Math.min(0.12, this.ramp.rotation.x + dt * 0.7);
      this.doorLeft.rotation.y = Math.min(Math.PI / 2, this.doorLeft.rotation.y + dt * 1.4);
      this.doorRight.rotation.y = Math.max(-Math.PI / 2, this.doorRight.rotation.y - dt * 1.4);
    }
    // Trigger only when the player's nose is aligned with the exposed loading ramp.
    const rearZ = this.mesh.position.z + 5.6;
    const atRamp = Math.abs(rearZ - (PLAYER_Z - 2.1)) < 2.4;
    const aligned = Math.abs(playerX - this.lane) < 1.45;
    const speedCorrect = playerSpeed >= 15 && playerSpeed <= 49;
    if (atRamp && aligned && speedCorrect) {
      this.state = 'docking';
      this.dockTimer = 1.3;
      return 'docked';
    }
    if (atRamp && !this.approachHintGiven) {
      this.approachHintGiven = true;
      return !aligned ? 'align-lane' : 'adjust-speed';
    }
    if (this.mesh.position.z > PLAYER_Z + 17) {
      this.state = 'idle';
      this.mesh.visible = false;
      return 'missed';
    }
    return null;
  }
}
