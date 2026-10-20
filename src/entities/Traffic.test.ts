import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { TrafficVehicle } from './Traffic';

describe('enforcer AI', () => {
  it('fires only when aligned, on road and not disrupted', () => {
    const scene = new THREE.Scene();
    const enemy = new TrafficVehicle(scene, 0, -45, true, 3, 0x621f33, 12);
    enemy.step(1/60, 30, 0);
    expect(enemy.role).toBe('enforcer');
    expect(enemy.tryFire(0)).toBe(false);
    for (let i=0;i<85;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(true);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.disrupt(4);
    for (let i=0;i<150;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.dispose(scene);
  });
  it('motorcycle uses a narrow single-hit profile with fast lateral slalom', () => {
    const scene = new THREE.Scene();
    const bike = new TrafficVehicle(scene, 0, -36, true, 4, 0x6b1622, 15);
    expect(bike.role).toBe('motorcycle');
    expect(bike.hitbox().halfWidth).toBeLessThan(0.7);
    expect(bike.hp).toBe(1);
    for (let i = 0; i < 80; i++) bike.step(1/60, 40, 5);
    expect(Math.abs(bike.x)).toBeGreaterThan(0.1);
    bike.dispose(scene);
  });

  it('switchblade car carries wide blades and aggressively follows a target', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, -6.4, -25, true, 6, 0x682735, 13);
    expect(car.role).toBe('switchblade');
    expect(car.hitbox().halfWidth).toBeGreaterThan(1.5);
    for (let i = 0; i < 40; i++) car.step(1 / 60, 40, 6.4);
    expect(car.x).toBeGreaterThan(-6.4);
    car.dispose(scene);
  });
  it('paired attackers respond to a tactical target and smoke still disables it', () => {
    const scene = new THREE.Scene();
    const enemy = new TrafficVehicle(scene, -6.4, -30, true, 0, 0x6b1622, 11, 4);
    const start = enemy.x;
    for (let i = 0; i < 50; i++) enemy.step(1/60, 32, 0,
      { type: 'pincer', targetX: -3.8 });
    expect(enemy.x).toBeGreaterThan(start);
    expect(enemy.squadId).toBe(4);
    enemy.disrupt(3);
    const disabledX = enemy.x;
    for (let i=0;i<45;i++) enemy.step(1/60,32,0,
      { type: 'pincer', targetX: 7 });
    expect(enemy.x).toBeCloseTo(disabledX, 4);
    enemy.dispose(scene);
  });

});
