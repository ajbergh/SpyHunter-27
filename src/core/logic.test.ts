import { describe, expect, it } from 'vitest';
import { approach, clamp, distancePoints, intersects, scoreForTarget, spawnInterval } from './logic';

describe('arcade math', () => {
  it('clamps lateral movement', () => { expect(clamp(12, -8, 8)).toBe(8); });
  it('detects overlapping road-plane hitboxes', () => {
    const a = { x: 0, z: 11, halfWidth: 1, halfLength: 2 };
    expect(intersects(a, { x: 1.8, z: 11, halfWidth: 1, halfLength: 2 })).toBe(true);
    expect(intersects(a, { x: 5, z: 11, halfWidth: 1, halfLength: 2 })).toBe(false);
  });
  it('approaches a value consistently across time steps', () => {
    const a = approach(0, 40, 3, 1);
    let b = 0;
    for (let i=0;i<60;i++) b=approach(b,40,3,1/60);
    expect(b).toBeCloseTo(a, 6);
  });
  it('rewards forward movement and hostile targets, not civilians', () => {
    expect(distancePoints(30, 2)).toBe(120);
    expect(scoreForTarget(true)).toBe(250);
    expect(scoreForTarget(false)).toBe(0);
  });
  it('never spawns more often than the configured bound', () => {
    expect(spawnInterval(0)).toBe(1.5);
    expect(spawnInterval(999999)).toBe(0.65);
  });
});
