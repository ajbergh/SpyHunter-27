import { describe, expect, it } from 'vitest';
import { CameraImpact } from './CameraImpact';

describe('fixed-step impact camera', () => {
  it('creates a small recoil that exponentially decays and resets without drift', () => {
    const camera = new CameraImpact();
    expect(camera.active).toBe(false);
    camera.hit();
    camera.step(1 / 60, false);
    expect(camera.active).toBe(true);
    expect(Math.abs(camera.lift)).toBeGreaterThan(0.01);
    expect(Math.abs(camera.lift)).toBeLessThanOrEqual(0.3);
    expect(Math.abs(camera.roll)).toBeLessThanOrEqual(0.018);
    for (let i = 0; i < 120; i++) camera.step(1 / 60, false);
    expect(camera.active).toBe(false);
    expect(camera.lift).toBe(0);
    expect(camera.roll).toBe(0);
    camera.hit();
    camera.reset();
    expect(camera.active).toBe(false);
    expect(camera.roll).toBe(0);
  });

  it('is repeatable at a fixed timestep and caps repeated impacts', () => {
    const a = new CameraImpact();
    const b = new CameraImpact();
    for (const camera of [a, b]) {
      for (let i = 0; i < 20; i++) camera.hit();
      for (let i = 0; i < 24; i++) camera.step(1 / 60, false);
    }
    expect(a.lift).toBe(b.lift);
    expect(a.roll).toBe(b.roll);
    expect(Math.abs(a.lift)).toBeLessThanOrEqual(0.3);
    expect(Math.abs(a.roll)).toBeLessThanOrEqual(0.018);
  });

  it('reports positive zero after a negative half-wave has fully decayed', () => {
    const impact = new CameraImpact();
    impact.hit(1, -1);
    for (let i = 0; i < 130; i++) impact.step(1 / 60, false);
    expect(impact.active).toBe(false);
    expect(Object.is(impact.lift, 0)).toBe(true);
    expect(Object.is(impact.roll, 0)).toBe(true);
    expect(Object.is(impact.lift, -0)).toBe(false);
    impact.hit();
    impact.reset();
    expect(Object.is(impact.lift, 0)).toBe(true);
  });

  it('fully suppresses camera movement in reduced motion and ignores invalid updates', () => {
    const camera = new CameraImpact();
    camera.hit();
    camera.step(Number.NaN, false);
    expect(camera.active).toBe(true);
    camera.step(1 / 60, true);
    expect(camera.active).toBe(false);
    expect(camera.lift).toBe(0);
    expect(camera.roll).toBe(0);
    camera.hit(-1);
    camera.hit(Number.NaN);
    expect(camera.active).toBe(false);
  });

  it('biases impact roll toward the struck side while preserving the original limits', () => {
    const left = new CameraImpact();
    const right = new CameraImpact();
    left.hit(1, -1);
    right.hit(1, 1);
    left.step(1 / 60, false);
    right.step(1 / 60, false);
    expect(left.roll).toBeLessThan(0);
    expect(right.roll).toBeGreaterThan(0);
    expect(Math.abs(left.roll)).toBeLessThan(0.018);
    expect(Math.abs(right.roll)).toBeLessThan(0.018);
    expect(left.lift).toBe(right.lift);
    for (let i = 0; i < 120; i++) {
      left.step(1 / 60, false);
      right.step(1 / 60, false);
    }
    expect(left.roll).toBe(0);
    expect(right.roll).toBe(0);
    right.hit(1, 1);
    right.step(1 / 60, true);
    expect(right.roll).toBe(0);
  });

});
