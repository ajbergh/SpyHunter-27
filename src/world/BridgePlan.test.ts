import { describe, expect, it } from 'vitest';
import { bridgeAhead, bridgeZone, groundHeightAt, BRIDGE_CYCLE } from './BridgePlan';

describe('curved-road elevated bridge set pieces', () => {
  it('selects two different bridge types and repeats across regions', () => {
    expect(bridgeZone(1350)?.type).toBe('canyon');
    expect(bridgeZone(3330)?.type).toBe('viaduct');
    expect(bridgeZone(1350 + BRIDGE_CYCLE)?.type).toBe('canyon');
    expect(bridgeZone(2200)).toBeNull();
  });
  it('keeps the terrain surface continuous across entrance and exit', () => {
    for (const boundary of [1310, 1445, 3270, 3395]) {
      expect(Math.abs(groundHeightAt(boundary + 0.001) - groundHeightAt(boundary - 0.001)))
        .toBeLessThan(0.005);
    }
    expect(groundHeightAt(1360)).toBeLessThan(-3.7);
    expect(groundHeightAt(3340)).toBeLessThan(-2.9);
    expect(groundHeightAt(1900)).toBe(-0.22);
  });
  it('warns before a bridge without spamming during the crossing', () => {
    expect(bridgeAhead(1240)).toEqual({ type: 'canyon', meters: 70, start: 1310 });
    expect(bridgeAhead(1210)).toBeNull();
    expect(bridgeAhead(1370)).toBeNull();
  });
});
