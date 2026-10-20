export const BIOMES = ['forest', 'desert', 'snow', 'city', 'water'] as const;
export type Biome = typeof BIOMES[number];
export const BIOME_DISTANCE = 1000;

export function biomeAt(distance: number): Biome {
  const stage = Math.floor(Math.max(0, distance) / BIOME_DISTANCE);
  return BIOMES[stage % BIOMES.length];
}

export function roadCenterAt(distance: number): number {
  // Smooth sum of long-wavelength curves. The maximum lateral shift does not
  // change lane count, segment connectivity or driving collision coordinates.
  return Math.sin(distance / 190) * 2.7 + Math.sin(distance / 370) * 1.1;
}

export function isWaterBiome(biome: Biome): boolean { return biome === 'water'; }

export function seededRandom(seed: number): number {
  let x = seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x >>> 0) + 0.5) / 4294967296;
}
