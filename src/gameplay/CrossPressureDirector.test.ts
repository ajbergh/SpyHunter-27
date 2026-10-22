import { describe, expect, it } from 'vitest';
import { planCrossPressure, type CrossPressureTraffic } from './CrossPressureDirector';

const drawLeft = () => 0.2;
const car = (x: number, z: number, hp = 1, role = 'civilian'): CrossPressureTraffic =>
  ({ x, z, hp, role });

describe('cross-pressure encounter admission', () => {
  it('stages two opposing outer-lane attackers and leaves a full center lane empty', () => {
    const plan = planCrossPressure([], 1450, 0, false, false, false, drawLeft);
    expect(plan).toEqual({
      front: { x: -6.4, z: -79, speed: 11 },
      rear: { x: 6.4, z: 36, speed: 47.5 },
      escapeLane: 0,
    });
    expect(Math.abs(plan!.front.x - plan!.rear.x)).toBe(12.8);
    expect(Math.abs(plan!.escapeLane - plan!.front.x)).toBe(6.4);
    expect(Math.abs(plan!.escapeLane - plan!.rear.x)).toBe(6.4);
    const reverse = planCrossPressure([], 1450, 0, false, false, false, () => 0.9);
    expect(reverse?.front.x).toBe(6.4);
    expect(reverse?.rear.x).toBe(-6.4);
    expect(reverse?.escapeLane).toBe(0);
  });

  it('rejects early combat, players near edge, water, fork or van', () => {
    expect(planCrossPressure([], 1149, 0, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([], 1450, 6.4, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([], 1450, -2.41, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([], 1450, 0, true, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([], 1450, 0, false, true, false, drawLeft)).toBeNull();
    expect(planCrossPressure([], 1450, 0, false, false, true, drawLeft)).toBeNull();
  });

  it('will not add an ambush to active traffic or a civilian occupying the center', () => {
    expect(planCrossPressure([car(0, -30)], 1450, 0, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([car(-6.4, -80)], 1450, 0, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([car(6.4, 36, 2, 'rear-pursuer')],
      1450, 0, false, false, false, drawLeft)).toBeNull();
    expect(planCrossPressure([car(0, -125), car(6.4, 65)], 1450, 0,
      false, false, false, drawLeft)).not.toBeNull();
    expect(planCrossPressure([car(0, -40, 0)], 1450, 0,
      false, false, false, drawLeft)).not.toBeNull();
  });
});
