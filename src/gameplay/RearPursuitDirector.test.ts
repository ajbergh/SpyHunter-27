import { describe, expect, it } from 'vitest';
import { planRearPursuit } from './RearPursuitDirector';

const random = () => 0.5;
const existing = (x: number, z: number, role = 'civilian') => ({ x, z, role });

describe('rear-pursuit encounter director', () => {
  it('starts behind the player in the nearest legal lane at a catchable speed', () => {
    const left = planRearPursuit([], 700, -6.2, false, false, false, random);
    expect(left).toEqual({ x: -6.4, z: 34, speed: 47.5 });
    expect(planRearPursuit([], 700, 6.3, false, false, false, random)?.x).toBe(6.4);
    expect(planRearPursuit([], 700, 0.1, false, false, false, random)?.x).toBe(0);
    expect(planRearPursuit([], 700, 0, false, false, false, () => 0)?.speed).toBe(46);
    expect(planRearPursuit([], 700, 0, false, false, false, () => 0.99)?.speed).toBeLessThan(49);
  });

  it('respects minimum progression, waterway, forks and the support van', () => {
    expect(planRearPursuit([], 549, 0, false, false, false, random)).toBeNull();
    expect(planRearPursuit([], 700, 0, true, false, false, random)).toBeNull();
    expect(planRearPursuit([], 700, 0, false, true, false, random)).toBeNull();
    expect(planRearPursuit([], 700, 0, false, false, true, random)).toBeNull();
  });

  it('never overlaps traffic at the entry lane and defers fully occupied rears', () => {
    const occupied = [existing(0, 34)];
    expect(planRearPursuit(occupied, 700, 0, false, false, false, random)?.x).toBe(-6.4);
    const all = [...occupied, existing(-6.4, 33), existing(6.4, 32)];
    expect(planRearPursuit(all, 700, 0, false, false, false, random)).toBeNull();
    expect(planRearPursuit([existing(0, -45)], 700, 0, false, false, false, random)?.x).toBe(0);
  });

  it('never stacks active tail vehicles', () => {
    expect(planRearPursuit([existing(0, 30, 'rear-pursuer')], 700,
      0, false, false, false, random)).toBeNull();
    expect(planRearPursuit([existing(6.4, -50, 'rear-pursuer')], 700,
      0, false, false, false, random)).toBeNull();
  });
});
