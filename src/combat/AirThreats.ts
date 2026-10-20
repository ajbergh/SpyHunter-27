import * as THREE from 'three';
import { approach, intersects, PLAYER_Z, type RectHitbox } from '../core/logic';
import { bombingLane, helicopterCooldown, helicopterTargetX, type HelicopterProfile } from './FlightDirector';

export const BOMB_WARNING_SECONDS = 0.92;

/** Time-matched telegraph reaches the player plane only if speed is maintained. */
export function bombDropDistance(speed: number): number {
  return Math.max(15, Math.max(0, speed) * BOMB_WARNING_SECONDS);
}

export interface AirTarget { x: number; z: number; hp: number; }
export interface AirEvent { kind: 'bomb-warning' | 'bomb-detonated' | 'helicopter-escaped'; x: number; z: number; playerHit?: boolean; }

type Bomb = {
  group: THREE.Group; x: number; z: number; warning: number; blast: number;
  resolved: boolean;
};

function box(parent: THREE.Group, size: [number, number, number], pos: [number, number, number],
             material: THREE.Material): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  parent.add(mesh);
}

/** An original attack helicopter with an animated rotor, readable shadow and timed road bombs. */
export class Helicopter implements AirTarget {
  readonly mesh = new THREE.Group();
  readonly hpMax: number;
  readonly profile: HelicopterProfile;
  hp: number;
  x: number;
  z: number;
  private readonly rotor = new THREE.Group();
  private fireClock = 1.4;
  private phase = 0;
  private volley = 0;

  constructor(private readonly scene: THREE.Scene, startX = 0, startZ = -85,
              profile: HelicopterProfile = 'patrol') {
    this.profile = profile;
    this.hpMax = profile === 'ace' ? 5 : 3;
    this.hp = this.hpMax;
    this.x = startX;
    this.z = startZ;
    const armor = new THREE.MeshStandardMaterial({ color: 0x475c6b, metalness: 0.7, roughness: 0.34 });
    const canopy = new THREE.MeshStandardMaterial({ color: 0x13293f, metalness: 0.75, roughness: 0.18 });
    const hazard = new THREE.MeshBasicMaterial({ color: profile === 'ace' ? 0xff525d : 0xffa23b });
    box(this.mesh, [3.2, 1.35, 6.1], [0, 0, 0], armor);
    box(this.mesh, [2.3, 0.85, 2.1], [0, 0.45, -1.5], canopy);
    box(this.mesh, [0.45, 0.5, 4.7], [0, 0.1, 4.5], armor);
    box(this.mesh, [3.1, 0.22, 0.8], [0, 0.1, 6.45], armor);
    for (const side of [-1, 1]) {
      box(this.mesh, [1.15, 0.5, 2], [side * 2.1, -0.35, 0.45], armor);
      box(this.mesh, [0.36, 0.22, 1.1], [side * 2.1, -0.38, -0.9], hazard);
    }
    box(this.rotor, [9.4, 0.08, 0.22], [0, 0, 0], canopy);
    box(this.rotor, [0.22, 0.08, 9.4], [0, 0, 0], canopy);
    if (profile === 'ace') {
      box(this.mesh, [2.8, 0.3, 1.2], [0, -0.6, 2], hazard);
      for (const side of [-1, 1]) {
        box(this.mesh, [0.24, 0.5, 1.0], [side * 1.2, 0.55, -2.1], hazard);
      }
    }
    this.rotor.position.y = 1.22;
    this.mesh.add(this.rotor);
    scene.add(this.mesh);
    this.sync();
  }

  private sync(): void {
    this.mesh.position.set(this.x, 8.7 + Math.sin(this.phase * 2) * 0.25, this.z);
  }

  /** Returns a bomb target when the attack enters its release window. */
  step(dt: number, playerX: number, playerSpeed: number): { x: number; z: number } | null {
    this.phase += dt;
    this.z += Math.max(10, playerSpeed - 14) * dt;
    if (this.z > -58 && this.z < -13) {
      this.x = approach(this.x, helicopterTargetX(this.profile, playerX, this.phase),
        this.profile === 'ace' ? 1.65 : 0.65, dt);
    }
    this.rotor.rotation.y += dt * 17;
    this.sync();
    this.fireClock -= dt;
    if (this.z > -49 && this.z < -8 && this.fireClock <= 0) {
      this.fireClock = helicopterCooldown(this.profile);
      // Target a predicted road position with over 0.9 seconds of notice;
      // braking or changing lanes after the warning provides a real escape.
      return { x: bombingLane(this.profile, playerX, this.volley++),
        z: PLAYER_Z - bombDropDistance(playerSpeed) };
    }
    return null;
  }

