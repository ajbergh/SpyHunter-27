import { describe, expect, it } from 'vitest';
import { buildTerrain, terrainRelief, terrainColor, TERRAIN_COLUMNS } from './TerrainDetail';
import { BIOMES } from './WorldPlan';

describe('authored continuous sculpted road surroundings', () => {
  it('maintains road clearance and finite terrain relief through every biome', () => {
    for (const biome of BIOMES) {
      for (const distance of [0, 500, 1000, 1350, 2100, 3200, 4300]) {
        expect(terrainRelief(biome, distance, 10.8)).toBe(0);
        for (const x of TERRAIN_COLUMNS) {
          expect(Number.isFinite(terrainRelief(biome, distance, x))).toBe(true);
        }
      }
    }
    expect(terrainRelief('snow', 1234, 90)).toBeGreaterThan(10);
  });
  it('produces deterministic closed-grid geometry with biome tint', () => {
    const geometry = buildTerrain(450, 'desert');
    expect(geometry.getAttribute('position').count).toBe(21 * TERRAIN_COLUMNS.length);
    expect(geometry.index!.count).toBe(20 * (TERRAIN_COLUMNS.length - 1) * 6);
    const c = geometry.getAttribute('color');
    expect(c.count).toBe(geometry.getAttribute('position').count);
    expect(terrainColor('snow', 2000, 65).getHex()).not.toBe(terrainColor('desert', 2000, 65).getHex());
  });
  it('maintains continuous world coordinates across streaming tile boundaries', () => {
    const a = terrainRelief('forest', 600, 75);
    const b = terrainRelief('forest', 600, 75);
    expect(a).toBe(b);
  });
});
