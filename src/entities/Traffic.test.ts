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
});
