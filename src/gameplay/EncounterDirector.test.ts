import { describe, expect, it } from 'vitest';
import { planEncounter } from './EncounterDirector';

describe('encounter director', () => {
  it('never fills all three lanes in one encounter', () => {
    const encounter = planEncounter([], 800, () => 0);
    expect(encounter.type).toBe('pursuit-pair');
    expect(encounter.spawns).toHaveLength(2);
    expect(new Set(encounter.spawns.map(s => s.x)).size).toBe(2);
    expect(encounter.spawns[0].z - encounter.spawns[1].z).toBe(12);
  });
  it('keeps early play in single-vehicle encounters', () => {
    const encounter = planEncounter([], 0, () => 0);
    expect(encounter.spawns).toHaveLength(1);
  });
  it('leaves existing occupied lanes free and safely defers impossible waves', () => {
    const occupied = [{x: -6.4,z:-90},{x:0,z:-91}];
    const encounter = planEncounter(occupied, 1000, () => 0);
    expect(encounter.spawns[0].x).toBe(6.4);
    expect(encounter.spawns).toHaveLength(1);
    expect(planEncounter([...occupied,{x:6.4,z:-89}],1000,()=>0).spawns).toHaveLength(0);
  });
  it('can generate a motorcycle encounter at high distance', () => {
    const draws = [0, 0, 0.2, 1];
    let cursor = 0;
    const encounter = planEncounter([], 200, () => draws[cursor++ % draws.length]);
    expect(encounter.spawns[0].variant).toBe(4);
  });
});
