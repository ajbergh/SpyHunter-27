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

  it('hides the smoke batch while dormant and only uploads live/once-expired slots', () => {
    const trail = new MissileContrails(new THREE.Scene());
    let centerCalls = 0;
    const center = (_z: number): number => { centerCalls++; return 0; };
    const idleVersion = trail.mesh.instanceMatrix.version;
    trail.renderAt(center);
    expect(trail.mesh.visible).toBe(false);
    expect(trail.mesh.instanceMatrix.version).toBe(idleVersion);
    expect(centerCalls).toBe(0);
    trail.emit(1, 2, -14);
    trail.emit(1.3, 2.1, -14.5);
    trail.renderAt(center);
    expect(trail.mesh.visible).toBe(true);
    expect(trail.activeCount).toBe(2);
    expect(centerCalls).toBe(2);
    const drawnVersion = trail.mesh.instanceMatrix.version;
    trail.step(1, 30);
    expect(trail.activeCount).toBe(0);
    expect(trail.mesh.visible).toBe(false);
    trail.renderAt(center);
    expect(trail.mesh.instanceMatrix.version).toBe(drawnVersion);
    expect(centerCalls).toBe(2);
    trail.emit(2, 1, -20);
    trail.renderAt(center);
    // Repaint the new third puff, clear the previous two without center calls.
    expect(centerCalls).toBe(3);
    const cleared = new THREE.Matrix4();
    trail.mesh.getMatrixAt(0, cleared);
    expect(Math.abs(cleared.elements[0])).toBeLessThan(1e-10);
    trail.reset();
    expect(trail.mesh.visible).toBe(false);
    trail.renderAt(center);
    expect(centerCalls).toBe(3);
  });

  it('remains within its fixed 128-puff capacity under bursts and bad samples', () => {
    const trail = new MissileContrails(new THREE.Scene());
    trail.emit(Number.NaN, 1, -1);
    expect(trail.activeCount).toBe(0);
    for (let i = 0; i < 500; i++) trail.emit(i, 1, -i);
    expect(trail.capacity).toBe(128);
    expect(trail.activeCount).toBe(128);
    trail.step(Number.NaN, 40);
    expect(trail.activeCount).toBe(128);
    trail.step(2, 40);
    expect(trail.activeCount).toBe(0);
  });

});
