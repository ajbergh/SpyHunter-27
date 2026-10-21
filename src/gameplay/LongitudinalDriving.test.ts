import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { drivingTargetZ, DRIVE_Z_MIN, DRIVE_Z_MAX, DRIVE_Z_NEUTRAL } from './LongitudinalDriving';
import { Player } from '../entities/Player';
import { screenVerticalAt } from '../rendering/CameraFraming';
import type { Controls } from '../core/Input';

const controls: Controls = {
  steer: 0, throttle: false, brake: false, fire: false,
  missilePressed: false, oilPressed: false, smokePressed: false, vanPressed: false,
  startPressed: false, pausePressed: false, mutePressed: false,
};

describe('classic arcade accelerator-linked vertical movement', () => {
  it('maps throttle/cruise/braking onto a safe depth band and camera composition', () => {
    expect(drivingTargetZ(30)).toBe(DRIVE_Z_NEUTRAL);
    expect(drivingTargetZ(54)).toBeLessThan(0);
    expect(drivingTargetZ(10)).toBe(DRIVE_Z_MAX);
    expect(drivingTargetZ(500)).toBe(DRIVE_Z_MIN);
    expect(drivingTargetZ(0)).toBe(DRIVE_Z_MAX);
    expect(drivingTargetZ(100, false, 2)).toBe(drivingTargetZ(50));
    expect(Number.isFinite(drivingTargetZ(Number.NaN))).toBe(true);
    expect(screenVerticalAt(DRIVE_Z_MIN)).toBeLessThan(screenVerticalAt(DRIVE_Z_NEUTRAL));
    expect(screenVerticalAt(DRIVE_Z_NEUTRAL)).toBeLessThan(screenVerticalAt(DRIVE_Z_MAX));
    expect(screenVerticalAt(DRIVE_Z_MIN)).toBeGreaterThan(0.25);
    expect(screenVerticalAt(DRIVE_Z_MAX)).toBeLessThan(1);
  });

  it('moves player and collision body forward under throttle, rearward under brake', () => {
    const player = new Player(new THREE.Scene());
    const start = player.z;
    const move = { ...controls, throttle: true };
    const slow = { ...controls, brake: true };
    for (let i = 0; i < 210; i++) player.step(1 / 60, move, 'forest');
    const forward = player.z;
    expect(forward).toBeLessThan(start - 8);
    expect(player.mesh.position.z).toBeCloseTo(forward);
    expect(player.hitbox().z).toBe(forward);
    expect(screenVerticalAt(forward)).toBeLessThan(screenVerticalAt(start));
    for (let i = 0; i < 160; i++) player.step(1 / 60, slow, 'forest');
    expect(player.z).toBeGreaterThan(forward + 9);
    expect(player.hitbox().z).toBeCloseTo(player.mesh.position.z);
    expect(player.z).toBeLessThanOrEqual(DRIVE_Z_MAX);
    player.reset();
    expect(player.z).toBe(DRIVE_Z_NEUTRAL);
    expect(player.hitbox().z).toBe(DRIVE_Z_NEUTRAL);
  });

  it('allows rivercraft depth movement without changing the water handling mode', () => {
    const player = new Player(new THREE.Scene());
    player.setBoat(true);
    for (let i = 0; i < 180; i++) player.step(1 / 60, { ...controls, throttle: true }, 'water');
    const forward = player.z;
    expect(forward).toBeLessThan(3);
    for (let i = 0; i < 180; i++) player.step(1 / 60, { ...controls, brake: true }, 'water');
    expect(player.z).toBeGreaterThan(forward);
    expect(player.isBoat).toBe(true);
    expect(player.z).toBeLessThanOrEqual(DRIVE_Z_MAX);
  });
});
