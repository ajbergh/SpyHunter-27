import { describe, expect, it } from 'vitest';
import { grainAt, pavementPixel, PAVEMENT_STYLE } from './PavementMaterials';
import { BIOMES } from '../world/WorldPlan';

describe('procedural pavement microtextures', () => {
  it('generates repeatable bounded deterministic samples', () => {
    expect(grainAt(11, 31, 5)).toBe(grainAt(11, 31, 5));
    expect(grainAt(11, 31, 5)).not.toBe(grainAt(12, 31, 5));
    for (let y = 0; y < 200; y += 17) {
      for (let x = 0; x < 200; x += 13) {
        for (const biome of BIOMES) {
          const value = pavementPixel(x, y, biome);
          expect(value).toBeGreaterThanOrEqual(18);
          expect(value).toBeLessThanOrEqual(255);
        }
      }
    }
  });
  it('provides differentiated roughness/wetness for city and snow', () => {
    expect(PAVEMENT_STYLE.city.roughness).toBeLessThan(PAVEMENT_STYLE.desert.roughness);
    expect(PAVEMENT_STYLE.snow.wetness).toBeGreaterThan(PAVEMENT_STYLE.forest.wetness);
  });
});
