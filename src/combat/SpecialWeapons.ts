import * as THREE from 'three';
import { approach, intersects, PLAYER_Z } from '../core/logic';
import type { TrafficVehicle } from '../entities/Traffic';
import type { AirTarget } from './AirThreats';
import { MissileContrails } from './MissileContrails';

export type WeaponKind = 'missile' | 'oil' | 'smoke';
export type WeaponCounts = Readonly<Record<WeaponKind, number>>;
export type Impact = { vehicle: TrafficVehicle; kind: WeaponKind | 'flame' } | { aircraft: AirTarget; kind: 'missile' };
type Missile = { mesh: THREE.Group; x: number; z: number; trailClock: number };
type Hazard = { mesh: THREE.Group; kind: 'oil' | 'smoke' | 'flame'; x: number; z: number; life: number; affected: Set<TrafficVehicle> };

const MAX_AMMO: Record<WeaponKind, number> = { missile: 3, oil: 2, smoke: 2 };

/** Special weapons own both their visual objects and their collision effects. */
export class SpecialWeapons {
  private ammo: Record<WeaponKind, number> = { ...MAX_AMMO };
  private missiles: Missile[] = [];
  private hazards: Hazard[] = [];
  private cooldown = 0;
  private readonly contrails: MissileContrails;

  constructor(private readonly scene: THREE.Scene) {
    this.contrails = new MissileContrails(scene);
  }

  get counts(): WeaponCounts { return { ...this.ammo }; }
  get activeMissileTrails(): number { return this.contrails.activeCount; }

  reset(): void {
    for (const missile of this.missiles) this.destroyObject(missile.mesh);
    for (const hazard of this.hazards) this.destroyObject(hazard.mesh);
    this.missiles = [];
    this.hazards = [];
    this.ammo = { ...MAX_AMMO };
    this.cooldown = 0;
    this.contrails.reset();
  }

  refill(): void { this.ammo = { ...MAX_AMMO }; }

  grantAmmo(kind: WeaponKind, quantity = 1): number {
    const before = this.ammo[kind];
    this.ammo[kind] = Math.min(MAX_AMMO[kind], before + Math.max(0, Math.floor(quantity)));
    return this.ammo[kind] - before;
  }

  use(kind: WeaponKind, x: number, water = false): boolean {
    if (this.ammo[kind] === 0 || this.cooldown > 0) return false;
    this.ammo[kind]--;
    this.cooldown = kind === 'missile' ? 0.65 : 0.95;
    if (kind === 'missile') {
      const mesh = this.makeMissile();
      mesh.position.set(x, 0.8, PLAYER_Z - 3.8);
      this.scene.add(mesh);
      this.missiles.push({ mesh, x, z: PLAYER_Z - 3.8, trailClock: 0 });
    } else {
      const hazardKind = water && kind === 'oil' ? 'flame' : kind;
      const mesh = this.makeHazard(hazardKind);
      const z = PLAYER_Z + 6;
      mesh.position.set(x, 0.22, z);
      this.scene.add(mesh);
      this.hazards.push({
        mesh, kind: hazardKind, x, z,
        life: hazardKind === 'smoke' ? 4 : 6, affected: new Set(),
      });
    }
    return true;
  }

