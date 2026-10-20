import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { landmarkAt, makeLandmark } from './Landmarks';
import { BIOMES } from './WorldPlan';

describe('original streamed environmental landmarks', () => {
  it('places landmarks sparsely according to quality', () => {
    expect(landmarkAt(240, 'high')).toBe(true);
    expect(landmarkAt(270, 'high')).toBe(false);
    expect(landmarkAt(360, 'medium')).toBe(true);
    expect(landmarkAt(240, 'low')).toBe(false);
  });
  it('provides unique dimensional silhouettes for every environment', () => {
    for (const biome of BIOMES) {
      const group = makeLandmark(biome, 0.6);
      const meshes = group.children.filter(x => x instanceof THREE.Mesh);
      expect(meshes.length).toBeGreaterThan(7);
      const bounds = new THREE.Box3().setFromObject(group);
      expect(bounds.max.y).toBeGreaterThan(8);
      expect(Number.isFinite(bounds.max.x)).toBe(true);
    }
    expect(makeLandmark('forest', 0.3).name).toBe('Landmark:forest');
  });
});
