import { describe, expect, it } from 'vitest';
import { engineToneProfile, type DriveSoundControls } from './EngineResponse';
import { BIOMES } from '../world/WorldPlan';
import { transmissionResponse } from '../gameplay/Transmission';

const cruising: DriveSoundControls = {
  gear: 'low', throttle: false, brake: false, steer: 0, acceleration: 0,
};

describe('continuous engine/load and road texture model', () => {
  it('makes throttle brighten/rev, braking unload and high gear reduce revs at equal speed', () => {
    const coast = engineToneProfile('forest', 32, cruising);
    const throttle = engineToneProfile('forest', 32, {
      ...cruising, throttle: true, acceleration: 8,
    });
    const braking = engineToneProfile('forest', 32, {
      ...cruising, brake: true, acceleration: -8,
    });
    const high = engineToneProfile('forest', 32, { ...cruising, gear: 'high' });
    expect(throttle.engineHz).toBeGreaterThan(coast.engineHz);
    expect(throttle.engineGain).toBeGreaterThan(coast.engineGain);
    expect(throttle.filterHz).toBeGreaterThan(coast.filterHz);
    expect(braking.engineHz).toBeLessThan(coast.engineHz);
    expect(braking.engineGain).toBeLessThan(coast.engineGain);
    expect(high.engineHz).toBeLessThan(coast.engineHz);
    expect(high.textureGain).toBe(coast.textureGain);
  });

  it('keeps an upshift audibly lower despite higher acceleration toward High-gear target speed', () => {
    for (const speed of [25, 29, 35, 40, 48, 58]) {
      const low = transmissionResponse('low', speed, true, false);
      const high = transmissionResponse('high', speed, true, false);
      const before = engineToneProfile('forest', speed, {
        ...cruising, throttle: true, gear: 'low',
        acceleration: (low.targetSpeed - speed) * low.responseRate,
      });
      const after = engineToneProfile('forest', speed, {
        ...cruising, throttle: true, gear: 'high',
        acceleration: (high.targetSpeed - speed) * high.responseRate,
      });
      expect(after.engineHz, `upshift at speed ${speed}`)
        .toBeLessThan(before.engineHz - 24);
    }
  });

  it('distinguishes road, desert grit, snow slip, city pavement and water propwash', () => {
    const forest = engineToneProfile('forest', 35, cruising);
    const desert = engineToneProfile('desert', 35, cruising);
    const city = engineToneProfile('city', 35, cruising);
    const snow = engineToneProfile('snow', 35, cruising);
    const boat = engineToneProfile('forest', 35, cruising, true);
    const nativeWater = engineToneProfile('water', 35, cruising, true);
    expect(desert.textureGain).toBeGreaterThan(forest.textureGain);
    expect(snow.textureFilterHz).toBeGreaterThan(forest.textureFilterHz);
    expect(city.textureHz).toBeGreaterThan(desert.textureHz);
    expect(boat).toEqual(nativeWater);
    expect(boat.textureGain).toBeGreaterThan(forest.textureGain);
    const slipping = engineToneProfile('snow', 35, { ...cruising, steer: 1 });
    expect(slipping.textureGain).toBeGreaterThan(snow.textureGain);
    const braking = engineToneProfile('desert', 35, { ...cruising, brake: true });
    expect(braking.textureGain).toBeGreaterThan(desert.textureGain);
  });

  it('is finite and strictly bounded for every biome and invalid/wild inputs', () => {
    for (const biome of BIOMES) {
      const value = engineToneProfile(biome, Number.POSITIVE_INFINITY, {
        gear: 'high', throttle: true, brake: false, steer: Number.NaN,
        acceleration: Number.POSITIVE_INFINITY,
      });
      expect(value.engineHz).toBeGreaterThanOrEqual(45);
      expect(value.engineHz).toBeLessThanOrEqual(560);
      expect(value.textureGain).toBeLessThanOrEqual(0.018);
      expect(value.filterHz).toBeLessThanOrEqual(1550);
      expect(Object.values(value).every(Number.isFinite)).toBe(true);
      expect(engineToneProfile(biome, 35, cruising))
        .toEqual(engineToneProfile(biome, 35, cruising));
    }
    const negative = engineToneProfile('city', -90, {
      gear: 'low', throttle: false, brake: true, steer: -100,
      acceleration: -9999,
    });
    expect(negative.engineHz).toBeGreaterThanOrEqual(45);
    expect(negative.textureGain).toBeGreaterThanOrEqual(0);
  });
});
