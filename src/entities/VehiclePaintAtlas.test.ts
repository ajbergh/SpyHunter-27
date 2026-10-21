import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { autoPaintDetailBudget, vehiclePaintTextures, vehicleSurfaceAt, glassSurfaceAt, vehicleGlassTextures } from './VehiclePaintAtlas';

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
  it('reuses original roof-glazing maps and varies screen-space reflected tint', () => {
    const atlas = vehicleGlassTextures();
    expect(vehicleGlassTextures()).toBe(atlas);
    expect(atlas.albedo).not.toBe(atlas.roughness);
    expect(atlas.albedo.colorSpace).toBe(THREE.SRGBColorSpace);
    const highlight = glassSurfaceAt(0.5, 0.43);
    const darkTrim = glassSurfaceAt(0.5, 0.03);
    expect(highlight.color).toBeGreaterThan(darkTrim.color);
    expect(darkTrim.roughness).toBeGreaterThan(highlight.roughness);
  });

});
