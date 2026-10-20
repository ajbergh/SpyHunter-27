import * as THREE from 'three';
import { intersects, type RectHitbox } from '../core/logic';

export type WaterHazardEvent = { kind: 'barrel-destroyed' | 'barrel-impact'; x: number; z: number };
type Barrel = { group: THREE.Group; x: number; z: number };

/** Floating explosive barrels: physically dodgeable and destroyable by player fire. */
export class WaterHazards {
  private readonly barrels: Barrel[] = [];
  private spawnClock = 1.8;
  private readonly lanes = [-6.1, -2.3, 2.3, 6.1];

  constructor(private readonly scene: THREE.Scene, private readonly random: () => number = Math.random) {}

  get count(): number { return this.barrels.length; }

  reset(): void {
    for (const barrel of this.barrels) this.removeMesh(barrel);
    this.barrels.length = 0;
    this.spawnClock = 1.8;
  }

  step(
    dt: number,
    playerSpeed: number,
    player: RectHitbox,
    bulletHit: (target: RectHitbox) => boolean,
  ): WaterHazardEvent[] {
    const events: WaterHazardEvent[] = [];
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      if (this.barrels.length < 8) this.spawn();
      this.spawnClock = 2.7 + this.random() * 1.4;
    }
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const barrel = this.barrels[i];
      barrel.z += playerSpeed * dt;
      barrel.group.position.z = barrel.z;
      barrel.group.rotation.y += dt * 1.1;
      const hitbox: RectHitbox = { x: barrel.x, z: barrel.z, halfWidth: 0.9, halfLength: 0.95 };
      if (bulletHit(hitbox)) {
        events.push({ kind: 'barrel-destroyed', x: barrel.x, z: barrel.z });
        this.remove(i);
      } else if (intersects(player, hitbox)) {
        events.push({ kind: 'barrel-impact', x: barrel.x, z: barrel.z });
        this.remove(i);
      } else if (barrel.z > 65) {
        this.remove(i);
      }
    }
    return events;
  }

  renderAt(center: (z: number) => number): void {
    for (const barrel of this.barrels) barrel.group.position.x = barrel.x + center(barrel.z);
  }

  private spawn(): void {
    const x = this.lanes[Math.min(this.lanes.length - 1, Math.floor(this.random() * this.lanes.length))];
    const z = -87;
    const group = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xb94735, roughness: 0.42, metalness: 0.45 });
    const rings = new THREE.MeshStandardMaterial({ color: 0x222936, roughness: 0.68, metalness: 0.55 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.8, 1.4, 12), metal);
    drum.rotation.z = Math.PI / 2;
    group.add(drum);
    for (const side of [-0.5, 0.5]) {
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.09, 12), rings);
      rim.rotation.z = Math.PI / 2;
      rim.position.x = side * 1.3;
      group.add(rim);
    }
    group.position.set(x, 0.53, z);
    this.scene.add(group);
    this.barrels.push({ group, x, z });
  }

  private remove(index: number): void {
    const [barrel] = this.barrels.splice(index, 1);
    this.removeMesh(barrel);
  }

  private removeMesh(barrel: Barrel): void {
    this.scene.remove(barrel.group);
    barrel.group.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const material of mats) material.dispose();
      }
    });
  }
}
