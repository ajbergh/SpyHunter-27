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
});
