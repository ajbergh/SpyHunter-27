import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ExplosionEffects } from './ExplosionEffects';

describe('pooled explosion effects', () => {
  it('does not allocate extra instances under heavy fire', () => {
    const effects = new ExplosionEffects(new THREE.Scene(), 4);
    for (let i = 0; i < 30; i++) effects.emit(0, -i, 0.2, 0xffaa44);
    expect(effects.capacity).toBe(4);
    expect(effects.activeCount).toBe(4);
    effects.step(0.3);
    expect(effects.activeCount).toBe(0);
  });
  it('resets all active visuals for restart', () => {
    const effects = new ExplosionEffects(new THREE.Scene(), 2);
    effects.emit(1, 2);
    effects.reset();
    expect(effects.activeCount).toBe(0);
  });
});
