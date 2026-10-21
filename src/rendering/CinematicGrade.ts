import type { Biome } from '../world/WorldPlan';

/**
 * Bloom operates on the pre-tone-mapped HDR frame. A threshold >1 keeps
 * bright, unlit bodywork out of the glow mask so the hero silhouette survives.
 * All five environments maintain their own restrained highlight budgets.
 */
export interface BloomGrade {
  strength: number;
  radius: number;
  threshold: number;
}
export const BLOOM_GRADES: Readonly<Record<Biome, BloomGrade>> = {
  forest: { strength: 0.18, radius: 0.22, threshold: 1.68 },
  desert: { strength: 0.16, radius: 0.22, threshold: 1.82 },
  snow:   { strength: 0.14, radius: 0.18, threshold: 1.75 },
  city:   { strength: 0.29, radius: 0.28, threshold: 1.42 },
  water:  { strength: 0.20, radius: 0.23, threshold: 1.61 },
};

export function highlightBloom(biome: Biome): BloomGrade {
  return BLOOM_GRADES[biome];
}

/** Emissive paints are display accents, not substitute headlights. */
export function emissiveAccentIntensity(kind: 'bodyline' | 'headlamp' | 'brake' | 'sign'): number {
  return { bodyline: 0.28, headlamp: 0.98, brake: 0.75, sign: 1.35 }[kind];
}
