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
});
