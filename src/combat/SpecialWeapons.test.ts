import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SpecialWeapons } from './SpecialWeapons';
import { Helicopter } from './AirThreats';

describe('special weapon inventory', () => {
  it('uses ammunition, respects cooldown and supports resupply', () => {
    const w = new SpecialWeapons(new THREE.Scene());
    expect(w.counts.missile).toBe(3);
    expect(w.use('missile', 0)).toBe(true);
    expect(w.counts.missile).toBe(2);
    expect(w.use('missile', 0)).toBe(false);
    w.step(1, 30, []);
    expect(w.use('oil', 0)).toBe(true);
    expect(w.counts.oil).toBe(1);
    w.refill();
    expect(w.counts.oil).toBe(2);
    expect(w.counts.missile).toBe(3);
    w.reset();
    expect(w.counts.smoke).toBe(2);
  });
  it('limits ammunition across all types', () => {
    const w = new SpecialWeapons(new THREE.Scene());
    for (let i = 0; i < 3; i++) {
      expect(w.use('missile', 0)).toBe(true);
      w.step(0.7, 30, []);
    }
    expect(w.use('missile', 0)).toBe(false);
    w.reset();
    expect(w.counts.missile).toBe(3);
  });
  it('locks missiles onto airborne targets instead of road vehicles', () => {
    const scene = new THREE.Scene();
    const weapons = new SpecialWeapons(scene);
    const helicopter = new Helicopter(scene, 0, -35);
    const traffic = [] as const;
    expect(weapons.use('missile', 0)).toBe(true);
    let intercepts = 0;
    for (let i = 0; i < 110; i++) {
      const effects = weapons.step(1 / 60, 30, traffic, [helicopter]);
      intercepts += effects.filter((effect) => 'aircraft' in effect).length;
      if (helicopter.hp <= 0) break;
    }
    expect(intercepts).toBe(1);
    expect(helicopter.hp).toBe(0);
    helicopter.dispose();
    weapons.reset();
  });
  it('converts oil into a damaging flaming wake in watercraft mode', () => {
    const scene = new THREE.Scene();
    const weapons = new SpecialWeapons(scene);
    expect(weapons.use('oil', 0, true)).toBe(true);
    const hostile = {
      x: 0, z: 17, hp: 2, hostile: true,
      spinOut: () => { throw new Error('flames should not spin out targets'); },
      disrupt: () => { throw new Error('flames should not just disrupt targets'); },
    };
    const impacts = weapons.step(0, 30, [hostile as never], []);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].kind).toBe('flame');
    expect(hostile.hp).toBeLessThan(0);
    weapons.reset();
  });

  it('awards branch-specific ammo without exceeding inventory capacity', () => {
    const weapons = new SpecialWeapons(new THREE.Scene());
    expect(weapons.grantAmmo('smoke')).toBe(0);
    expect(weapons.use('smoke', 0)).toBe(true);
    expect(weapons.grantAmmo('smoke')).toBe(1);
    expect(weapons.counts.smoke).toBe(2);
    expect(weapons.grantAmmo('missile', -1)).toBe(0);
    weapons.reset();
  });

  it('maintains a bounded trail while guided missiles fly and clears it on reset', () => {
    const scene = new THREE.Scene();
    const weapons = new SpecialWeapons(scene);
    const children = scene.children.length;
    expect(weapons.use('missile', 0)).toBe(true);
    for (let i = 0; i < 25; i++) weapons.step(1/60, 30, []);
    expect(weapons.activeMissileTrails).toBeGreaterThan(0);
    expect(weapons.activeMissileTrails).toBeLessThanOrEqual(128);
    weapons.renderAt(() => 1);
    expect(scene.children.length).toBe(children + 1);
    weapons.reset();
    expect(weapons.activeMissileTrails).toBe(0);
    expect(scene.children.length).toBe(children);
  });

});
