import type { Quality } from '../gameplay/Settings';
import type { Biome } from '../world/WorldPlan';

export interface RoadSheenGrade {
  readonly strength: number;
  readonly tint: number;
  readonly stretch: number;
}

/**
 * Static painterly reflectance near the interceptor headlights, not
 * screen-space reflections or dynamic light sources. Use immutable references
 * so per-frame shader updates never allocate grade objects.
 */
export const ROAD_SHEEN: Readonly<Record<Biome, RoadSheenGrade>> = {
  forest: { strength: 0.10, tint: 0xffd7a1, stretch: 0.80 },
  desert: { strength: 0.06, tint: 0xffc68d, stretch: 0.69 },
  snow:   { strength: 0.22, tint: 0xdaf2ff, stretch: 1.08 },
  city:   { strength: 0.34, tint: 0x78d9f3, stretch: 1.15 },
  water:  { strength: 0, tint: 0x78d9f3, stretch: 0 },
};

export function roadSheenStrength(biome: Biome, quality: Quality, boat: boolean): number {
  if (boat || quality === 'low') return 0;
  return ROAD_SHEEN[biome].strength * (quality === 'high' ? 1 : 0.57);
}
