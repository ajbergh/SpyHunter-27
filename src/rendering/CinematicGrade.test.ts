import { describe, expect, it } from 'vitest';
import { BIOMES } from '../world/WorldPlan';
import { BLOOM_GRADES, highlightBloom, emissiveAccentIntensity } from './CinematicGrade';

describe('restrained HDR cinema grading', () => {
  it('preserves hero paint and restricts bloom to bright emitters', () => {
    for (const biome of BIOMES) {
      const grade = highlightBloom(biome);
      expect(grade.threshold).toBeGreaterThan(1.3);
      expect(grade.strength).toBeLessThan(0.4);
      expect(grade.radius).toBeLessThan(0.35);
      expect(grade).toBe(BLOOM_GRADES[biome]);
    }
  });
  it('reserves neon for night and avoids blown-out shoulder accents', () => {
    expect(highlightBloom('city').strength).toBeGreaterThan(highlightBloom('forest').strength);
    expect(emissiveAccentIntensity('bodyline')).toBeLessThan(emissiveAccentIntensity('headlamp'));
    expect(emissiveAccentIntensity('headlamp')).toBeLessThan(emissiveAccentIntensity('sign'));
  });
});
