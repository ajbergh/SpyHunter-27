import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { EnemyProjectiles } from './EnemyProjectiles';

describe('enemy firing', () => {
  it('moves an aimed round into the player hitbox', () => {
    const shots = new EnemyProjectiles(new THREE.Scene());
    expect(shots.spawn(0, -12, 0)).toBe(true);
    let hits = 0;
    for (let i=0;i<90;i++) hits += shots.step(1/60, 30, {x:0,z:11,halfWidth:1,halfLength:2});
    expect(hits).toBe(1);
    expect(shots.activeCount).toBe(0);
  });
  it('allows lateral dodging and cleans up missed shots', () => {
    const shots = new EnemyProjectiles(new THREE.Scene());
    shots.spawn(0, -12, 0);
    let hits = 0;
    for (let i=0;i<180;i++) hits += shots.step(1/60,30,{x:7,z:11,halfWidth:1,halfLength:2});
    expect(hits).toBe(0);
    expect(shots.activeCount).toBe(0);
  });
});
