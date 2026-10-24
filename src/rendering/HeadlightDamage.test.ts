import { describe, expect, it } from 'vitest';
import { damagedHeadlampFactors } from './HeadlightDamage';

describe('bounded directional interceptor headlamp wear', () => {
  it('keeps pristine and opposite headlamps fully illuminated', () => {
    expect(damagedHeadlampFactors(0, -1)).toEqual({ left: 1, right: 1 });
    expect(damagedHeadlampFactors(1, -1)).toEqual({ left: 0.78, right: 1 });
    expect(damagedHeadlampFactors(2, 1)).toEqual({ left: 1, right: 0.46 });
    expect(damagedHeadlampFactors(3, -1)).toEqual({ left: 0.18, right: 1 });
  });
  it('handles centered strikes, invalid values and saturation without negative light', () => {
    expect(damagedHeadlampFactors(1, 0)).toEqual({ left: 0.78, right: 0.78 });
    expect(damagedHeadlampFactors(3, 0)).toEqual({ left: 0.18, right: 0.18 });
    expect(damagedHeadlampFactors(100, Number.NaN)).toEqual({ left: 0.18, right: 0.18 });
    expect(damagedHeadlampFactors(-5, -1)).toEqual({ left: 1, right: 1 });
    expect(damagedHeadlampFactors(Number.NaN, 1)).toEqual({ left: 1, right: 1 });
  });
});
