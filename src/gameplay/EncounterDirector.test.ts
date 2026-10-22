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
  it('keeps fork encounters inside the selected physical corridor', () => {
    const left = planEncounter([], 720, () => 0.9, 'left', [-6.4]);
    expect(left.spawns).toHaveLength(1);
    expect(left.spawns[0].x).toBe(-6.4);
    expect(left.spawns[0].hostile).toBe(false);
    const right = planEncounter([], 720, () => 0.8, 'right', [6.4]);
    expect(right.spawns).toHaveLength(1);
    expect(right.spawns[0].x).toBe(6.4);
    expect(right.spawns[0].hostile).toBe(true);
  });
  it('defers a fork encounter when its only corridor is occupied', () => {
    const encounter = planEncounter([{ x: 6.4, z: -91 }], 720, () => 0, 'right', [6.4]);
    expect(encounter.spawns).toHaveLength(0);
  });


  it('introduces isolated head-on enemies after escalation without denying escape lanes', () => {
    const values = [0.5, 0.5, 0.5, 0.95, 0.93];
    let index = 0;
    const encounter = planEncounter([], 850, () => values[index++ % values.length]);
    expect(encounter.type).toBe('traffic');
    expect(encounter.spawns).toHaveLength(1);
    expect(encounter.spawns[0].oncoming).toBe(true);
    expect(encounter.spawns[0].hostile).toBe(true);
    expect(encounter.spawns[0].variant).toBe(0);
    expect(encounter.spawns[0].z).toBe(-90);

    let leftIndex = 0;
    const left = planEncounter([], 850, () => values[leftIndex++ % values.length], 'left');
    expect(left.spawns[0].oncoming).not.toBe(true);
    const early = planEncounter([], 150, () => 0.95);
    expect(early.spawns[0].oncoming).not.toBe(true);
  });

  it('keeps coordinated attackers forward-facing rather than mixing with head-on rushes', () => {
    const encounter = planEncounter([], 900, () => 0);
    expect(encounter.type).toBe('pursuit-pair');
    expect(encounter.spawns.every(s => !s.oncoming)).toBe(true);
  });

});
