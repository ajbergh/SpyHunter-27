import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeRoadsideDetail, roadsideBudget, scatterPoints } from './RoadsideDetail';
import { BIOMES } from './WorldPlan';

describe('performance-budgeted biome foliage and street detail', () => {
  it('deterministically fills both shoulders while keeping the road corridor unobstructed', () => {
    for (const biome of BIOMES) {
      const a = scatterPoints(300, biome, 'high');
      const b = scatterPoints(300, biome, 'high');
      expect(a).toEqual(b);
      expect(a).toHaveLength(roadsideBudget(biome, 'high'));
      expect(a.some(p => p.x < 0)).toBe(true);
      expect(a.some(p => p.x > 0)).toBe(true);
      expect(a.every(p => Math.abs(p.x) > 10.9)).toBe(true);
      expect(a.every(p => Number.isFinite(p.y))).toBe(true);
      expect(roadsideBudget(biome, 'high')).toBeGreaterThan(roadsideBudget(biome, 'medium'));
      expect(roadsideBudget(biome, 'medium')).toBeGreaterThan(roadsideBudget(biome, 'low'));
    }
  });
  it('renders multiple foliage layers using a bounded number of draw calls', () => {
    for (const biome of BIOMES) {
      const root = makeRoadsideDetail(720, biome, 'high');
      const instances = root.children.filter(o => o instanceof THREE.InstancedMesh) as THREE.InstancedMesh[];
      expect(instances.length).toBeGreaterThanOrEqual(2);
      expect(instances.length).toBeLessThanOrEqual(5);
      expect(instances.every(m => m.count <= roadsideBudget(biome, 'high'))).toBe(true);
      expect(instances.every(m => m.geometry.boundingSphere !== null)).toBe(true);
    }
  });
  it('uses reduced-but-still-visible detail in low graphics mode', () => {
    const low = makeRoadsideDetail(390, 'forest', 'low');
    expect(low.children.filter(c => c instanceof THREE.InstancedMesh)).toHaveLength(3);
    expect((low.children[0] as THREE.InstancedMesh).count).toBe(roadsideBudget('forest', 'low'));
  });
});
