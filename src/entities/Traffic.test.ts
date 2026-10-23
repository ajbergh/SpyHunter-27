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
    for (let i = 0; i < 100; i++) rush.step(1 / 60, 0, 0, undefined, 11);
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


  it('lets faster highway traffic pull away during braking instead of advancing artificially', () => {
    const scene = new THREE.Scene();
    const civilian = new TrafficVehicle(scene, 0, -25, false, 0, 0x778899, 20);
    const initial = civilian.z;
    civilian.step(1, 10, 0);
    expect(civilian.z).toBeCloseTo(initial - 10);
    civilian.step(1, 40, 0);
    expect(civilian.z).toBeCloseTo(initial + 10);
    civilian.dispose(scene);
  });

  it('rear pursuit closes on Low, can be outrun in High, and allows steering escape', () => {
    const scene = new THREE.Scene();
    const tail = new TrafficVehicle(scene, 0, 34, true, 0, 0xd7a64e, 48, null, false, true);
    expect(tail.role).toBe('rear-pursuer');
    expect(tail.oncoming).toBe(false);
    expect(tail.rearPursuer).toBe(true);
    expect(tail.hitbox().halfWidth).toBeGreaterThan(1);
    const start = tail.z;
    tail.step(1, 41, 6.4, undefined, -1);
    expect(tail.z).toBeCloseTo(start - 7);
    expect(tail.state).toBe('pursuing');
    expect(tail.x).toBeGreaterThan(0);
    expect(tail.x).toBeLessThan(3);
    const close = tail.z;
    tail.step(1, 58, -6.4, undefined, -10);
    expect(tail.z).toBeCloseTo(close + 10);
    expect(tail.x).toBeGreaterThan(-2);
    expect(tail.tryFire(0, -10)).toBe(false);
    tail.dispose(scene);
    expect(scene.children).toHaveLength(0);
  });

  it('smoke disrupts rear pursuit and temporarily interrupts lane tracking', () => {
    const scene = new THREE.Scene();
    const tail = new TrafficVehicle(scene, 0, 29, true, 0, 0xd7a64e, 48, null, false, true);
    tail.disrupt(0.65);
    const initialX = tail.x;
    for (let i = 0; i < 20; i++) tail.step(1 / 60, 34, 6.4, undefined, 8);
    expect(tail.state).toBe('disrupted');
    expect(tail.x).toBe(initialX);
    for (let i = 0; i < 50; i++) tail.step(1 / 60, 34, 6.4, undefined, 8);
    expect(tail.state).toBe('pursuing');
    expect(tail.x).toBeGreaterThan(initialX);
    tail.dispose(scene);
  });


  it('commits to a vacant overtaking lane, then screens gradually only after clearing the nose', () => {
    const scene = new THREE.Scene();
    const tail = new TrafficVehicle(scene, 0, 34, true, 0, 0xc58235, 48, null, false, true);
    tail.step(1 / 60, 30, 0, { type: 'overtake', targetX: -6.4 }, 8);
    expect(tail.state).toBe('overtaking');
    expect(tail.x).toBeLessThan(0);

    // The original pass lane remains locked even if the player changes lanes
    // and another plan attempts to retarget it.
    for (let i = 0; i < 60; i++)
      tail.step(1 / 60, 30, 6.4, { type: 'overtake', targetX: 6.4 }, 8);
    expect(tail.x).toBeLessThan(-5);
    expect(tail.state).toBe('overtaking');
    for (let i = 0; i < 105; i++) tail.step(1 / 60, 30, 0, undefined, 8);
    expect(tail.z).toBeLessThan(8 - 18);
    expect(tail.state).toBe('screening');
    expect(tail.x).toBeGreaterThan(-6.4);
    const screeningX = tail.x;
    tail.disrupt(0.4);
    for (let i = 0; i < 12; i++) tail.step(1 / 60, 30, 0, undefined, 8);
    expect(tail.state).toBe('disrupted');
    expect(tail.x).toBeCloseTo(screeningX);
    // After the temporary disruption, an overtaken rear flanker must not
    // silently become a generic front interceptor when it gets far ahead.
    for (let i = 0; i < 210; i++) tail.step(1 / 60, 30, 0, undefined, 8);
    expect(tail.z).toBeLessThan(8 - 52);
    expect(tail.state).toBe('screening');
    expect(tail.hitbox().z).toBe(tail.z);
    tail.dispose(scene);
  });

  it('keeps legacy rear tracking if no safe overtaking order is available', () => {
    const scene = new THREE.Scene();
    const tail = new TrafficVehicle(scene, 0, 33, true, 0, 0xc58235, 48, null, false, true);
    for (let i = 0; i < 30; i++) tail.step(1 / 60, 32, 6.4, undefined, 8);
    expect(tail.state).toBe('pursuing');
    expect(tail.x).toBeGreaterThan(0);
    expect(tail.x).toBeLessThan(6.4);
    tail.dispose(scene);
  });


  it('maintains an open center when an assigned rear attacker holds the outer lane', () => {
    const scene = new THREE.Scene();
    const front = new TrafficVehicle(scene, -6.4, -79, true, 2, 0x793248, 11);
    const tail = new TrafficVehicle(scene, 6.4, 36, true, 0, 0xe7a840, 47.5,
      null, false, true);
    for (let i = 0; i < 110; i++) {
      front.step(1 / 60, 30, 0, undefined, 8);
      tail.step(1 / 60, 30, 0, { type: 'hold-lane', targetX: 6.4 }, 8);
    }
    expect(tail.state).toBe('pressuring');
    expect(front.role).toBe('blocker');
    expect(tail.x).toBeCloseTo(6.4);
    expect(front.x).toBeCloseTo(-6.4);
    expect(tail.z).toBeLessThan(8); // overtook the player's depth
    expect(front.z).toBeLessThan(8); // forward blocker approaches
    expect(Math.abs(front.x) - front.halfWidth).toBeGreaterThan(3.0);
    expect(Math.abs(tail.x) - tail.halfWidth).toBeGreaterThan(3.0);
    const before = tail.x;
    tail.disrupt(0.3);
    for (let i = 0; i < 8; i++)
      tail.step(1 / 60, 30, -6.4, { type: 'hold-lane', targetX: 6.4 }, 8);
    expect(tail.state).toBe('disrupted');
    expect(tail.x).toBeCloseTo(before);
    front.dispose(scene);
    tail.dispose(scene);
    expect(scene.children).toHaveLength(0);
  });


  it('shows partial hostile damage immediately and observes damage dealt by special weapons', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, 0, -24, true, 2, 0x974453, 10);
    expect(car.hp).toBe(4);
    expect(car.damageFeedback.materialCount).toBeGreaterThan(0);
    car.hp--;
    car.recordImpact();
    expect(car.damageFeedback.flashing).toBe(true);
    for (let i = 0; i < 60; i++) car.step(1 / 60, 25, 0);
    expect(car.damageFeedback.flashing).toBe(false);
    car.hp--; // Direct damage from splash/special weapons is observed next step.
    car.step(1 / 60, 25, 0);
    expect(car.damageFeedback.flashing).toBe(true);
    expect(car.hitbox().halfWidth).toBe(1.4);
    car.dispose(scene);
    expect(scene.children).toHaveLength(0);
  });


  it('keeps vehicle gameplay hitbox, AI velocity and mesh topology stable as panel damage progresses', () => {
    const scene = new THREE.Scene();
    const car = new TrafficVehicle(scene, -1.5, -25, true, 2, 0xa1544f, 12);
    const hitbox = car.hitbox();
    const shape = car.mesh.children[0] as THREE.Mesh;
    const geometry = shape.geometry;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const version = position.version;
    const children = car.mesh.children.length;
    car.hp -= 2;
    car.recordImpact(1);
    expect(car.damageFeedback.damageStage).toBe(2);
    expect(car.damageFeedback.isDented).toBe(true);
    expect(position.version).toBeGreaterThan(version);
    expect(car.hitbox()).toEqual(hitbox);
    expect(car.mesh.children).toHaveLength(children);
    expect(shape.geometry).toBe(geometry);
    car.step(1 / 60, 30, 0);
    expect(car.hitbox().halfWidth).toBe(hitbox.halfWidth);
    expect(car.hitbox().halfLength).toBe(hitbox.halfLength);
    expect(car.z).toBeCloseTo(hitbox.z + (30 - 12) / 60);
    const stage = car.damageFeedback.damageStage;
    for (let i = 0; i < 120; i++) car.step(1 / 60, 30, 0);
    expect(car.damageFeedback.damageStage).toBe(stage);
    expect(car.damageFeedback.flashing).toBe(false);
    car.dispose(scene);
    expect(scene.children).toHaveLength(0);
  });

});
