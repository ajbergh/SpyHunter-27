import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { VehicleDebris } from './VehicleDebris';

describe('single-draw-call vehicle fragmentation', () => {
  it('emits metallic shards within a strict 96-instance cap', () => {
    const scene = new THREE.Scene();
    const debris = new VehicleDebris(scene);
    for (let i=0;i<50;i++) debris.emit(i, -i, true);
    expect(debris.activeCount).toBe(96);
    expect(debris.capacity).toBe(96);
    expect(scene.children).toEqual([debris.mesh]);
    expect(debris.mesh.instanceColor).not.toBeNull();
  });
  it('moves with the scrolling road, bounces, fades and resets', () => {
    const debris = new VehicleDebris(new THREE.Scene());
    debris.emit(1, -9, false);
    debris.renderAt(() => 0);
    const before = new THREE.Matrix4();
    debris.mesh.getMatrixAt(0, before);
    debris.step(0.1, 40);
    debris.renderAt(() => 1.5);
    const after = new THREE.Matrix4();
    debris.mesh.getMatrixAt(0, after);
    expect(after.elements[14]).toBeGreaterThan(before.elements[14]);
    expect(after.elements[12]).not.toBe(before.elements[12]);
    debris.step(2, 40);
    expect(debris.activeCount).toBe(0);
    debris.reset();
    expect(debris.activeCount).toBe(0);
  });

  it('suppresses dormant draw calls and GPU uploads and erases stale fragments on the next blast', () => {
    const debris = new VehicleDebris(new THREE.Scene());
    let centerCalls = 0;
    const center = (_z: number): number => { centerCalls++; return 0; };
    const initialVersion = debris.mesh.instanceMatrix.version;
    expect(debris.activeCount).toBe(0);
    expect(debris.mesh.visible).toBe(false);
    debris.renderAt(center);
    expect(debris.mesh.instanceMatrix.version).toBe(initialVersion);
    expect(centerCalls).toBe(0);

    debris.emit(2, -12, true);
    expect(debris.activeCount).toBe(10);
    expect(debris.mesh.visible).toBe(true);
    debris.renderAt(center);
    expect(centerCalls).toBe(10);
    const renderedVersion = debris.mesh.instanceMatrix.version;
    expect(renderedVersion).toBeGreaterThan(initialVersion);
    // The same one-draw batch now has elongated, irregular fragment profiles.
    const matrix = new THREE.Matrix4();
    debris.mesh.getMatrixAt(0, matrix);
    const columnX = Math.hypot(matrix.elements[0], matrix.elements[1], matrix.elements[2]);
    const columnZ = Math.hypot(matrix.elements[8], matrix.elements[9], matrix.elements[10]);
    expect(columnZ).toBeGreaterThan(columnX);

    debris.step(2, 30);
    expect(debris.activeCount).toBe(0);
    expect(debris.mesh.visible).toBe(false);
    debris.renderAt(center);
    expect(centerCalls).toBe(10);
    expect(debris.mesh.instanceMatrix.version).toBe(renderedVersion);
    debris.emit(5, -24, false);
    debris.renderAt(center);
    // Old slots are cleared exactly once; only ten *new* shards need the road curve.
    expect(centerCalls).toBe(20);
    debris.mesh.getMatrixAt(0, matrix);
    expect(Math.abs(matrix.elements[0])).toBeLessThan(1e-10);
    expect(debris.mesh.visible).toBe(true);
    debris.reset();
    expect(debris.mesh.visible).toBe(false);
    expect(debris.activeCount).toBe(0);
  });

  it('tracks a fixed-capacity ring under overlapping detonations and rejects invalid input', () => {
    const debris = new VehicleDebris(new THREE.Scene());
    debris.emit(Number.NaN, -10, true);
    expect(debris.activeCount).toBe(0);
    for (let i = 0; i < 50; i++) debris.emit(i, -i, i % 2 === 0);
    expect(debris.capacity).toBe(96);
    expect(debris.activeCount).toBe(96);
    debris.step(Number.NaN, 25);
    expect(debris.activeCount).toBe(96);
    debris.step(0, 25);
    expect(debris.activeCount).toBe(96);
    debris.step(4, 25);
    expect(debris.activeCount).toBe(0);
    expect(debris.mesh.visible).toBe(false);
  });

});
