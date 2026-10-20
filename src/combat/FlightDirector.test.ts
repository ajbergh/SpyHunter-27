import { describe, expect, it } from 'vitest';
import {
  chooseHelicopterProfile, helicopterTargetX, bombingLane, helicopterCooldown,
} from './FlightDirector';

describe('deterministic helicopter attack profiles', () => {
  it('unlocks rare ace gunships only after the early campaign', () => {
    expect(chooseHelicopterProfile(300, () => 0)).toBe('patrol');
    expect(chooseHelicopterProfile(1900, () => 0.1)).toBe('ace');
    expect(chooseHelicopterProfile(1900, () => 0.5)).toBe('patrol');
  });
  it('elite craft strafe rather than staying locked on the player', () => {
    expect(helicopterTargetX('patrol', 1, 0)).toBe(1);
    expect(helicopterTargetX('ace', 1, 1)).not.toBe(1);
    expect(Math.abs(helicopterTargetX('ace', 7, 2))).toBeLessThanOrEqual(6.4);
  });
  it('alternates individually telegraphed offset attacks with gaps for evasion', () => {
    expect(bombingLane('patrol', 0, 2)).toBe(0);
    expect(bombingLane('ace', 0, 0)).toBe(0);
    expect(bombingLane('ace', 0, 1)).toBe(2.5);
    expect(bombingLane('ace', 0, 3)).toBe(-2.5);
    expect(helicopterCooldown('ace')).toBeLessThan(helicopterCooldown('patrol'));
  });
});
