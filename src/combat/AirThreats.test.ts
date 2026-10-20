import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { AirThreats, BOMB_WARNING_SECONDS, bombDropDistance } from './AirThreats';
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
  it('maintains a predictable warning lead across player speeds', () => {
    for (const speed of [20, 30, 46, 54]) {
      expect(bombDropDistance(speed)).toBeCloseTo(speed * BOMB_WARNING_SECONDS, 7);
    }
    expect(bombDropDistance(8)).toBe(15);
  });
  it('permits dodging a predicted bomb after its warning', () => {
    const threats = new AirThreats(new THREE.Scene());
    threats.spawn(0);
    const hitbox = { x: 0, z: PLAYER_Z, halfWidth: 1.03, halfLength: 2.16 };
    let warned = false;
    let eventHit: boolean | undefined;
    for (let i = 0; i < 480; i++) {
      const events = threats.step(1 / 60, warned ? 6.3 : 0, 54,
        { ...hitbox, x: warned ? 6.3 : 0 });
      if (events.some(event => event.kind === 'bomb-warning')) warned = true;
      const detonation = events.find(event => event.kind === 'bomb-detonated');
      if (detonation) { eventHit = detonation.playerHit; break; }
    }
    expect(warned).toBe(true);
    expect(eventHit).toBe(false);
    threats.reset();
  });

});
