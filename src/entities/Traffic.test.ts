import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { TrafficVehicle } from './Traffic';

describe('enforcer AI', () => {
  it('fires only when aligned, on road and not disrupted', () => {
    const scene = new THREE.Scene();
    const enemy = new TrafficVehicle(scene, 0, -45, true, 3, 0x621f33, 12);
    enemy.step(1/60, 30, 0);
    expect(enemy.role).toBe('enforcer');
    expect(enemy.tryFire(0)).toBe(false);
    for (let i=0;i<85;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(true);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.disrupt(4);
    for (let i=0;i<150;i++) enemy.step(1/60,30,0);
    expect(enemy.tryFire(0)).toBe(false);
    enemy.dispose(scene);
  });
  it('motorcycle uses a narrow single-hit profile with fast lateral slalom', () => {
    const scene = new THREE.Scene();
    const bike = new TrafficVehicle(scene, 0, -36, true, 4, 0x6b1622, 15);
    expect(bike.role).toBe('motorcycle');
    expect(bike.hitbox().halfWidth).toBeLessThan(0.7);
    expect(bike.hp).toBe(1);
    for (let i = 0; i < 80; i++) bike.step(1/60, 40, 5);
    expect(Math.abs(bike.x)).toBeGreaterThan(0.1);
    bike.dispose(scene);
  });

  it('switchblade car carries wide blades and aggressively follows a target', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, -6.4, -25, true, 6, 0x682735, 13);
    expect(car.role).toBe('switchblade');
    expect(car.hitbox().halfWidth).toBeGreaterThan(1.5);
    for (let i = 0; i < 40; i++) car.step(1 / 60, 40, 6.4);
    expect(car.x).toBeGreaterThan(-6.4);
    car.dispose(scene);
  });
  it('paired attackers respond to a tactical target and smoke still disables it', () => {
    const scene = new THREE.Scene();
    const enemy = new TrafficVehicle(scene, -6.4, -30, true, 0, 0x6b1622, 11, 4);
    const start = enemy.x;
    for (let i = 0; i < 50; i++) enemy.step(1/60, 32, 0,
      { type: 'pincer', targetX: -3.8 });
    expect(enemy.x).toBeGreaterThan(start);
    expect(enemy.squadId).toBe(4);
    enemy.disrupt(3);
    const disabledX = enemy.x;
    for (let i=0;i<45;i++) enemy.step(1/60,32,0,
      { type: 'pincer', targetX: 7 });
    expect(enemy.x).toBeCloseTo(disabledX, 4);
    enemy.dispose(scene);
  });

  it('retreating survivors accelerate away, do not shoot, and can exit the arena', () => {
    const scene = new THREE.Scene();
    const survivor = new TrafficVehicle(scene, -2.5, -19, true, 3, 0x881122, 12, 8);
    survivor.step(1/60, 36, 0, { type: 'retreat', targetX: -7.5 });
    expect(survivor.state).toBe('retreating');
    expect(survivor.tryFire(0)).toBe(false);
    const firstZ = survivor.z;
    for (let i=0; i<225; i++) survivor.step(1/60, 36, 0);
    expect(survivor.z).toBeLessThan(firstZ - 50);
    expect(survivor.x).toBeLessThan(-6.5);
    survivor.dispose(scene);
  });
  it('smoke temporarily interrupts retreat, then survivor disengages again', () => {
    const scene = new THREE.Scene();
    const survivor = new TrafficVehicle(scene, 2.5, -23, true, 0, 0x881122, 12, 4);
    survivor.step(1/60, 32, 0, { type: 'retreat', targetX: 7.5 });
    survivor.disrupt(0.4);
    survivor.step(1/60, 32, 0);
    expect(survivor.state).toBe('disrupted');
    for(let i=0;i<35;i++) survivor.step(1/60,32,0, {type:'retreat',targetX:7.5});
    expect(survivor.state).toBe('retreating');
    survivor.dispose(scene);
  });


  it('updates visual rolling and braking in a disrupted pursuit without changing collision rules', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, 0, -20, true, 0, 0x882233, 16);
    const wheel = car.mesh.getObjectByName('FrontWheelPivot') as THREE.Group;
    const lamp = car.mesh.getObjectByName('BrakeLamp') as THREE.Mesh;
    car.step(1 / 60, 35, 5);
    expect(wheel.rotation.x).toBeLessThan(0);
    const hitbox = car.hitbox();
    car.disrupt(0.75);
    for (let i = 0; i < 5; i++) car.step(1 / 60, 35, 5);
    expect((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity).toBeGreaterThan(1.4);
    expect(car.hitbox().halfLength).toBe(hitbox.halfLength);
    expect(car.hitbox().halfWidth).toBe(hitbox.halfWidth);
    car.dispose(scene);
  });

  it('drives head-on rush traffic toward the player, facing opposite with frontal shots', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, 0, -48, true, 0, 0x883344, 26, null, true);
    expect(car.role).toBe('head-on');
    const facing = car.mesh.getObjectByName('HeadOnFacing') as THREE.Group;
    expect(facing.rotation.y).toBeCloseTo(Math.PI);
    const before = car.z;
    for (let i = 0; i < 45; i++) car.step(1 / 60, 32, 0, undefined, 6);
    expect(car.z - before).toBeGreaterThan(32);
    expect(facing.rotation.y).toBeCloseTo(Math.PI);
    expect(car.state).toBe('intercept');
    expect(car.tryFire(0, 6)).toBe(false); // near-collision safety zone
    car.dispose(scene);
    expect(scene.children).toHaveLength(0);
  });

  it('fires oncoming rounds from ahead only, and is unaffected by player depth changes', () => {
    const scene = new THREE.Scene();
    const rush = new TrafficVehicle(scene, 0, -29, true, 0, 0x883344, 25, null, true);
    for (let i = 0; i < 50; i++) rush.step(1 / 60, 0, 0, undefined, 11);
    // Incoming traffic has entered the combat corridor and its firing clock expired.
    expect(rush.z).toBeGreaterThan(-14);
    expect(rush.tryFire(0, 11)).toBe(false); // danger zone already crossed
    rush.dispose(scene);

    const gun = new TrafficVehicle(scene, 0, -32, true, 0, 0x883344, 24, null, true);
    for (let i = 0; i < 42; i++) gun.step(1 / 60, 0, 0, undefined, 8);
    expect(gun.state).toBe('intercept');
    expect(gun.tryFire(0, 8)).toBe(true);
    expect(gun.tryFire(0, 8)).toBe(false);
    gun.dispose(scene);
  });

});
