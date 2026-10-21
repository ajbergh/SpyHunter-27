import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { autoPaintDetailBudget, vehiclePaintTextures, vehicleSurfaceAt } from './VehiclePaintAtlas';

describe('original UV-mapped automotive PBR materials', () => {
  it('renders deterministic fine material grain and stamped body panel seams', () => {
    const base = vehicleSurfaceAt(0.28, 0.2, 'interceptor');
    expect(base).toEqual(vehicleSurfaceAt(0.28, 0.2, 'interceptor'));
    const seam = vehicleSurfaceAt(0.33, 0.2, 'interceptor');
    expect(seam.color).toBeLessThan(base.color);
    expect(seam.height).toBeLessThan(base.height);
    const carbon = vehicleSurfaceAt(0.6, 0.5, 'interceptor');
    expect(carbon.color).toBeLessThan(base.color);
    expect(carbon.roughness).toBeGreaterThan(base.roughness);
    expect(vehicleSurfaceAt(0.33, 0.2, 'traffic').color)
      .toBeGreaterThan(seam.color);
  });
  it('reuses one set of textures per style across all spawned traffic', () => {
    const a = vehiclePaintTextures('interceptor');
    const b = vehiclePaintTextures('interceptor');
    const car = vehiclePaintTextures('traffic');
    expect(a).toBe(b);
    expect(a.albedo).not.toBe(car.albedo);
    expect(a.albedo).toBeInstanceOf(THREE.DataTexture);
    expect(a.albedo.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(a.roughness.colorSpace).not.toBe(THREE.SRGBColorSpace);
    expect(a.albedo.image.width).toBe(512);
    expect(a.albedo.image.height).toBe(256);
    expect(autoPaintDetailBudget().uniqueAtlases).toBe(2);
    expect(autoPaintDetailBudget().bytesPerAtlas).toBeLessThan(2_000_000);
  });
});
