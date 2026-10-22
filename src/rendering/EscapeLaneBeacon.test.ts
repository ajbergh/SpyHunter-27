import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { EscapeLaneBeacon } from './EscapeLaneBeacon';

describe('GPU-safe escape lane shader', () => {
  it('reuses exactly one original road-plane mesh with no active allocations', () => {
    const scene = new THREE.Scene();
    const beacon = new EscapeLaneBeacon(scene);
    expect(scene.children).toHaveLength(1);
    expect(beacon.mesh.visible).toBe(false);
    expect(beacon.mesh.name).toBe('EscapeLaneGuidance');
    expect(beacon.mesh.material.depthWrite).toBe(false);
    const geometry = beacon.mesh.geometry;
    const material = beacon.mesh.material;
    beacon.setPreferences('high', false);
    beacon.step(1 / 60, true, false);
    beacon.renderAt(z => z * 0.1, -1);
    expect(beacon.mesh.visible).toBe(true);
    expect(beacon.mesh.position.z).toBeCloseTo(-12.5);
    expect(beacon.mesh.position.x).toBeCloseTo(-1.25);
    expect(beacon.mesh.material.uniforms.uStrength.value).toBe(0.62);
    for (let i = 0; i < 120; i++) beacon.step(1 / 60, true, false);
    expect(beacon.mesh.geometry).toBe(geometry);
    expect(beacon.mesh.material).toBe(material);
    expect(scene.children).toHaveLength(1);
  });

  it('disables animated pulses but preserves a static guide under reduced motion', () => {
    const beacon = new EscapeLaneBeacon(new THREE.Scene());
    beacon.setPreferences('low', true);
    beacon.step(1, true, false);
    expect(beacon.mesh.visible).toBe(true);
    expect(beacon.mesh.material.uniforms.uMotion.value).toBe(0);
    expect(beacon.mesh.material.uniforms.uTime.value).toBe(0);
    expect(beacon.mesh.material.uniforms.uStrength.value).toBe(0.4);
    beacon.step(1, true, true);
    expect(beacon.mesh.visible).toBe(false);
    beacon.step(1, false, false);
    expect(beacon.mesh.visible).toBe(false);
    beacon.reset();
    expect(beacon.mesh.material.uniforms.uTime.value).toBe(0);
  });
});
