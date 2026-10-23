import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { beamStrength, HeadlightBeams } from './HeadlightBeams';

describe('cinematic headlight road projection', () => {
  it('dark environments respond to quality without affecting watercraft', () => {
    expect(beamStrength('city', 'high', false)).toBeGreaterThan(beamStrength('forest', 'high', false));
    expect(beamStrength('city', 'medium', false)).toBeLessThan(beamStrength('city', 'high', false));
    expect(beamStrength('city', 'low', false)).toBe(0);
    expect(beamStrength('city', 'high', true)).toBe(0);
    expect(beamStrength('water', 'high', false)).toBe(0);
  });
  it('renders both lights with a single reusable additive plane', () => {
    const scene = new THREE.Scene();
    const beams = new HeadlightBeams(scene);
    expect(scene.children).toEqual([beams.mesh]);
    expect(beams.mesh.material.blending).toBe(THREE.AdditiveBlending);
    beams.setQuality('high');
    beams.step('city', false);
    expect(beams.mesh.visible).toBe(true);
    expect(beams.mesh.material.uniforms.uStrength.value).toBeGreaterThan(0);
    beams.renderAt(() => 1.5, -3.0);
    expect(beams.mesh.position.x).toBeCloseTo(-1.5);
    beams.step('water', true);
    expect(beams.mesh.visible).toBe(false);
    beams.setQuality('low');
    beams.step('city', false);
    expect(beams.mesh.visible).toBe(false);
  });

  it('dims only the impacted side in existing projected beams without changing draw count', () => {
    const scene = new THREE.Scene();
    const beams = new HeadlightBeams(scene);
    beams.setQuality('high');
    const material = beams.mesh.material;
    const geometry = beams.mesh.geometry;
    beams.step('city', false, 2, -1);
    expect(beams.mesh.visible).toBe(true);
    expect(material.uniforms.uLeftLamp.value).toBe(0.46);
    expect(material.uniforms.uRightLamp.value).toBe(1);
    beams.step('snow', false, 3, 1);
    expect(material.uniforms.uLeftLamp.value).toBe(1);
    expect(material.uniforms.uRightLamp.value).toBe(0.18);
    beams.step('water', true, 3, 1);
    expect(beams.mesh.visible).toBe(false);
    beams.step('forest', false, 0, 0);
    expect(material.uniforms.uLeftLamp.value).toBe(1);
    expect(material.uniforms.uRightLamp.value).toBe(1);
    expect(beams.mesh.material).toBe(material);
    expect(beams.mesh.geometry).toBe(geometry);
    expect(scene.children).toEqual([beams.mesh]);
  });

});
