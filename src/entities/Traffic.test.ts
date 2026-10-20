import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { TrafficVehicle } from './Traffic';

describe('enforcer AI', () => {
  it('fires only when aligned, on road and not disrupted', () => {
    const scene = new THREE.Scene();
    const enemy = new TrafficVehicle(scene, 0, -22, true, 3, 0x621f33, 12);
    enemy.step(1/60, 30, 0);
    expect(enemy.role).toBe('enforcer');
    expect(enemy.tryFire(0)).toBe(false);
    for (let i=0;i<90;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(true);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.disrupt(4);
    for (let i=0;i<150;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.dispose(scene);
  });
});
