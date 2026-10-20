import { describe, expect, it } from 'vitest';
import { selectSpawnLane } from './SpawnDirector';
describe('safe lane generation', () => {
  it('avoids existing traffic at the spawn horizon', () => {
    expect(selectSpawnLane([{ x: -6.4, z: -90 }, { x: 0, z: -89 }], -90, () => 0)).toBe(6.4);
  });
  it('defers spawn when all lanes are occupied', () => {
    expect(selectSpawnLane([-6.4, 0, 6.4].map((x) => ({ x, z: -90 })), -90, () => 0)).toBeNull();
  });
  it('does not block distant vehicles', () => {
    expect(selectSpawnLane([{ x: -6.4, z: 15 }], -90, () => 0)).toBe(-6.4);
  });
});
