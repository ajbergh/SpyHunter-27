import { describe, expect, it } from 'vitest';
import { BIOMES, biomeAt, roadCenterAt, seededRandom } from './WorldPlan';

describe('continuous environment plan', () => {
  it('cycles five biomes deterministically', () => {
    expect(BIOMES.map((_, i) => biomeAt(i * 1000 + 50))).toEqual([...BIOMES]);
    expect(biomeAt(5050)).toBe('forest');
    expect(biomeAt(-50)).toBe('forest');
  });
  it('gives smooth road centers across segment boundaries', () => {
    for (const s of [0, 50, 1000, 3500]) {
      expect(Math.abs(roadCenterAt(s + .0001) - roadCenterAt(s))).toBeLessThan(0.001);
    }
  });
  it('reproducibly generates world variations from seed', () => {
    expect(seededRandom(743)).toBe(seededRandom(743));
    expect(seededRandom(743)).not.toBe(seededRandom(744));
  });
});
