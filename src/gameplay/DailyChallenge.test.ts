import { describe, expect, it } from 'vitest';
import {
  challengeDate, challengeSeed, seededGenerator, dailyRecordKey, bestDailyScore,
} from './DailyChallenge';

describe('daily challenge', () => {
  it('uses a stable UTC key across runs and timezones', () => {
    expect(challengeDate(new Date('2026-10-20T23:59:00Z'))).toBe('2026-10-20');
    expect(challengeDate(new Date('2026-10-21T00:00:00Z'))).toBe('2026-10-21');
    expect(dailyRecordKey('2026-10-20')).toBe('spyhunter27-daily-2026-10-20');
  });
  it('produces deterministic and distinct encounter draws', () => {
    const seed = challengeSeed('2026-10-20');
    const a = seededGenerator(seed);
    const b = seededGenerator(seed);
    expect([a(), a(), a(), a()]).toEqual([b(), b(), b(), b()]);
    expect(challengeSeed('2026-10-21')).not.toBe(seed);
    const draws = Array.from({ length: 20 }, () => a());
    expect(draws.every(x => x >= 0 && x < 1)).toBe(true);
  });
  it('only improves a daily personal best', () => {
    expect(bestDailyScore(2500, 1800)).toBe(2500);
    expect(bestDailyScore(2500, 3100.8)).toBe(3100);
    expect(bestDailyScore(Number.NaN, -100)).toBe(0);
  });
  it('rejects malformed challenge dates', () => {
    expect(() => challengeSeed('tomorrow')).toThrow();
  });
});
