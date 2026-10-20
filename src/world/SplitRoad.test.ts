import { describe, expect, it } from 'vitest';
import {
  splitMedianHalfWidth, splitDangerous, upcomingSplit, escapeFromMedian,
  SPLIT_START, SPLIT_END, SPLIT_PERIOD,
} from './SplitRoad';

describe('divided highway geometry and collisions', () => {
  it('opens smoothly, holds two driveable corridors and reconnects', () => {
    expect(splitMedianHalfWidth(SPLIT_START - 1)).toBe(0);
    expect(splitMedianHalfWidth(SPLIT_START)).toBe(0);
    expect(splitMedianHalfWidth(630)).toBeGreaterThan(2.6);
    expect(splitMedianHalfWidth(SPLIT_END)).toBe(0);
    expect(Math.abs(splitMedianHalfWidth(550.01) - splitMedianHalfWidth(550))).toBeLessThan(0.001);
  });
  it('detects driving into the physical median but leaves both outside routes safe', () => {
    expect(splitDangerous(640, 0)).toBe(true);
    expect(splitDangerous(640, 6.4)).toBe(false);
    expect(splitDangerous(640, -6.4)).toBe(false);
    expect(splitDangerous(800, 0)).toBe(false);
  });
  it('warns before the divided stretch, never in water', () => {
    expect(upcomingSplit(455)).toBe(95);
    expect(upcomingSplit(440)).toBeNull();
    expect(upcomingSplit(610)).toBeNull();
    expect(upcomingSplit(SPLIT_PERIOD * 2 + 475)).toBeNull(); // water
  });
  it('moves a struck vehicle to a playable branch after contact', () => {
    const x = escapeFromMedian(0, 640);
    expect(splitDangerous(640, x)).toBe(false);
    expect(splitDangerous(640, escapeFromMedian(-0.4, 640))).toBe(false);
  });
});
