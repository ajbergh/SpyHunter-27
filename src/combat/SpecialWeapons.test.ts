import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SpecialWeapons } from './SpecialWeapons';

describe('special weapon inventory', () => {
  it('uses ammunition, respects cooldown and supports resupply', () => {
    const w = new SpecialWeapons(new THREE.Scene());
    expect(w.counts.missile).toBe(3);
    expect(w.use('missile', 0)).toBe(true);
    expect(w.counts.missile).toBe(2);
    expect(w.use('missile', 0)).toBe(false);
    w.step(1, 30, []);
    expect(w.use('oil', 0)).toBe(true);
    expect(w.counts.oil).toBe(1);
    w.refill();
    expect(w.counts.oil).toBe(2);
    expect(w.counts.missile).toBe(3);
    w.reset();
    expect(w.counts.smoke).toBe(2);
  });
  it('limits ammunition across all types', () => {
    const w = new SpecialWeapons(new THREE.Scene());
    for (let i = 0; i < 3; i++) {
      expect(w.use('missile', 0)).toBe(true);
      w.step(0.7, 30, []);
    }
    expect(w.use('missile', 0)).toBe(false);
    w.reset();
    expect(w.counts.missile).toBe(3);
  });
});
