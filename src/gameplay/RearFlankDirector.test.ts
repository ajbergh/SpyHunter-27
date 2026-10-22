import { describe, expect, it } from 'vitest';
import { planRearFlank, type FlankTraffic } from './RearFlankDirector';

const car = (x: number, z: number, role = 'civilian', hp = 1): FlankTraffic =>
  ({ x, z, role, hp });

describe('deliberate rear flank planning', () => {
  const tail = car(0, 30, 'rear-pursuer', 2);
  it('chooses an adjacent empty lane instead of cutting into the player', () => {
    expect(planRearFlank([tail], tail, 0, 8)).toEqual({ targetX: -6.4 });
    expect(planRearFlank([tail], tail, -6.4, 8)).toEqual({ targetX: 0 });
    expect(planRearFlank([tail], tail, 6.4, 8)).toEqual({ targetX: 0 });
  });
  it('chooses the alternate lane when a forward civilian occupies the preferred path', () => {
    const occupied = car(-6.4, -10);
    expect(planRearFlank([tail, occupied], tail, 0, 8))
      .toEqual({ targetX: 6.4 });
    expect(planRearFlank([tail, occupied, car(6.4, -20)], tail, 0, 8))
      .toBeNull();
    expect(planRearFlank([tail, car(-6.4, -90)], tail, 0, 8))
      .toEqual({ targetX: -6.4 });
  });
  it('suppresses impossible late passes, unavailable cars and restricted road geometry', () => {
    expect(planRearFlank([tail], tail, 0, 8, true)).toBeNull();
    expect(planRearFlank([tail], { ...tail, z: 50 }, 0, 8)).toBeNull();
    expect(planRearFlank([tail], { ...tail, z: 16 }, 0, 8)).toBeNull();
    expect(planRearFlank([tail], { ...tail, hp: 0 }, 0, 8)).toBeNull();
    expect(planRearFlank([tail], { ...tail, role: 'head-on' }, 0, 8)).toBeNull();
  });
  it('ignores destroyed obstacles but reserves the lane of any active hostile', () => {
    expect(planRearFlank([tail, car(-6.4, 0, 'civilian', 0)], tail, 0, 8))
      .toEqual({ targetX: -6.4 });
    expect(planRearFlank([tail, car(-6.4, -5, 'head-on', 2)], tail, 0, 8))
      .toEqual({ targetX: 6.4 });
  });
});
