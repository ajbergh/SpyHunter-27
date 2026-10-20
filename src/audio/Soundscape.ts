import type { Biome } from '../world/WorldPlan';

export interface Soundscape {
  readonly engineBase: number;
  readonly engineRate: number;
  readonly tempoSeconds: number;
  readonly score: readonly number[];
  readonly percussionRate: number;
  readonly undercurrent: number;
}

/** Original five-biome arcade score: distinct harmonic/rhythmic profiles. */
export const SOUNDSCAPES: Readonly<Record<Biome, Soundscape>> = {
  forest: {
    engineBase: 48, engineRate: 3.5, tempoSeconds: .29, percussionRate: 4,
    undercurrent: 73.42,
    score: [174.61, 0, 233.08, 220, 0, 196, 261.63, 0,
      146.83, 174.61, 0, 293.66, 220, 0, 164.81, 196],
  },
  desert: {
    engineBase: 45, engineRate: 3.3, tempoSeconds: .315, percussionRate: 4,
    undercurrent: 65.41,
    score: [164.81, 0, 0, 196, 246.94, 0, 174.61, 0,
      220, 0, 164.81, 0, 293.66, 220, 0, 146.83],
  },
  snow: {
    engineBase: 51, engineRate: 2.9, tempoSeconds: .34, percussionRate: 8,
    undercurrent: 82.41,
    score: [220, 0, 0, 261.63, 0, 246.94, 0, 0,
      174.61, 0, 329.63, 0, 196, 0, 0, 246.94],
  },
  city: {
    engineBase: 55, engineRate: 3.65, tempoSeconds: .245, percussionRate: 2,
    undercurrent: 98,
    score: [196, 246.94, 0, 293.66, 220, 0, 329.63, 0,
      164.81, 246.94, 196, 0, 293.66, 0, 220, 174.61],
  },
  water: {
    engineBase: 58, engineRate: 2.8, tempoSeconds: .35, percussionRate: 4,
    undercurrent: 55,
    score: [146.83, 0, 196, 0, 220, 0, 174.61, 0,
      164.81, 0, 220, 0, 261.63, 0, 196, 0],
  },
};

export function musicPace(biome: Biome, threatCount: number): number {
  const base = SOUNDSCAPES[biome].tempoSeconds;
  return threatCount > 4 ? base * .75 : threatCount > 1 ? base * .87 : base;
}
