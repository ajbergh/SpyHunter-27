import * as THREE from 'three';
import { PLAYER_Z } from '../core/logic';

export type VanState = 'idle' | 'approaching' | 'docking';

/** Animated support truck. The player must actually meet and align with the rear ramp. */
export class WeaponsVan {
  readonly mesh = new THREE.Group();
  private readonly ramp: THREE.Mesh;
  private state: VanState = 'idle';
  private cooldown = 0;
  private dockTimer = 0;
  private readonly lane = 6.4;

  constructor(private readonly scene: THREE.Scene) {
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

  reset(): void {
    this.state = 'idle';
    this.cooldown = 0;
    this.mesh.visible = false;
    this.mesh.position.set(this.lane, 0, -85);
  }

  call(): boolean {
    if (this.state !== 'idle' || this.cooldown > 0) return false;
    this.state = 'approaching';
    this.mesh.visible = true;
    this.mesh.position.set(this.lane, 0, -85);
    this.ramp.rotation.x = -0.06;
    this.cooldown = 45;
    return true;
  }

  step(dt: number, playerSpeed: number, playerX: number): 'docked' | 'missed' | null {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.state === 'idle') return null;
    if (this.state === 'docking') {
      this.dockTimer -= dt;
      if (this.dockTimer <= 0) {
        this.state = 'idle';
        this.mesh.visible = false;
      }
      return null;
    }
    this.mesh.position.z += Math.max(11, playerSpeed - 11) * dt;
    if (this.mesh.position.z > -45) this.ramp.rotation.x = Math.min(0.12, this.ramp.rotation.x + dt * 0.7);
    // Trigger only when the player's nose is aligned with the exposed loading ramp.
    const rearZ = this.mesh.position.z + 5.6;
    if (Math.abs(rearZ - (PLAYER_Z - 2.1)) < 2.4 &&
        Math.abs(playerX - this.lane) < 1.45 && playerSpeed >= 15 && playerSpeed <= 49) {
      this.state = 'docking';
      this.dockTimer = 1.3;
      return 'docked';
    }
    if (this.mesh.position.z > PLAYER_Z + 17) {
      this.state = 'idle';
      this.mesh.visible = false;
      return 'missed';
    }
    return null;
  }
}
