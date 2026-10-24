import { describe, expect, it } from 'vitest';
import { ROAD_SHEEN, roadSheenStrength } from './RoadSheen';

describe('bounded shared biome road-contact reflectance', () => {
  it('uses fixed grades with restrained city and snow reflections', () => {
    expect(roadSheenStrength('city', 'high', false)).toBe(0.34);
    expect(roadSheenStrength('snow', 'high', false)).toBe(0.22);
    expect(roadSheenStrength('forest', 'high', false)).toBe(0.10);
    expect(roadSheenStrength('desert', 'high', false)).toBe(0.06);
    expect(roadSheenStrength('city', 'high', false))
      .toBeGreaterThan(roadSheenStrength('desert', 'high', false));
    expect(ROAD_SHEEN.city.stretch).toBeGreaterThan(ROAD_SHEEN.desert.stretch);
    expect(new Set(Object.values(ROAD_SHEEN).map(grade => grade.tint)).size)
      .toBeGreaterThan(2);
  });
  it('culls water and Low presets and retains a single smaller Medium grade', () => {
    for (const biome of ['forest', 'desert', 'snow', 'city', 'water'] as const) {
      expect(roadSheenStrength(biome, 'low', false)).toBe(0);
      expect(roadSheenStrength(biome, 'high', true)).toBe(0);
      expect(roadSheenStrength(biome, 'medium', false)).toBeCloseTo(
        ROAD_SHEEN[biome].strength * 0.57,
      );
      expect(roadSheenStrength(biome, 'medium', false))
        .toBeLessThanOrEqual(roadSheenStrength(biome, 'high', false));
      expect(ROAD_SHEEN[biome].strength).toBeGreaterThanOrEqual(0);
      expect(ROAD_SHEEN[biome].strength).toBeLessThanOrEqual(0.34);
    }
    expect(roadSheenStrength('water', 'high', false)).toBe(0);
    expect(ROAD_SHEEN.city).toBe(ROAD_SHEEN.city);
  });
});
