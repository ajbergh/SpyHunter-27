import * as THREE from 'three';
import { PLAYER_Z } from '../core/logic';
import { sculptMesh, bodyPaint, glassPaint, addDecalBar, addWheelAssembly } from '../entities/VehicleSculpt';

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
    const white = bodyPaint(0xdbe4eb, true);
    const dark = new THREE.MeshStandardMaterial({ color: 0x182735, metalness: 0.48, roughness: 0.4 });
    const amber = new THREE.MeshStandardMaterial({ color: 0xffc26c, emissive: 0xff8b15, emissiveIntensity: 0.8 });
    const add = (size: [number, number, number], pos: [number, number, number], material: THREE.Material): THREE.Mesh => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      m.position.set(...pos);
      this.mesh.add(m);
      return m;
    };
    add([3.6, 2.65, 7.8], [0, 1.64, 0], white);
    // Fully sculpted tractor cab and panoramic glass over a contoured hood.
    sculptMesh(this.mesh, [
      { z: -6.0, halfWidth: 1.04, deck: 1.20, floor: 0.52 },
      { z: -5.68, halfWidth: 1.52, deck: 1.54, floor: 0.44 },
      { z: -5.05, halfWidth: 1.67, deck: 2.35, floor: 0.42 },
      { z: -4.33, halfWidth: 1.68, deck: 2.88, floor: 0.45 },
      { z: -3.35, halfWidth: 1.68, deck: 2.85, floor: 0.47 },
    ], white);
    sculptMesh(this.mesh, [
      { z: -5.37, halfWidth: 1.18, deck: 2.12, floor: 2.04 },
      { z: -5.08, halfWidth: 1.40, deck: 2.68, floor: 2.04 },
      { z: -4.21, halfWidth: 1.42, deck: 2.70, floor: 2.08 },
      { z: -3.96, halfWidth: 1.28, deck: 2.45, floor: 2.08 },
    ], glassPaint(0x163957));
    // Cargo body is intentionally rectangular, but acquires segmented,
    // pressed-metal walls rather than a single plain cuboid.
    add([3.52, 0.12, 7.9], [0, 3.02, 0], dark);
    add([3.28, 0.08, 7.55], [0, 3.12, 0], white);
    for (const side of [-1, 1]) {
      for (let z = -3.35; z <= 3.4; z += 0.75) {
        addDecalBar(this.mesh, [0.07, 2.22, 0.065],
          [side * 1.805, 1.77, z], z < -2.5 ? 0x77c4df : 0x93a7b5);
      }
      addDecalBar(this.mesh, [0.085, 0.12, 7.4], [side * 1.83, 2.83, 0], 0x25b6e0, true);
      addDecalBar(this.mesh, [0.085, 0.13, 7.4], [side * 1.83, 0.52, 0], 0x1e3545);
      addDecalBar(this.mesh, [0.36, 0.21, 0.15], [side * 1.22, 1.20, -5.99], 0xe5fbff, true);
      addDecalBar(this.mesh, [0.18, 0.12, 0.15], [side * 1.55, 0.84, -5.63], 0xffb945, true);
      for (const z of [-3.10, 2.90]) addWheelAssembly(this.mesh, side * 1.87, z, 0.65);
      add([0.23, 0.90, 0.26], [side * 1.72, 1.13, -4.68], dark);
      add([0.32, 0.10, 0.45], [side * 1.80, 1.52, -4.73], dark);
    }
    add([2.65, 0.22, 0.23], [0, 0.83, -6.10], dark);
    for (let x = -0.92; x <= 0.92; x += 0.31)
      add([0.075, 0.31, 0.09], [x, 1.13, -6.09], dark);
    add([1.9, 0.08, 0.34], [0, 2.97, -4.28], dark);
    // Self-illuminating cargo bay is visible during the door opening sequence.
    add([2.85, 0.06, 5.9], [0, 0.43, 0.61], dark);
    add([2.55, 0.07, 5.4], [0, 2.88, 0.6],
      new THREE.MeshStandardMaterial({
        color: 0x7ce8ff, emissive: 0x15b8e9, emissiveIntensity: 2.8,
      }));
    for (const side of [-1, 1]) {
      add([0.075, 1.65, 5.8], [side * 1.56, 1.56, 0.47],
        new THREE.MeshStandardMaterial({ color: 0x3c6a79, metalness: 0.8, roughness: 0.23 }));
    }

    add([2.75, 0.25, 0.3], [0, 2.9, 3.83], amber);
    add([2.8, 0.25, 0.3], [0, 0.95, 3.86], dark);
    const wheels = new THREE.MeshStandardMaterial({ color: 0x121821, roughness: 0.9 });
    for (const x of [-1.84, 1.84]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.25, 18), wheels);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.74, 1.58);
      wheel.castShadow = true;
      this.mesh.add(wheel);
    }
    this.ramp = add([3.05, 0.15, 3.2], [0, 0.58, 5.35], dark);
    // Crosshatched reflective loading ramp with grip strips and edge lighting.
    for (let z = 4.18; z < 6.7; z += 0.32) {
      addDecalBar(this.mesh, [2.72, 0.014, 0.075], [0, 0.66, z], 0x7896a0);
    }
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
