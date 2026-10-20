import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WaterHazards } from './WaterHazards';

describe('waterway floating barrels', () => {
  it('spawns and removes barrels on player collision', () => {
    const hazards = new WaterHazards(new THREE.Scene(), () => 0);
    const player = { x: -6.1, z: 11, halfWidth: 1.2, halfLength: 2.2 };
    let collisions = 0;
    for (let i = 0; i < 400; i++) {
      const events = hazards.step(1/60, 40, player, () => false);
      collisions += events.filter(e => e.kind === 'barrel-impact').length;
    }
    expect(collisions).toBeGreaterThan(0);
    hazards.reset();
    expect(hazards.count).toBe(0);
  });
  it('lets gunfire detonate floating barrels before impact', () => {
    const hazards = new WaterHazards(new THREE.Scene(), () => 0);
    const player = { x: 6.1, z: 11, halfWidth: 1, halfLength: 2 };
    let destroyed = 0;
    for (let i = 0; i < 300; i++) {
      destroyed += hazards.step(1/60, 38, player, target => target.z > -15)
        .filter(e => e.kind === 'barrel-destroyed').length;
    }
    expect(destroyed).toBeGreaterThan(0);
  });
});
