import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { AirThreats } from './AirThreats';
import { PLAYER_Z } from '../core/logic';

describe('air threats', () => {
  it('creates targetable helicopters, then removes destroyed targets', () => {
    const threats = new AirThreats(new THREE.Scene());
    const heli = threats.spawn(0);
    expect(threats.helicopters).toHaveLength(1);
    expect(heli.hp).toBe(3);
    expect(heli.hitbox().halfWidth).toBeGreaterThan(1);
    heli.hp = 0;
    threats.step(1/60, 0, 30, { x: 0, z: PLAYER_Z, halfWidth: 1, halfLength: 2 });
    expect(threats.helicopters).toHaveLength(0);
  });
  it('telegraphs bombs before applying an impact', () => {
    const threats = new AirThreats(new THREE.Scene());
    threats.spawn(0);
    const box = { x: 0, z: PLAYER_Z, halfWidth: 1.2, halfLength: 2 };
    let warned = false;
    let detonated = false;
    for (let i = 0; i < 500; i++) {
      const events = threats.step(1/60, 0, 30, box);
      if (events.some((e) => e.kind === 'bomb-warning')) warned = true;
      if (events.some((e) => e.kind === 'bomb-detonated')) {
        detonated = true;
        break;
      }
    }
    expect(warned).toBe(true);
    expect(detonated).toBe(true);
    threats.reset();
    expect(threats.activeBombs).toBe(0);
  });
});
