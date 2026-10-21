import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SKY_PALETTES, SkyAtmosphere } from './SkyAtmosphere';
import { BIOMES } from '../world/WorldPlan';

describe('original cinematic atmospheric sky', () => {
  it('provides differentiated color palettes and solar intensity in every biome', () => {
    const unique = new Set<number>();
    for (const biome of BIOMES) {
      const p = SKY_PALETTES[biome];
      unique.add(p.zenith);
      expect(p.sunlight).toBeGreaterThanOrEqual(0);
      expect(p.sunlight).toBeLessThanOrEqual(1);
    }
    expect(unique.size).toBe(5);
    expect(SKY_PALETTES.city.sunlight).toBeLessThan(SKY_PALETTES.desert.sunlight);
  });
  it('follows the camera without reallocating geometry and smoothly blends its palette', () => {
    const scene = new THREE.Scene();
    const sky = new SkyAtmosphere(scene);
    expect(scene.children).toEqual([sky.mesh]);
    expect(sky.mesh.material.depthWrite).toBe(false);
    expect(sky.mesh.material.side).toBe(THREE.BackSide);
    const original = sky.mesh.geometry;
    const first = (sky.mesh.material.uniforms.uZenith.value as THREE.Color).clone();
    sky.step(0.2, 'desert');
    expect((sky.mesh.material.uniforms.uZenith.value as THREE.Color).equals(first)).toBe(false);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(5, 22, -17);
    sky.follow(camera);
    expect(sky.mesh.position.equals(camera.position)).toBe(true);
    expect(sky.mesh.geometry).toBe(original);
  });
});
