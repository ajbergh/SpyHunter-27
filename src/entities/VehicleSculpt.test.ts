import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { sculptBody, bodyPaint, sculptMesh, addWheelAssembly } from './VehicleSculpt';

describe('original studio-quality vehicle geometry', () => {
  it('creates a sealed loft with roof, undertray and caps', () => {
    const geom = sculptBody([
      { z: -2, halfWidth: 0.7, deck: 0.85 },
      { z: 0, halfWidth: 1.2, deck: 1.1 },
      { z: 2, halfWidth: 1.0, deck: 0.8 },
    ]);
    expect(geom.getAttribute('position').count).toBe(12);
    expect(geom.index!.count).toBe(60);
    expect(Array.from(geom.getAttribute('normal').array as Float32Array)
      .every(n => Number.isFinite(n))).toBe(true);
  });
  it('builds physically based materials and independent wheel assemblies', () => {
    const body = new THREE.Group();
    sculptMesh(body, [{ z: -1, halfWidth: 1, deck: 0.9 },
      { z: 1, halfWidth: 1, deck: 0.9 }], bodyPaint(0xffffff, true));
    addWheelAssembly(body, 1.2, 0.8);
    expect(body.children).toHaveLength(4);
    expect((body.children[0] as THREE.Mesh).castShadow).toBe(true);
    expect(bodyPaint(0xeeeeee, true).clearcoat).toBe(1);
  });
  it('rejects degenerate mesh station lists', () => {
    expect(() => sculptBody([{ z: 0, halfWidth: 1, deck: 1 }])).toThrow();
  });
});
