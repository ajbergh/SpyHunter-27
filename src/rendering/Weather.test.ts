import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Weather } from './Weather';

describe('single draw-call weather particles', () => {
  it('offers quality tiers with bounded particle counts', () => {
    const weather = new Weather(new THREE.Scene());
    weather.setBiome('snow');
    weather.setQuality('low');
    expect(weather.active).toBe(55);
    weather.setQuality('high');
    expect(weather.active).toBe(320);
  });
  it('stops emitting during clear forest scenes and resumes in desert', () => {
    const weather = new Weather(new THREE.Scene());
    weather.setQuality('medium');
    expect(weather.active).toBe(0);
    weather.step(1 / 60, 45, 'desert');
    expect(weather.active).toBe(160);
  });
});
