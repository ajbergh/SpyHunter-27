import { describe, expect, it } from 'vitest';
import { combatCue, shouldSoundThreat, type ObservedVehicle } from './CombatReadability';

const vehicle = (x: number, z: number, hostile = true,
  halfWidth = 1.13, hp = 2): ObservedVehicle =>
  ({ x, z, halfWidth, hostile, hp });

describe('live tactical threat presentation', () => {
  it('distinguishes front, rear, both and no contact using player-relative depth', () => {
    expect(combatCue([], 8, false, false).direction).toBe('none');
    expect(combatCue([vehicle(-6.4, -25)], 8, false, false).direction).toBe('front');
    expect(combatCue([vehicle(6.4, 30)], 8, false, false).direction).toBe('rear');
    expect(combatCue([vehicle(-6.4, -25), vehicle(6.4, 30)], 8, true, false))
      .toEqual({ direction: 'both', formationActive: true, centerClear: true, guideCenter: true });
    expect(combatCue([vehicle(-6.4, -25)], 8, false, true))
      .toEqual({ direction: 'none', formationActive: false, centerClear: false, guideCenter: false });
  });

  it('never calls the center clear while civilians or wide blockers occupy it', () => {
    const ambush = [vehicle(-6.4, -30), vehicle(6.4, 30)];
    expect(combatCue([...ambush, vehicle(0, -4, false)], 8, true, false))
      .toMatchObject({ centerClear: false, guideCenter: false, formationActive: true });
    expect(combatCue([...ambush, vehicle(4.1, -4, true, 2.25)], 8, true, false))
      .toMatchObject({ centerClear: false, guideCenter: false });
    expect(combatCue([...ambush, vehicle(0, -4, false, 1.13, 0)], 8, true, false))
      .toMatchObject({ centerClear: true, guideCenter: true });
    expect(combatCue([...ambush, vehicle(0, -70, false)], 8, true, false))
      .toMatchObject({ centerClear: true, guideCenter: true });
  });

  it('ignores hostiles behind visibility range and defeated actors', () => {
    expect(combatCue([vehicle(0, -150), vehicle(0, 120)], 8, false, false).direction)
      .toBe('none');
    expect(combatCue([vehicle(0, -18, true, 1.13, 0)], 8, false, false).direction)
      .toBe('none');
  });

  it('plays audio only on meaningful changes after the cooldown', () => {
    expect(shouldSoundThreat('none', 'front', 0)).toBe(true);
    expect(shouldSoundThreat('front', 'front', 0)).toBe(false);
    expect(shouldSoundThreat('front', 'both', 0)).toBe(true);
    expect(shouldSoundThreat('none', 'rear', 2.4)).toBe(false);
    expect(shouldSoundThreat('rear', 'none', 0)).toBe(false);
  });
});
