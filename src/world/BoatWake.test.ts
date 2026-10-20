import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BoatWake } from './BoatWake';

describe('boat wake pooling', () => {
  it('spawns and cleans up fading wake rings without accumulation', () => {
    const wake = new BoatWake(new THREE.Scene());
    for (let i = 0; i < 25; i++) wake.step(0.1, 30, 0, true);
    expect(wake.count).toBeGreaterThan(0);
    for (let i = 0; i < 30; i++) wake.step(0.1, 30, 0, false);
    expect(wake.count).toBe(0);
  });
});
