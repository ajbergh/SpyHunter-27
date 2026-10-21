import * as THREE from 'three';
import { sculptMesh, bodyPaint, glassPaint, addDecalBar } from '../entities/VehicleSculpt';
import { approach, intersects, PLAYER_Z, type RectHitbox } from '../core/logic';
import { bombingLane, helicopterCooldown, helicopterTargetX, type HelicopterProfile } from './FlightDirector';
import { HelicopterSearchlight } from '../rendering/HelicopterSearchlight';
import type { Quality } from '../gameplay/Settings';

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
  private readonly tailRotor = new THREE.Group();
  readonly searchlight: HelicopterSearchlight;
  private fireClock = 1.4;
  private phase = 0;
  private volley = 0;

  constructor(private readonly scene: THREE.Scene, startX = 0, startZ = -85,
              profile: HelicopterProfile = 'patrol',
              quality: Quality = 'medium', reducedMotion = false) {
    this.profile = profile;
    this.hpMax = profile === 'ace' ? 5 : 3;
    this.hp = this.hpMax;
    this.x = startX;
    this.z = startZ;
    const armor = bodyPaint(profile === 'ace' ? 0x374451 : 0x536878);
    const dark = new THREE.MeshStandardMaterial({
      color: 0x13212d, metalness: 0.64, roughness: 0.31,
    });
    const canopy = glassPaint(profile === 'ace' ? 0x712b40 : 0x193c5a);
    const steel = new THREE.MeshStandardMaterial({
      color: 0x8daab6, metalness: 0.85, roughness: 0.24,
    });
    const signal = new THREE.MeshStandardMaterial({
      color: profile === 'ace' ? 0xff405c : 0xffb04a,
      emissive: profile === 'ace' ? 0xff123e : 0xfa741a,
      emissiveIntensity: 2.5, roughness: 0.24,
    });
    // Faceted aerodynamic helicopter fuselage with tailored shoulders and
    // tapered tail boom; geometry remains fully original and disposable.
    sculptMesh(this.mesh, [
      { z: -3.25, halfWidth: 0.28, deck: 0.13, floor: -0.40 },
      { z: -2.65, halfWidth: 1.10, deck: 0.71, floor: -0.65 },
      { z: -1.70, halfWidth: 1.56, deck: 0.99, floor: -0.85 },
      { z: 0.25, halfWidth: 1.72, deck: 1.06, floor: -0.93 },
      { z: 1.75, halfWidth: 1.36, deck: 0.78, floor: -0.71 },
      { z: 3.10, halfWidth: 0.63, deck: 0.46, floor: -0.33 },
      { z: 4.0, halfWidth: 0.35, deck: 0.20, floor: -0.22 },
    ], armor);
    sculptMesh(this.mesh, [
      { z: -3.05, halfWidth: 0.39, deck: 0.18, floor: 0.06 },
      { z: -2.65, halfWidth: 0.88, deck: 0.71, floor: 0.08 },
      { z: -1.82, halfWidth: 1.12, deck: 0.87, floor: 0.11 },
      { z: -0.88, halfWidth: 1.05, deck: 0.78, floor: 0.12 },
      { z: -0.52, halfWidth: 0.86, deck: 0.62, floor: 0.10 },
    ], canopy);
    sculptMesh(this.mesh, [
      { z: 2.48, halfWidth: 0.47, deck: 0.37, floor: -0.34 },
      { z: 4.6, halfWidth: 0.33, deck: 0.31, floor: -0.20 },
      { z: 6.26, halfWidth: 0.19, deck: 0.20, floor: -0.14 },
    ], armor);
    // Tail boom stabilizer, segmented armor, sensor nose and turbines.
    box(this.mesh, [3.25, 0.12, 1.12], [0, -0.08, 5.49], armor);
    box(this.mesh, [0.17, 1.55, 1.38], [0, 0.76, 5.65], armor);
    box(this.mesh, [1.16, 0.38, 0.64], [0, -0.36, -3.21], steel);
    box(this.mesh, [0.70, 0.52, 1.64], [0, 1.05, 0.65], dark);
    const optic = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 10), dark);
    optic.position.set(0, -0.55, -3.38);
    this.mesh.add(optic);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 9),
      new THREE.MeshStandardMaterial({
        color: 0x1aa7d8, emissive: 0x1b83ca, emissiveIntensity: 2.2,
        metalness: 0.65, roughness: 0.17,
      }));
    lens.position.set(0, -0.58, -3.64);
    this.mesh.add(lens);
    for (const side of [-1, 1]) {
      // Powered weapon pylons, radome pods and guided-launch tubes.
      box(this.mesh, [2.10, 0.23, 2.05], [side * 2.05, -0.28, 0.40], armor);
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.43, 1.95, 4, 12), dark);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(side * 2.27, -0.47, 0.32);
      pod.castShadow = true;
      this.mesh.add(pod);
      for (let i = 0; i < 3; i++) {
        const bore = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 5, 10), steel);
        bore.position.set(side * 2.27 + (i - 1) * 0.14, -0.47, -0.91);
        this.mesh.add(bore);
      }
      addDecalBar(this.mesh, [0.19, 0.23, 0.45],
        [side * 2.23, -0.21, -0.85], signal.color.getHex(), true);
      for (const z of [-1.55, 1.80]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.05, 8), steel);
        strut.position.set(side * 1.34, -1.11, z);
        strut.castShadow = true;
        this.mesh.add(strut);
      }
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 4.28, 10), steel);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(side * 1.35, -1.72, 0.23);
      skid.castShadow = true;
      this.mesh.add(skid);
      // Original active dorsal and aft navigation indicators.
      addDecalBar(this.mesh, [0.10, 0.11, 0.74],
        [side * 1.40, 0.56, 0.30], signal.color.getHex(), true);
    }
    // Rotor assembly supports spinning animation without reallocations.
    box(this.rotor, [7.1, 0.065, 0.28], [0, 0, 0], dark);
    box(this.rotor, [0.28, 0.065, 7.1], [0, 0, 0], dark);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.43, 0.28, 12), steel);
    this.rotor.add(hub);
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.9), signal);
      tip.position.set(Math.cos(angle) * 3.45, 0, Math.sin(angle) * 3.45);
      tip.rotation.y = -angle;
      this.rotor.add(tip);
    }
    // Independently spinning tail rotor with visible protective housing.
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.09, 6, 24), steel);
    ring.rotation.y = Math.PI / 2;
    this.tailRotor.add(ring);
    box(this.tailRotor, [0.09, 0.16, 1.28], [0, 0, 0], dark);
    box(this.tailRotor, [0.09, 1.28, 0.16], [0, 0, 0], dark);
    const tailHub = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), signal);
    this.tailRotor.add(tailHub);
    this.tailRotor.position.set(0.23, 0.95, 6.07);
    this.rotor.name = 'mainRotor';
    this.tailRotor.name = 'tailRotor';
    this.mesh.add(this.tailRotor);
    if (profile === 'ace') {
      box(this.mesh, [2.45, 0.22, 0.65], [0, -0.62, 1.92], signal);
      for (const side of [-1, 1])
        box(this.mesh, [0.18, 0.36, 0.64], [side * 1.26, 0.83, -1.95], signal);
    }
    this.rotor.position.y = 1.22;
    this.mesh.add(this.rotor);
    scene.add(this.mesh);
    this.searchlight = new HelicopterSearchlight(scene, profile);
    this.searchlight.setPreferences(quality, reducedMotion);
    this.sync();
  }

  private sync(): void {
    this.mesh.position.set(this.x, 8.7 + Math.sin(this.phase * 2) * 0.25, this.z);
  }

  /** Returns a bomb target when the attack enters its release window. */
  step(dt: number, playerX: number, playerSpeed: number, playerZ = PLAYER_Z): { x: number; z: number } | null {
    this.phase += dt;
    this.searchlight.step(dt);
    this.z += Math.max(10, playerSpeed - 14) * dt;
    if (this.z > -58 && this.z < -13) {
      this.x = approach(this.x, helicopterTargetX(this.profile, playerX, this.phase),
        this.profile === 'ace' ? 1.65 : 0.65, dt);
    }
    this.rotor.rotation.y += dt * 17;
    this.tailRotor.rotation.x += dt * 29;
    this.sync();
    this.fireClock -= dt;
    if (this.z > -49 && this.z < -8 && this.fireClock <= 0) {
      this.fireClock = helicopterCooldown(this.profile);
      // Target a predicted road position with over 0.9 seconds of notice;
      // braking or changing lanes after the warning provides a real escape.
      return { x: bombingLane(this.profile, playerX, this.volley++),
        z: playerZ - bombDropDistance(playerSpeed) };
    }
    return null;
  }

  setSearchlightPreferences(quality: Quality, reducedMotion: boolean): void {
    this.searchlight.setPreferences(quality, reducedMotion);
  }

  renderAt(center: (z: number) => number): void {
    this.mesh.position.x = this.x + center(this.z);
    this.searchlight.renderAt(this.x, this.z, this.mesh.position.y, center);
  }

  get escaped(): boolean { return this.z > 48; }

  hitbox(): RectHitbox { return { x: this.x, z: this.z, halfWidth: 2.25, halfLength: 3.4 }; }

  dispose(): void {
    this.searchlight.dispose();
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
  private quality: Quality = 'medium';
  private reducedMotion = false;

  setPreferences(quality: Quality, reducedMotion: boolean): void {
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    for (const helicopter of this.helicopters) {
      helicopter.setSearchlightPreferences(quality, reducedMotion);
    }
  }

  constructor(private readonly scene: THREE.Scene) {}

  get activeBombs(): number { return this.bombs.length; }

  spawn(x: number, profile: HelicopterProfile = 'patrol', startZ = -85): Helicopter {
    const helicopter = new Helicopter(this.scene, x, startZ, profile,
      this.quality, this.reducedMotion);
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
      const target = helicopter.step(dt, playerX, playerSpeed, playerHitbox.z);
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
    for (const helicopter of this.helicopters) helicopter.renderAt(center);
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
