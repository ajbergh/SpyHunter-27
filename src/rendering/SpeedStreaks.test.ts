import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SpeedStreaks, streakOpacity } from './SpeedStreaks';

describe('performance-budgeted speed streaks', () => {
  it('appears only at higher driving speeds with bounded opacity', () => {
    expect(streakOpacity(18)).toBe(0);
    expect(streakOpacity(40)).toBeGreaterThan(0);
    expect(streakOpacity(300)).toBeLessThanOrEqual(0.47);
  });
  it('uses a single draw call and respects reduced motion and low quality', () => {
    const scene = new THREE.Scene();
    const streaks = new SpeedStreaks(scene);
    expect(scene.children).toEqual([streaks.lines]);
    streaks.setPreferences('high', false);
    streaks.step(1/60, 52);
    streaks.renderAt(() => 0);
    expect(streaks.lines.visible).toBe(true);
    expect(streaks.lines.geometry.drawRange.count).toBe(144);
    streaks.setPreferences('medium', false);
    streaks.renderAt(() => 0);
    expect(streaks.lines.geometry.drawRange.count).toBe(72);
    streaks.setPreferences('high', true);
    expect(streaks.lines.visible).toBe(false);
    streaks.setPreferences('low', false);
    expect(streaks.lines.visible).toBe(false);
  });
});
