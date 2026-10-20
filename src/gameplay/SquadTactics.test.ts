import { describe, expect, it } from 'vitest';
import { PINCER_HALF_SPREAD, planSquadTactics, type SquadThreat } from './SquadTactics';

const car = (overrides: Partial<SquadThreat> = {}): SquadThreat => ({
  squadId: 1, hostile: true, hp: 2, role: 'interceptor',
  state: 'intercept', x: -6.4, z: -25, ...overrides,
});

describe('coordinated and fair enemy squad tactics', () => {
  it('forms distinct flanks while reserving a central escape corridor', () => {
    const left = car();
    const right = car({ x: 6.4, role: 'switchblade', z: -35 });
    const orders = planSquadTactics([left, right], 0);
    expect(orders.size).toBe(2);
    expect(orders.get(left)?.targetX).toBe(-PINCER_HALF_SPREAD);
    expect(orders.get(right)?.targetX).toBe(PINCER_HALF_SPREAD);
    expect(orders.get(right)!.targetX - orders.get(left)!.targetX).toBeGreaterThan(7);
  });
  it('avoids coordinated pincer pressure when the player is pinned at a roadside', () => {
    expect(planSquadTactics([car(), car({ x: 6.4 })], 6.8).size).toBe(0);
    expect(planSquadTactics([car(), car({ x: 6.4 })], -6.8).size).toBe(0);
  });
  it('does not coordinate disrupted, destroyed, solitary or unpaired attackers', () => {
    expect(planSquadTactics([car(), car({ x: 6.4, state: 'disrupted' })], 0).size).toBe(0);
    expect(planSquadTactics([car(), car({ x: 6.4, hp: 0 })], 0).size).toBe(0);
    expect(planSquadTactics([car(), car({ x: 6.4, squadId: 3 })], 0).size).toBe(0);
    expect(planSquadTactics([car(), car({ x: 6.4, role: 'blocker' })], 0).size).toBe(0);
    expect(planSquadTactics([car(), car({ x: 6.4 })], 0, true).size).toBe(0);
  });
  it('avoids sandwiching a civilian driver into a coordinated attack', () => {
    const enemyA = car();
    const enemyB = car({ x: 6.4 });
    const civilian = car({ squadId: null, hostile: false, role: 'civilian', x: 0, z: -28 });
    expect(planSquadTactics([enemyA, enemyB, civilian], 0).size).toBe(0);
    expect(planSquadTactics([enemyA, enemyB, civilian], -2).size).toBe(0);
  });
  it('works with encounter timing, not spawning enemies outside attack range', () => {
    expect(planSquadTactics([car({ z: -60 }), car({ x: 6.4, z: -70 })], 0).size).toBe(0);
    expect(planSquadTactics([car({ z: 12 }), car({ x: 6.4, z: 13 })], 0).size).toBe(0);
  });
});
