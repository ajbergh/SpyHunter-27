import { describe, expect, it } from 'vitest';
import { accuracyPercent, formatMissionTime, formatMissionDistance } from './SessionMetrics';

describe('post-mission results', () => {
  it('handles zero shots, invalid values and precision safely', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
    expect(accuracyPercent(8, 3)).toBe(38);
    expect(accuracyPercent(10, 12)).toBe(100);
    expect(accuracyPercent(Number.NaN, 1)).toBe(0);
  });
  it('formats survival time and world travel distance', () => {
    expect(formatMissionTime(125.7)).toBe('02:05');
    expect(formatMissionTime(-2)).toBe('00:00');
    expect(formatMissionDistance(3456)).toBe('3.46 KM');
  });
});
