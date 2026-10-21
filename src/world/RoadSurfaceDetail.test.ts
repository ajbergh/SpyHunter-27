import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { makeRoadSurfaceDetail, roadMarkings } from './RoadSurfaceDetail';

describe('cinematic road-surface wear', () => {
  it('deterministically populates six tire-contact tracks without blocking driving lanes', () => {
    const a = roadMarkings(600, 'city', 'high');
    expect(a).toEqual(roadMarkings(600, 'city', 'high'));
    expect(a).toHaveLength(30);
    expect(a.every(m => Math.abs(m.x) < 7.8 && m.width <= 0.35)).toBe(true);
    expect(roadMarkings(600, 'city', 'low')).toHaveLength(12);
    expect(roadMarkings(600, 'water', 'high')).toHaveLength(0);
  });
  it('uses at most one packed decal draw and one instanced set of reflector studs', () => {
    const group = makeRoadSurfaceDetail(600, 'city', 'high');
    expect(group.children).toHaveLength(2);
    expect(group.children[0]).toBeInstanceOf(THREE.Mesh);
    expect(group.children[1]).toBeInstanceOf(THREE.InstancedMesh);
    expect((group.children[1] as THREE.InstancedMesh).count).toBe(22);
    expect(group.children[0].name).not.toBe('ReflectiveRoadStuds');
    expect((group.children[0] as THREE.Mesh).geometry.getAttribute('position').count)
      .toBeGreaterThan(100);
    const low = makeRoadSurfaceDetail(600, 'forest', 'low');
    expect(low.children).toHaveLength(1);
    expect(makeRoadSurfaceDetail(600, 'water', 'high').children).toHaveLength(0);
  });
});
