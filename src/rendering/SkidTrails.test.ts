import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SkidTrails, skidCondition } from './SkidTrails';

describe('pooled skidmark rendering', () => {
  it('triggers only on hard turns, braking, or sliding on ice', () => {
    expect(skidCondition(24, 1, false, 'snow', false)).toBe(true);
    expect(skidCondition(34, 0.8, false, 'forest', false)).toBe(true);
    expect(skidCondition(27, 0, true, 'city', false)).toBe(true);
    expect(skidCondition(20, 0.4, false, 'forest', false)).toBe(false);
    expect(skidCondition(45, 1, true, 'water', true)).toBe(false);
    expect(skidCondition(45, 1, true, 'forest', true)).toBe(false);
  });
  it('uses a single fixed draw call and advances with the scrolling road', () => {
    const scene = new THREE.Scene();
    const skid = new SkidTrails(scene);
    skid.setQuality('high');
    for (let i = 0; i < 200; i++) skid.step(1 / 60, 44, 2, 1, false, 'forest', false);
    expect(skid.activeCount).toBeGreaterThan(0);
    expect(skid.activeCount).toBeLessThanOrEqual(160);
    expect(scene.children).toEqual([skid.mesh]);
    skid.renderAt(() => 2);
    const matrix = new THREE.Matrix4();
    skid.mesh.getMatrixAt(0, matrix);
    expect(Number.isFinite(matrix.elements[12])).toBe(true);
    expect(skid.mesh.instanceColor).not.toBeNull();
    skid.step(4, 30, 0, 0, false, 'forest', false);
    expect(skid.activeCount).toBe(0);
  });
  it('does not render or upload inactive skid instances, and clears previously painted tracks on reuse', () => {
    const trail = new SkidTrails(new THREE.Scene());
    trail.setQuality('high');
    let centerCalls = 0;
    const center = (_z: number): number => { centerCalls++; return 0; };
    const initialVersion = trail.mesh.instanceMatrix.version;
    expect(trail.mesh.visible).toBe(false);
    trail.renderAt(center);
    expect(centerCalls).toBe(0);
    expect(trail.mesh.instanceMatrix.version).toBe(initialVersion);

    trail.step(0.26, 44, 0, 1, false, 'forest', false);
    expect(trail.mesh.visible).toBe(true);
    const active = trail.activeCount;
    trail.renderAt(center);
    expect(centerCalls).toBe(active);
    expect(trail.mesh.instanceMatrix.version).toBeGreaterThan(initialVersion);

    trail.step(4, 0, 0, 0, false, 'forest', false);
    expect(trail.activeCount).toBe(0);
    expect(trail.mesh.visible).toBe(false);
    const idleVersion = trail.mesh.instanceMatrix.version;
    trail.renderAt(center);
    expect(centerCalls).toBe(active);
    expect(trail.mesh.instanceMatrix.version).toBe(idleVersion);

    // A later brake event revives only the next pool slots. Expired slots
    // were already rendered and must have their stale matrices cleared.
    trail.step(0.10, 38, 1, 0, true, 'city', false);
    trail.renderAt(center);
    const formerSlot = new THREE.Matrix4();
    trail.mesh.getMatrixAt(0, formerSlot);
    expect(formerSlot.elements[0]).toBe(0);
    expect(trail.activeCount).toBeGreaterThan(0);
    expect(centerCalls).toBe(active + trail.activeCount);
  });

  it('tracks a fixed 160-mark budget through overwrites and long idle intervals', () => {
    const trail = new SkidTrails(new THREE.Scene());
    trail.setQuality('high');
    for (let i = 0; i < 250; i++)
      trail.step(0.085, 42, 0, 1, false, 'forest', false);
    expect(trail.activeCount).toBeLessThanOrEqual(trail.capacity);
    expect(trail.activeCount).toBeGreaterThan(0);
    trail.renderAt(() => 0);
    trail.step(10, 0, 0, 0, false, 'forest', false);
    expect(trail.activeCount).toBe(0);
    expect(trail.mesh.visible).toBe(false);
  });

  it('does not emit on Low, and resets when changing quality', () => {
    const trail = new SkidTrails(new THREE.Scene());
    trail.setQuality('low');
    for (let i = 0; i < 100; i++) trail.step(0.1, 45, 0, 1, false, 'snow', false);
    expect(trail.activeCount).toBe(0);
    expect(trail.mesh.visible).toBe(false);
    trail.setQuality('medium');
    trail.step(0.5, 42, 0, 1, false, 'desert', false);
    expect(trail.activeCount).toBeGreaterThan(0);
    trail.reset();
    expect(trail.activeCount).toBe(0);
  });
});
