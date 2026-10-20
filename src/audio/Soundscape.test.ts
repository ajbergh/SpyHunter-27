import { describe, expect, it } from 'vitest';
import { SOUNDSCAPES, musicPace } from './Soundscape';
import { BIOMES } from '../world/WorldPlan';

describe('adaptive original score arrangements', () => {
  it('covers each streamed environment with its own score and engine tone', () => {
    for (const biome of BIOMES) {
      const arrangement = SOUNDSCAPES[biome];
      expect(arrangement.score).toHaveLength(16);
      expect(arrangement.engineRate).toBeGreaterThan(2);
      expect(arrangement.score.some(note => note > 0)).toBe(true);
    }
    expect(SOUNDSCAPES.city.score).not.toEqual(SOUNDSCAPES.snow.score);
    expect(SOUNDSCAPES.water.engineBase).not.toBe(SOUNDSCAPES.forest.engineBase);
  });
  it('accelerates beats under threat without skipping calm pacing or inventing tempos', () => {
    for (const biome of BIOMES) {
      expect(musicPace(biome, 0)).toBeCloseTo(SOUNDSCAPES[biome].tempoSeconds);
      expect(musicPace(biome, 3)).toBeLessThan(musicPace(biome, 1));
      expect(musicPace(biome, 6)).toBeLessThan(musicPace(biome, 3));
      expect(musicPace(biome, 6)).toBeGreaterThan(.1);
    }
  });
});
