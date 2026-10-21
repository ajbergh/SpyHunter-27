import { describe, expect, it } from 'vitest';
import { CAMERA_FRAME, cinematicFov, screenVerticalAt, nearRoadScreenFraction } from './CameraFraming';
import { PLAYER_Z } from '../core/logic';

describe('cinematic driving camera composition', () => {
  it('magnifies the hero vehicle without cropping it or obscuring road ahead', () => {
    const car = screenVerticalAt(PLAYER_Z);
    const distant = screenVerticalAt(-80);
    expect(car).toBeGreaterThan(0.76);
    expect(car).toBeLessThan(0.94);
    expect(distant).toBeGreaterThan(0.05);
    expect(distant).toBeLessThan(0.50);
    expect(nearRoadScreenFraction(648 / 680, PLAYER_Z)).toBeGreaterThan(0.68);
    expect(nearRoadScreenFraction(648 / 680, PLAYER_Z)).toBeLessThan(0.88);
  });
  it('responds mildly to speed and fully disables zoom movement under Reduced Motion', () => {
    expect(cinematicFov(0, false)).toBe(CAMERA_FRAME.baseFov);
    expect(cinematicFov(60, false)).toBeGreaterThan(CAMERA_FRAME.baseFov);
    expect(cinematicFov(110, false)).toBe(CAMERA_FRAME.maxFov);
    expect(cinematicFov(80, true)).toBe(CAMERA_FRAME.baseFov);
  });
});
