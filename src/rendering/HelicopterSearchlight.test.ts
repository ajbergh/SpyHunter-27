import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HelicopterSearchlight } from './HelicopterSearchlight';

describe('quality-budgeted aerial spotlight rendering', () => {
  it('reuses geometry, has bounded draw cost and disposes both materials per helicopter', () => {
    const scene = new THREE.Scene();
    const a = new HelicopterSearchlight(scene, 'patrol');
    const b = new HelicopterSearchlight(scene, 'ace');
    expect(scene.children).toHaveLength(4);
    expect(a.cone.geometry).toBe(b.cone.geometry);
    expect(a.footprint.geometry).toBe(b.footprint.geometry);
    expect(a.cone.material).not.toBe(b.cone.material);
    expect(a.cone.visible).toBe(false);
    expect(a.footprint.visible).toBe(true);
    expect(a.footprint.material.depthWrite).toBe(false);
    expect(a.cone.material.blending).toBe(THREE.AdditiveBlending);
    a.setPreferences('high', false);
    expect(a.cone.visible).toBe(true);
    expect(a.footprint.visible).toBe(true);
    a.setPreferences('low', false);
    expect(a.cone.visible).toBe(false);
    expect(a.footprint.visible).toBe(false);
    let disposed = 0;
    a.cone.material.addEventListener('dispose', () => disposed++);
    a.footprint.material.addEventListener('dispose', () => disposed++);
    a.dispose();
    expect(disposed).toBe(2);
    expect(scene.children).toHaveLength(2);
    b.dispose();
    expect(scene.children).toHaveLength(0);
  });

  it('projects the soft landing spot onto a curved lane with deterministic sweep', () => {
    const scene = new THREE.Scene();
    const beam = new HelicopterSearchlight(scene, 'ace');
    const center = (z: number) => 0.06 * z;
    beam.setPreferences('high', true);
    beam.step(1 / 60);
    beam.renderAt(1.8, -35, 8.7, center);
    const initialX = beam.footprint.position.x;
    expect(beam.footprint.position.z).toBeCloseTo(-39.1);
    expect(initialX).toBeCloseTo(1.8 + center(-39.1));
    expect(beam.footprint.position.y).toBeCloseTo(0.105);
    expect(beam.cone.scale.y).toBeGreaterThan(6.5);
    expect(beam.cone.scale.y).toBeLessThan(10);
    const cone = beam.cone;
    const origin = cone.position.clone();
    const geometry = cone.geometry;
    for (let i = 0; i < 90; i++) beam.step(1 / 60);
    beam.renderAt(1.8, -35, 8.7, center);
    expect(beam.footprint.position.x).toBeCloseTo(initialX);
    expect(beam.cone.material.uniforms.uPulse.value).toBe(1);
    expect(cone.position.equals(origin)).toBe(true);
    expect(cone.geometry).toBe(geometry);

    beam.setPreferences('high', false);
    for (let i = 0; i < 24; i++) beam.step(1 / 60);
    beam.renderAt(1.8, -35, 8.7, center);
    expect(beam.footprint.position.x).not.toBeCloseTo(initialX);
    expect(beam.cone.material.uniforms.uPulse.value).toBeLessThan(1.01);
    expect(beam.cone.position.y).toBeGreaterThan(0);
    expect(beam.cone.position.y).toBeLessThan(8.7);
    beam.dispose();
  });

  it('Medium draws only a footprint and Low avoids projection math', () => {
    const scene = new THREE.Scene();
    const beam = new HelicopterSearchlight(scene, 'patrol');
    const center = (_z: number): number => 0.4;
    beam.setPreferences('medium', false);
    beam.renderAt(-3, -22, 8.7, center);
    expect(beam.cone.visible).toBe(false);
    expect(beam.footprint.position.x).toBeDefined();
    const before = beam.footprint.position.clone();
    beam.setPreferences('low', false);
    beam.step(1 / 60);
    beam.renderAt(4, -13, 8.7, () => { throw new Error('No low preset projection'); });
    expect(beam.footprint.position.equals(before)).toBe(true);
    expect(beam.footprint.visible).toBe(false);
    beam.dispose();
  });
});
