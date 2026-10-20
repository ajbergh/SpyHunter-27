import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WeaponsVan } from './WeaponsVan';

describe('weapons van', () => {
  it('docks only when the player is physically aligned with the rear ramp', () => {
    const van = new WeaponsVan(new THREE.Scene());
    expect(van.call()).toBe(true);
    expect(van.call()).toBe(false);
    let docked = false;
    for (let i = 0; i < 450; i++) {
      if (van.step(1 / 60, 35, 6.4) === 'docked') { docked = true; break; }
    }
    expect(docked).toBe(true);
    expect(van.isDocking).toBe(true);
  });
  it('reports missed docking when driver fails to align', () => {
    const van = new WeaponsVan(new THREE.Scene());
    van.call();
    let missed = false;
    for (let i = 0; i < 450; i++) {
      if (van.step(1 / 60, 35, -6.4) === 'missed') { missed = true; break; }
    }
    expect(missed).toBe(true);
    expect(van.isDocking).toBe(false);
  });
});
