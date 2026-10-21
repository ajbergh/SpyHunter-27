import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BoatWake, createWakeGeometry } from './BoatWake';

describe('single-draw V-hull foam wake', () => {
  it('generates original tapered twin wake ribbons and a central turbulence spine', () => {
    const geometry = createWakeGeometry();
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    expect(positions.count).toBe(66);
    expect(colors.count).toBe(66);
    expect(geometry.index!.count).toBe(180);
    expect(geometry.boundingSphere).not.toBeNull();
    const x = Array.from({ length: positions.count }, (_, i) => positions.getX(i));
    expect(Math.min(...x)).toBeLessThan(-2.8);
    expect(Math.max(...x)).toBeGreaterThan(2.8);
    const z = Array.from({ length: positions.count }, (_, i) => positions.getZ(i));
    expect(Math.max(...z)).toBeGreaterThan(3);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    geometry.dispose();
  });

  it('recycles a bounded instance pool without allocating one mesh per wake', () => {
    const scene = new THREE.Scene();
    const wake = new BoatWake(scene);
    expect(scene.children).toEqual([wake.mesh]);
    expect(wake.mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(wake.mesh.count).toBe(40);
    expect(wake.capacity).toBe(80);
    const originalGeometry = wake.mesh.geometry;
    const originalMaterial = wake.mesh.material;

    for (let i = 0; i < 50; i++) wake.step(1 / 60, 30, 0, true, 0.7);
    expect(wake.count).toBeGreaterThan(0);
    expect(wake.count).toBeLessThanOrEqual(40);
    wake.renderAt(z => Math.sin(z / 35));
    const mat = new THREE.Matrix4();
    wake.mesh.getMatrixAt(0, mat);
    expect(Number.isFinite(mat.elements[12])).toBe(true);
    expect(Number.isFinite(mat.elements[14])).toBe(true);
    expect(wake.mesh.instanceColor).not.toBeNull();
    for (let i = 0; i < 480; i++) wake.step(1 / 60, 30, 0, true, 1);
    expect(wake.count).toBeLessThanOrEqual(40);
    expect(scene.children).toHaveLength(1);
    expect(wake.mesh.geometry).toBe(originalGeometry);
    expect(wake.mesh.material).toBe(originalMaterial);

    for (let i = 0; i < 135; i++) wake.step(1 / 60, 30, 0, false);
    expect(wake.count).toBe(0);
    wake.reset();
    expect(wake.count).toBe(0);
    expect(scene.children).toHaveLength(1);
  });

  it('caps geometry instances by preset and avoids stale foam on quality changes', () => {
    const wake = new BoatWake(new THREE.Scene());
    wake.setQuality('low');
    expect(wake.mesh.count).toBe(12);
    for (let i = 0; i < 90; i++) wake.step(1 / 60, 22, -1, true);
    expect(wake.count).toBeGreaterThan(0);
    expect(wake.count).toBeLessThanOrEqual(12);
    wake.setQuality('high');
    expect(wake.count).toBe(0);
    expect(wake.mesh.count).toBe(80);
    for (let i = 0; i < 180; i++) wake.step(1 / 60, 43, 2, true, -0.7);
    expect(wake.count).toBeLessThanOrEqual(80);
    wake.setQuality('medium');
    expect(wake.count).toBe(0);
    expect(wake.mesh.count).toBe(40);
    wake.step(20, 43, 2, true);
    expect(wake.count).toBeLessThanOrEqual(2);
    wake.step(0.2, 0, 2, true);
    expect(wake.count).toBeLessThanOrEqual(2);
  });

  it('tracks curved waterways and steered wake heading without impacting boat physics', () => {
    const wake = new BoatWake(new THREE.Scene());
    wake.setQuality('high');
    for (let i = 0; i < 10; i++) wake.step(0.1, 30, 2.5, true, 1);
    const originalGeometry = wake.mesh.geometry;
    wake.renderAt(() => 0);
    const base = new THREE.Matrix4();
    wake.mesh.getMatrixAt(0, base);
    wake.renderAt(() => 1.25);
    const shifted = new THREE.Matrix4();
    wake.mesh.getMatrixAt(0, shifted);
    expect(shifted.elements[12] - base.elements[12]).toBeCloseTo(1.25);
    expect(shifted.elements[14]).toBeCloseTo(base.elements[14]);
    expect(base.elements[2]).not.toBe(0);
    expect(wake.mesh.geometry).toBe(originalGeometry);
  });
});
