import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Player } from './Player';
import type { Controls } from '../core/Input';

const controls: Controls = {
  steer: 1, throttle: true, brake: false, fire: false,
  missilePressed: false, oilPressed: false, smokePressed: false, vanPressed: false,
  startPressed: false, pausePressed: false, mutePressed: false,
};

describe('surface-dependent interceptor handling', () => {
  it('retains more lateral inertia on snow than asphalt', () => {
    const player = new Player(new THREE.Scene());
    player.step(1/60, controls, 'forest');
    const onRoad = player.x;
    player.reset();
    player.step(1/60, controls, 'snow');
    expect(player.x).toBeGreaterThan(0);
    expect(player.x).toBeLessThan(onRoad);
  });
  it('switches between car and boat with distinct speed ranges', () => {
    const player = new Player(new THREE.Scene());
    player.setBoat(true);
    for (let i=0;i<180;i++) player.step(1/60, controls, 'water');
    expect(player.isBoat).toBe(true);
    const boatSpeed = player.speed;
    player.reset();
    for (let i=0;i<180;i++) player.step(1/60, controls, 'forest');
    expect(player.speed).toBeGreaterThan(boatSpeed);
  });
});