  step(dt: number, playerSpeed: number, traffic: readonly TrafficVehicle[], airTargets: readonly AirTarget[] = []): Impact[] {
    const impacts: Impact[] = [];
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.contrails.step(dt, playerSpeed);
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      // Aerial targets are prioritized when in range; other missiles target road hostiles.
      // A missile locked on to an aircraft flies at its altitude rather than hitting cars.
      const aircraft = airTargets
        .filter((air) => air.hp > 0 && air.z < missile.z && air.z > missile.z - 75)
        .sort((a, b) => b.z - a.z)[0];
      let carTarget: TrafficVehicle | undefined;
      if (!aircraft) {
        for (const car of traffic) {
          if (car.hostile && car.hp > 0 && car.z < missile.z && car.z > missile.z - 55 &&
              (!carTarget || car.z > carTarget.z)) carTarget = car;
        }
      }
      const target = aircraft ?? carTarget;
      if (target) missile.x = approach(missile.x, target.x, aircraft ? 7.3 : 5.5, dt);
      missile.z -= 82 * dt;
      const altitude = aircraft ? 8.7 : 0.83;
      missile.mesh.position.set(missile.x, approach(missile.mesh.position.y, altitude, 7, dt), missile.z);
      missile.trailClock -= dt;
      if (missile.trailClock <= 0) {
        this.contrails.emit(missile.x, missile.mesh.position.y, missile.z + 1.05);
        missile.trailClock = 0.085;
      }
      missile.mesh.rotation.z = target ? Math.max(-0.25, Math.min(0.25, (target.x - missile.x) * -0.08)) : 0;
      const airHit = airTargets.find((air) => air.hp > 0 &&
        Math.abs(missile.x - air.x) < 2.4 && Math.abs(missile.z - air.z) < 3.7 &&
        missile.mesh.position.y > 3.5);
      if (airHit) {
        airHit.hp -= 3;
        impacts.push({ aircraft: airHit, kind: 'missile' });
        this.removeMissile(i);
        continue;
      }
      // Once armed against airborne targets, don't accidentally collide with road traffic.
      const hit = aircraft ? undefined : traffic.find((car) =>
        car.hostile && car.hp > 0 && intersects(
          { x: missile.x, z: missile.z, halfWidth: 0.52, halfLength: 0.95 }, car.hitbox()));
      if (hit) {
        hit.hp -= 3;
        impacts.push({ vehicle: hit, kind: 'missile' });
        this.removeMissile(i);
      } else if (missile.z < -100) this.removeMissile(i);
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.life -= dt;
      hazard.z += playerSpeed * dt;
      hazard.mesh.position.z = hazard.z;
      if (hazard.kind === 'smoke') {
        hazard.mesh.rotation.y += dt * 0.8;
        hazard.mesh.scale.setScalar(0.9 + 0.1 * Math.sin(hazard.life * 5));
      }
      for (const car of traffic) {
        if (!car.hostile || car.hp <= 0 || hazard.affected.has(car)) continue;
        if (Math.abs(car.x - hazard.x) < 3.3 && Math.abs(car.z - hazard.z) < 4.4) {
          hazard.affected.add(car);
          if (hazard.kind === 'oil') car.spinOut(2.8);
          else if (hazard.kind === 'flame') car.hp -= 3;
          else car.disrupt(3.4);
          impacts.push({ vehicle: car, kind: hazard.kind });
        }
      }
      if (hazard.life <= 0 || hazard.z > 105) this.removeHazard(i);
    }
    return impacts;
  }

  renderAt(center: (z: number) => number): void {
    for (const missile of this.missiles) missile.mesh.position.x = missile.x + center(missile.z);
    for (const hazard of this.hazards) hazard.mesh.position.x = hazard.x + center(hazard.z);
    this.contrails.renderAt(center);
  }

  private makeMissile(): THREE.Group {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.27, 1.6, 8),
      new THREE.MeshStandardMaterial({ color: 0xf3ede0, metalness: 0.6, roughness: 0.25 }));
    body.rotation.x = -Math.PI / 2;
    group.add(body);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 8),
      new THREE.MeshBasicMaterial({ color: 0xffa42f }));
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 1.15;
    group.add(flame);
    return group;
  }

  private makeHazard(kind: 'oil' | 'smoke' | 'flame'): THREE.Group {
    const group = new THREE.Group();
    if (kind === 'oil' || kind === 'flame') {
      const slick = new THREE.Mesh(new THREE.CircleGeometry(3.1, 32),
        new THREE.MeshStandardMaterial({ color: kind === 'flame' ? 0xfb5427 : 0x080e19, roughness: 0.07, metalness: 0.55, transparent: true, opacity: 0.88, side: THREE.DoubleSide }));
      slick.rotation.x = -Math.PI / 2;
      slick.scale.set(1, 1.35, 1);
      group.add(slick);
      const rim = new THREE.Mesh(new THREE.RingGeometry(2.8, 3.12, 32),
        new THREE.MeshBasicMaterial({ color: kind === 'flame' ? 0xffdc76 : 0x21a7d6, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
      rim.rotation.x = -Math.PI / 2;
      rim.scale.set(1, 1.35, 1);
      rim.position.y = 0.01;
      group.add(rim);
    } else {
      for (let i = 0; i < 9; i++) {
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(1.15 + (i % 3) * 0.35, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0xaec8cf, transparent: true, opacity: 0.42, roughness: 1, depthWrite: false }));
        cloud.position.set(Math.sin(i * 2.4) * 2.4, 1.3 + (i % 3) * 0.55, Math.cos(i * 2.4) * 2.2);
        group.add(cloud);
      }
    }
    return group;
  }

  private removeMissile(index: number): void {
    const [missile] = this.missiles.splice(index, 1);
    this.destroyObject(missile.mesh);
  }

  private removeHazard(index: number): void {
    const [hazard] = this.hazards.splice(index, 1);
    this.destroyObject(hazard.mesh);
  }

  private destroyObject(group: THREE.Group): void {
    this.scene.remove(group);
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      }
    });
  }
}
