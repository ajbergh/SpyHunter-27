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
  it('does not pincer with disrupted, destroyed, solitary or unpaired attackers', () => {
    expect(planSquadTactics([car(), car({ x: 6.4, state: 'disrupted' })], 0).size).toBe(0);
    expect([...planSquadTactics([car(), car({ x: 6.4, hp: 0 })], 0).values()].map(o => o.type)).toEqual(['retreat']);
    expect([...planSquadTactics([car(), car({ x: 6.4, squadId: 3 })], 0).values()].every(o => o.type === 'retreat')).toBe(true);
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
  it('makes surviving hostile retreat after its squadmate is destroyed', () => {
    const survivor = car({ x: -2, z: -24 });
    const fallen = car({ x: 3, hp: 0, z: -23 });
    const orders = planSquadTactics([survivor, fallen], 0);
    expect(orders.size).toBe(1);
    expect(orders.get(survivor)).toEqual({ type: 'retreat', targetX: -7.5 });
  });
  it('does not retreat merely because its partner is farther away or disrupted', () => {
    const lead = car({ z: -29 });
    const rear = car({ x: 6.4, z: -65 });
    expect(planSquadTactics([lead, rear], 0).size).toBe(0);
    const smoked = car({ x: 6.4, z: -30, state: 'disrupted' });
    expect(planSquadTactics([lead, smoked], 0).size).toBe(0);
    expect(planSquadTactics([lead, car({ x: 6.4, state: 'spinning' })], 0).size).toBe(0);
  });
  it('does not retreat into a hazardous fork while tactics are suppressed', () => {
    const survivor = car({ x: 2, z: -20 });
    expect(planSquadTactics([survivor], 0, true).size).toBe(0);
    expect(planSquadTactics([survivor], 6.8).get(survivor)?.type).toBe('retreat');
  });

});
