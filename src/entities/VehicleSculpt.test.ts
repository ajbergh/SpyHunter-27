import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { sculptBody, bodyPaint, glassPaint, sculptMesh, addWheelAssembly } from './VehicleSculpt';

describe('original studio-quality vehicle geometry', () => {
  it('creates a sealed loft with roof, undertray and caps', () => {
    const geom = sculptBody([
      { z: -2, halfWidth: 0.7, deck: 0.85 },
      { z: 0, halfWidth: 1.2, deck: 1.1 },
      { z: 2, halfWidth: 1.0, deck: 0.8 },
    ]);
    expect(geom.getAttribute('position').count).toBe(12);
    expect(geom.index!.count).toBe(60);
    const uv = geom.getAttribute('uv');
    expect(uv.getX(0)).toBe(0);
    expect(uv.getX(4)).toBeCloseTo(0.5);
    expect(uv.getX(8)).toBe(1);
    expect(uv.getY(1)).toBeCloseTo(1 / 3);
    expect(uv.getY(2)).toBeCloseTo(2 / 3);
    expect(Array.from(geom.getAttribute('normal').array as Float32Array)
      .every(n => Number.isFinite(n))).toBe(true);
  });
  it('builds physically based materials and independent wheel assemblies', () => {
    const body = new THREE.Group();
    sculptMesh(body, [{ z: -1, halfWidth: 1, deck: 0.9 },
      { z: 1, halfWidth: 1, deck: 0.9 }], bodyPaint(0xffffff, true));
    const wheel = addWheelAssembly(body, 1.2, 0.8);
    expect(body.children).toHaveLength(2);
    expect(wheel.name).toBe('RearWheelPivot');
    expect(wheel.children).toHaveLength(3);
    expect(wheel.userData.wheelRadius).toBe(0.49);
    expect((body.children[0] as THREE.Mesh).castShadow).toBe(true);
    expect(bodyPaint(0xeeeeee, true).clearcoat).toBe(0.74);
    expect(bodyPaint(0xeeeeee, true).metalness).toBeLessThan(0.45);
    const paint = bodyPaint(0x849bab, true);
    expect(paint.map).not.toBeNull();
    expect(paint.bumpMap).not.toBeNull();
    expect(paint.roughnessMap).not.toBeNull();
    expect(bodyPaint(0xaaccdd, true).map).toBe(paint.map);
    expect(bodyPaint(0xaaccdd, false).map).not.toBe(paint.map);
    expect(glassPaint().map).not.toBeNull();
    expect(glassPaint().roughnessMap).not.toBeNull();
    expect(glassPaint(0x233459).map).toBe(glassPaint().map);
  });
  it('rejects degenerate mesh station lists', () => {
    expect(() => sculptBody([{ z: 0, halfWidth: 1, deck: 1 }])).toThrow();
    expect(() => sculptBody([
      { z: 4, halfWidth: 1, deck: 1 }, { z: 2, halfWidth: 1, deck: 1 },
    ])).toThrow();
  });
});
