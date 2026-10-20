import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { makeSpeedboat } from './VehicleModels';
import { Helicopter } from '../combat/AirThreats';
import { WeaponsVan } from '../gameplay/WeaponsVan';

function countMeshes(group: THREE.Group): number {
  let count = 0;
  group.traverse(node => { if (node instanceof THREE.Mesh) count++; });
  return count;
}

describe('second-pass original hero visual assets', () => {
  it('boat has a contoured main hull, deep cockpit and twin propulsion units', () => {
    const boat = makeSpeedboat(false);
    expect(countMeshes(boat)).toBeGreaterThan(24);
    const sculpted = boat.children.filter(obj => obj instanceof THREE.Mesh &&
      obj.material instanceof THREE.MeshPhysicalMaterial);
    expect(sculpted.length).toBeGreaterThanOrEqual(2);
    const size = new THREE.Box3().setFromObject(boat).getSize(new THREE.Vector3());
    expect(size.z).toBeGreaterThan(6.4);
    expect(size.x).toBeLessThan(4);
  });

  it('helicopter rotor and independent tail rotor animate without changing its hitbox', () => {
    const scene = new THREE.Scene();
    const helicopter = new Helicopter(scene, 0, -85, 'ace');
    expect(countMeshes(helicopter.mesh)).toBeGreaterThan(28);
    const main = helicopter.mesh.getObjectByName('mainRotor');
    const tail = helicopter.mesh.getObjectByName('tailRotor');
    expect(main).toBeDefined();
    expect(tail).toBeDefined();
    const initialMain = main!.rotation.y, initialTail = tail!.rotation.x;
    helicopter.step(1 / 60, 0, 30);
    expect(main!.rotation.y).not.toBe(initialMain);
    expect(tail!.rotation.x).not.toBe(initialTail);
    expect(helicopter.hitbox()).toMatchObject({ halfWidth: 2.25, halfLength: 3.4 });
    helicopter.dispose();
    expect(scene.children).toHaveLength(0);
  });

  it('resupply truck ramp carries its detail when deployed and resets cleanly', () => {
    const scene = new THREE.Scene();
    const van = new WeaponsVan(scene);
    expect(countMeshes(van.mesh)).toBeGreaterThan(45);
    const ramp = van.mesh.children.find(node => node instanceof THREE.Mesh &&
      node.children.length >= 8);
    expect(ramp).toBeDefined();
    const childCount = ramp!.children.length;
    const angle = ramp!.rotation.x;
    expect(van.call()).toBe(true);
    for (let i = 0; i < 130; i++) van.step(1 / 60, 35, 6.4);
    expect(ramp!.children).toHaveLength(childCount);
    expect(ramp!.rotation.x).not.toBe(angle);
    van.reset();
    expect(van.mesh.visible).toBe(false);
    expect(van.mesh.parent).toBe(scene);
  });
});
