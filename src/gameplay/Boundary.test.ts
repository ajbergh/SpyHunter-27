import { describe, expect, it } from 'vitest';
import { boundaryStrike, gradeBoathouseEntry } from './Boundary';

describe('guardrails and shorelines', () => {
  it('detects fast outward rail contact, but not inward recovery', () => {
    expect(boundaryStrike(8.25, 1, 40, false)).toBe(true);
    expect(boundaryStrike(-8.25, -1, 40, false)).toBe(true);
    expect(boundaryStrike(8.25, -1, 40, false)).toBe(false);
    expect(boundaryStrike(8.25, 1, 12, false)).toBe(false);
    expect(boundaryStrike(0, 1, 54, false)).toBe(false);
  });
  it('evaluates water bank contact at a lower dangerous speed', () => {
    expect(boundaryStrike(8.25, 1, 22, true)).toBe(true);
    expect(boundaryStrike(8.25, 1, 22, false)).toBe(false);
  });
});
describe('boathouse entry alignment', () => {
  it('awards a safe transition when aligned at driving speed', () => {
    expect(gradeBoathouseEntry(0, 30)).toBe('clean');
    expect(gradeBoathouseEntry(4.2, 42)).toBe('clean');
  });
  it('penalizes side-wall impacts or unreasonable entry speed', () => {
    expect(gradeBoathouseEntry(-6.2, 30)).toBe('scrape');
    expect(gradeBoathouseEntry(6.2, 30)).toBe('scrape');
    expect(gradeBoathouseEntry(0, 55)).toBe('scrape');
    expect(gradeBoathouseEntry(0, 5)).toBe('scrape');
  });
});