  get escaped(): boolean { return this.z > 48; }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: 2.25, halfLength: 3.4 }; }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of mats) mat.dispose();
      }
    });
  }
}

/** Owns aerial enemies, bomb warnings and damaging blasts; isolated for simulation tests. */
export class AirThreats {
  readonly helicopters: Helicopter[] = [];
  private bombs: Bomb[] = [];

  constructor(private readonly scene: THREE.Scene) {}

  get activeBombs(): number { return this.bombs.length; }

  spawn(x: number, profile: HelicopterProfile = 'patrol'): Helicopter {
    const helicopter = new Helicopter(this.scene, x, -85, profile);
    this.helicopters.push(helicopter);
    return helicopter;
  }

  reset(): void {
    for (const helicopter of this.helicopters) helicopter.dispose();
    this.helicopters.length = 0;
    for (const bomb of this.bombs) this.disposeBomb(bomb);
    this.bombs.length = 0;
  }

  /** Damage is evaluated only on the blast frame; warnings themselves are non-lethal. */
  step(dt: number, playerX: number, playerSpeed: number, playerHitbox: RectHitbox): AirEvent[] {
    const events: AirEvent[] = [];
    for (let i = this.helicopters.length - 1; i >= 0; i--) {
      const helicopter = this.helicopters[i];
      if (helicopter.hp <= 0 || helicopter.escaped) {
        if (helicopter.escaped) events.push({ kind: 'helicopter-escaped', x: helicopter.x, z: helicopter.z });
        helicopter.dispose();
        this.helicopters.splice(i, 1);
        continue;
      }
      const target = helicopter.step(dt, playerX, playerSpeed);
      if (target) {
        this.dropBomb(target.x, target.z);
        events.push({ kind: 'bomb-warning', x: target.x, z: target.z });
      }
    }
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.z += playerSpeed * dt;
      bomb.group.position.z = bomb.z;
      if (!bomb.resolved) {
        bomb.warning -= dt;
        const indicator = bomb.group.children[0] as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
        indicator.scale.setScalar(1 + Math.sin(bomb.warning * 14) * 0.11);
        // The ring becomes visibly brighter as the blast approaches.
        indicator.material.opacity = Math.min(1, 0.5 + 0.5 *
          (1 - Math.max(0, bomb.warning) / BOMB_WARNING_SECONDS));
        if (bomb.warning <= 0) {
          bomb.resolved = true;
          bomb.blast = 0.42;
          const hit = intersects({ x: bomb.x, z: bomb.z, halfWidth: 2.2, halfLength: 2.6 }, playerHitbox);
          events.push({ kind: 'bomb-detonated', x: bomb.x, z: bomb.z, playerHit: hit });
          bomb.group.visible = false;
        }
      } else {
        bomb.blast -= dt;
        if (bomb.blast <= 0) {
          this.disposeBomb(bomb);
          this.bombs.splice(i, 1);
        }
      }
    }
    return events;
  }

  renderAt(center: (z: number) => number): void {
    for (const helicopter of this.helicopters) {
      helicopter.mesh.position.x = helicopter.x + center(helicopter.z);
    }
    for (const bomb of this.bombs) bomb.group.position.x = bomb.x + center(bomb.z);
  }

  private dropBomb(x: number, z: number): void {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.65, 2.35, 28),
      new THREE.MeshBasicMaterial({ color: 0xff7540, transparent: true, opacity: 0.94, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.11;
    group.add(ring);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd17e }));
    marker.position.y = 1.5;
    group.add(marker);
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.bombs.push({ group, x, z, warning: BOMB_WARNING_SECONDS, blast: 0, resolved: false });
  }

  private disposeBomb(bomb: Bomb): void {
    this.scene.remove(bomb.group);
    bomb.group.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const m of materials) m.dispose();
      }
    });
  }
}
