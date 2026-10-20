import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { VISUAL_PROFILES, shadowResolution } from './VisualDirector';
import { BIOMES } from '../world/WorldPlan';

describe('cinematic world grades', () => {
  it('has individually authored atmosphere and directional color for all biomes', () => {
    const colors = new Set<number>();
    for (const biome of BIOMES) {
      const grade = VISUAL_PROFILES[biome];
      expect(grade.fogDensity).toBeGreaterThan(0);
      expect(grade.fogDensity).toBeLessThan(0.012);
      expect(grade.exposure).toBeGreaterThan(0.9);
      expect(grade.exposure).toBeLessThan(1.5);
      expect(new THREE.Color(grade.key).getHex()).toBe(grade.key);
      colors.add(grade.fog);
    }
    expect(colors.size).toBe(5);
  });
  it('scales soft shadow budgets to the graphics setting', () => {
    expect(shadowResolution('low')).toBe(0);
    expect(shadowResolution('medium')).toBe(1024);
    expect(shadowResolution('high')).toBe(2048);
  });
});
