import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Player } from '../entities/Player';
import type { Controls } from '../core/Input';
import {
  INITIAL_GEAR, nextGear, transmissionResponse, transmissionLabel,
} from './Transmission';

const driving: Controls = {
  steer: 0, throttle: true, brake: false, fire: false, gearPressed: false,
  missilePressed: false, oilPressed: false, smokePressed: false,
  vanPressed: false, startPressed: false, pausePressed: false, mutePressed: false,
};

describe('manual two-range interceptor transmission', () => {
  it('starts in Low and shifts deterministically between both ranges', () => {
    expect(INITIAL_GEAR).toBe('low');
    expect(nextGear('low')).toBe('high');
    expect(nextGear('high')).toBe('low');
    expect(transmissionLabel('low', false)).toBe('LOW');
    expect(transmissionLabel('high', false)).toBe('HIGH');
    expect(transmissionLabel('high', true)).toBe('BOAT');
  });

  it('trades Low gearing launch response for High gearing top speed', () => {
    expect(transmissionResponse('low', 25, true, false).targetSpeed).toBe(41);
    expect(transmissionResponse('high', 25, true, false).targetSpeed).toBe(58);
    expect(transmissionResponse('low', 25, true, false).responseRate)
      .toBeGreaterThan(transmissionResponse('high', 25, true, false).responseRate);
    expect(transmissionResponse('high', 45, true, false).responseRate)
      .toBeGreaterThan(transmissionResponse('high', 25, true, false).responseRate);
    expect(transmissionResponse('high', 50, false, true))
      .toEqual(transmissionResponse('low', 50, false, true));
    expect(transmissionResponse('high', 40, false, false).targetSpeed).toBe(30);
  });

  it('shifts under load and changes both speed envelope and on-screen depth', () => {
    const low = new Player(new THREE.Scene());
    const high = new Player(new THREE.Scene());
    expect(high.shiftGear()).toBe('high');
    for (let i = 0; i < 180; i++) {
      low.step(1 / 60, driving);
      high.step(1 / 60, driving);
    }
    expect(low.speed).toBeLessThan(42);
    expect(low.speed).toBeGreaterThan(39);
    expect(high.speed).toBeGreaterThan(52);
    expect(high.z).toBeLessThan(low.z - 8);
    expect(high.hitbox().z).toBeCloseTo(high.mesh.position.z);
    expect(high.shiftGear()).toBe('low');
    for (let i = 0; i < 90; i++) high.step(1 / 60, driving);
    expect(high.speed).toBeLessThan(43);
    expect(high.z).toBeGreaterThan(-5);
    high.reset();
    expect(high.gear).toBe('low');
    expect(high.speed).toBe(25);
  });

  it('ignores manual shifts in boat mode and resets gear on water entry', () => {
    const player = new Player(new THREE.Scene());
    expect(player.shiftGear()).toBe('high');
    player.setBoat(true);
    expect(player.gear).toBe('low');
    expect(player.shiftGear()).toBeNull();
    for (let i = 0; i < 180; i++) player.step(1 / 60, driving, 'water');
    expect(player.speed).toBeGreaterThan(43);
    player.setBoat(false);
    expect(player.gear).toBe('low');
  });
});
