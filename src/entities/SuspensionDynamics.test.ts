import { describe, expect, it } from 'vitest';
import { SuspensionDynamics } from './SuspensionDynamics';

describe('visual chassis loading springs', () => {
  it('responds to acceleration, braking, steering and heave with bounded pitch/roll', () => {
    const suspension = new SuspensionDynamics();
    for (let i = 0; i < 24; i++)
      suspension.step(1 / 60, 20, 0.75, false, 42);
    expect(suspension.pitch).toBeGreaterThan(0.005);
    expect(suspension.pitch).toBeLessThan(0.05);
    expect(suspension.roll).toBeLessThan(-0.01);
    expect(suspension.roll).toBeGreaterThan(-0.052);
    expect(suspension.heave).toBeLessThan(0);
    for (let i = 0; i < 36; i++)
      suspension.step(1 / 60, -28, -1, true, 35);
    expect(suspension.pitch).toBeLessThan(-0.025);
    expect(suspension.pitch).toBeGreaterThan(-0.065);
    expect(suspension.roll).toBeGreaterThan(0.02);
    expect(suspension.roll).toBeLessThan(0.052);
    expect(suspension.heave).toBeGreaterThanOrEqual(-0.032);
  });

  it('is fully deterministic, damped and converges to rest without drift', () => {
    const first = new SuspensionDynamics();
    const second = new SuspensionDynamics();
    for (const model of [first, second]) {
      for (let i = 0; i < 60; i++) model.step(1 / 60, 18, 1, false, 38);
      for (let i = 0; i < 250; i++) model.step(1 / 60, 0, 0, false, 25);
    }
    expect(first.pitch).toBe(second.pitch);
    expect(first.roll).toBe(second.roll);
    expect(first.heave).toBe(second.heave);
    expect(Math.abs(first.pitch)).toBeLessThan(0.0001);
    expect(Math.abs(first.roll)).toBeLessThan(0.0001);
    expect(Math.abs(first.heave)).toBeLessThan(0.0001);
  });

  it('suppresses pose under Reduced Motion and rejects invalid inputs', () => {
    const suspension = new SuspensionDynamics();
    suspension.step(1 / 60, 20, -1, false, 46);
    suspension.step(Number.NaN, Number.NaN, Number.NaN, false, Number.NaN);
    expect(Number.isFinite(suspension.pitch)).toBe(true);
    suspension.step(1 / 60, 10000, -100, false, 800);
    expect(Math.abs(suspension.pitch)).toBeLessThanOrEqual(0.065);
    expect(Math.abs(suspension.roll)).toBeLessThanOrEqual(0.052);
    suspension.step(1 / 60, 0, 0, false, 0, true);
    expect(suspension.pitch).toBe(0);
    expect(suspension.roll).toBe(0);
    expect(suspension.heave).toBe(0);
    suspension.reset();
    expect(suspension.pitch).toBe(0);
  });
});
