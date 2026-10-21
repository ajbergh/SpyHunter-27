import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeWetRoadMaterial, makeWetRoadReflections, wetRoadPatches } from './WetRoadReflections';

describe('neon wet-asphalt reflection pass', () => {
  it('keeps puddles deterministic, bounded and behind roadside barriers', () => {
    const high = wetRoadPatches(3345, 'high');
    expect(high).toEqual(wetRoadPatches(3345, 'high'));
    expect(high).toHaveLength(18);
    expect(wetRoadPatches(3345, 'medium')).toHaveLength(9);
    expect(wetRoadPatches(3345, 'low')).toHaveLength(0);
    expect(high.every(p => Math.abs(p.x) + p.width / 2 <= 9.1
      && Math.abs(p.z) + p.length / 2 <= 14.2)).toBe(true);
    expect(high.some(p => p.tint < 0.4)).toBe(true);
    expect(high.some(p => p.tint > 0.6)).toBe(true);
  });

  it('packs all reflections into one curved mesh, sharing one animated material', () => {
    const material = makeWetRoadMaterial();
    const one = makeWetRoadReflections(3320, 'high', material);
    const two = makeWetRoadReflections(3350, 'medium', material);
    expect(one).toBeInstanceOf(THREE.Mesh);
    expect(two).toBeInstanceOf(THREE.Mesh);
    expect(one!.material).toBe(two!.material);
    expect(one!.geometry.getAttribute('position').count).toBe(72);
    expect(one!.geometry.getAttribute('aTint').count).toBe(72);
    expect(one!.geometry.index!.count).toBe(108);
    expect(one!.renderOrder).toBe(1);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.uniforms.uTime.value).toBe(0);
    expect(makeWetRoadReflections(3300, 'low', material)).toBeNull();
    const heights = one!.geometry.getAttribute('position');
    for (let i = 0; i < heights.count; i++) {
      expect(heights.getY(i)).toBeCloseTo(-0.039);
    }
    one!.geometry.dispose();
    two!.geometry.dispose();
    material.dispose();
  });
});
