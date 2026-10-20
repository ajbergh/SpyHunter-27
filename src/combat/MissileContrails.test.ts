import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MissileContrails } from './MissileContrails';

describe('bounded pooled missile contrails', () => {
  it('reuses one GPU instanced mesh while emitting visible puffs', () => {
    const scene = new THREE.Scene();
    const trail = new MissileContrails(scene);
    expect(scene.children).toContain(trail.mesh);
    for (let i = 0; i < 150; i++) trail.emit(i, 0.8, -i);
    expect(trail.activeCount).toBe(128);
    expect(scene.children).toHaveLength(1);
    trail.renderAt(() => 2);
    const matrix = new THREE.Matrix4();
    trail.mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBeGreaterThan(0);
  });
  it('scrolls with the moving roadway and fades without GPU allocations', () => {
    const trail = new MissileContrails(new THREE.Scene());
    trail.emit(3, 1, -10);
    trail.renderAt(() => 2);
    const before = new THREE.Matrix4();
    trail.mesh.getMatrixAt(0, before);
    trail.step(0.12, 40);
    trail.renderAt(() => 2);
    const after = new THREE.Matrix4();
    trail.mesh.getMatrixAt(0, after);
    expect(after.elements[14]).toBeGreaterThan(before.elements[14]);
    trail.step(1, 40);
    expect(trail.activeCount).toBe(0);
    trail.reset();
    expect(trail.activeCount).toBe(0);
  });
});
