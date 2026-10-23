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
    player.shiftGear();
    for (let i=0;i<180;i++) player.step(1/60, controls, 'forest');
    expect(player.speed).toBeGreaterThan(boatSpeed);
  });

  it('animates drivetrain feedback while respecting reduced-motion chassis preferences', () => {
    const scene = new THREE.Scene();
    const player = new Player(scene);
    const front = player.mesh.getObjectByName('FrontWheelPivot') as THREE.Group;
    const rear = player.mesh.getObjectByName('RearWheelPivot') as THREE.Group;
    const lamp = player.mesh.getObjectByName('BrakeLamp') as THREE.Mesh;
    const body = player.mesh.children[0] as THREE.Group;
    const brakeControls = { ...controls, throttle: false, brake: true };
    for (let i = 0; i < 12; i++) player.step(1 / 60, brakeControls);
    expect(front.rotation.x).toBeLessThan(0);
    expect(front.rotation.y).toBeGreaterThan(0);
    expect(rear.rotation.y).toBe(0);
    expect((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity).toBeGreaterThan(1.5);
    expect(body.rotation.x).toBeLessThan(0);
    for (let i = 0; i < 16; i++) player.step(1 / 60, brakeControls, 'forest', 1, true);
    expect(Math.abs(body.rotation.x)).toBeLessThan(0.001);
    player.reset();
    expect(front.rotation.x).toBe(0);
    expect((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity).toBe(0.98);
    player.setBoat(true);
    player.step(1 / 60, controls, 'water');
    expect(front.rotation.x).toBe(0);
  });

  it('loads visual chassis under throttle, brakes and steering without changing vehicle hitboxes', () => {
    const player = new Player(new THREE.Scene());
    const initial = player.hitbox();
    const accelerate = { ...controls, steer: 0 };
    for (let i = 0; i < 35; i++) player.step(1 / 60, accelerate);
    expect(player.chassisPitch).toBeGreaterThan(0);
    expect(player.chassisHeave).toBeLessThanOrEqual(0);
    const steering = { ...controls, throttle: false, steer: 1 };
    for (let i = 0; i < 30; i++) player.step(1 / 60, steering);
    expect(player.chassisRoll).toBeLessThan(-0.01);
    const braking = { ...controls, steer: 0, throttle: false, brake: true };
    for (let i = 0; i < 45; i++) player.step(1 / 60, braking);
    expect(player.chassisPitch).toBeLessThan(-0.01);
    const movingHitbox = player.hitbox();
    expect(movingHitbox.halfWidth).toBe(initial.halfWidth);
    expect(movingHitbox.halfLength).toBe(initial.halfLength);
    for (let i = 0; i < 10; i++) player.step(1 / 60, braking, 'forest', 1, true);
    expect(player.chassisPitch).toBe(0);
    expect(player.chassisRoll).toBe(0);
    expect(player.chassisHeave).toBe(0);
    player.step(1 / 60, accelerate);
    player.setBoat(true);
    expect(player.chassisPitch).toBe(0);
    expect(player.chassisRoll).toBe(0);
    expect(player.chassisHeave).toBe(0);
    player.reset();
    expect(player.chassisPitch).toBe(0);
    expect(player.chassisRoll).toBe(0);
    expect(player.chassisHeave).toBe(0);
  });

});
