import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SpeedStreaks, streakOpacity } from './SpeedStreaks';

describe('performance-budgeted speed streaks', () => {
  it('appears only at higher driving speeds with bounded opacity', () => {
    expect(streakOpacity(18)).toBe(0);
    expect(streakOpacity(40)).toBeGreaterThan(0);
    expect(streakOpacity(300)).toBeLessThanOrEqual(0.47);
  });
  it('omits draw calls and uploads at cruising speeds, then resumes immediately', () => {
    const streaks = new SpeedStreaks(new THREE.Scene());
    let centerCalls = 0;
    const center = (_z: number): number => { centerCalls++; return 0; };
    const attr = streaks.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const initialVersion = attr.version;
    streaks.setPreferences('high', false);
    streaks.step(1 / 60, 20);
    streaks.renderAt(center);
    expect(streaks.lines.visible).toBe(false);
    expect(attr.version).toBe(initialVersion);
    expect(centerCalls).toBe(0);

    streaks.step(1 / 60, 49);
    streaks.renderAt(center);
    expect(streaks.lines.visible).toBe(true);
    expect(centerCalls).toBe(144);
    expect(attr.version).toBeGreaterThan(initialVersion);

    const activeVersion = attr.version;
    streaks.step(1 / 60, 24);
    streaks.renderAt(center);
    expect(streaks.lines.visible).toBe(false);
    expect(attr.version).toBe(activeVersion);
    expect(centerCalls).toBe(144);

    streaks.setPreferences('high', true);
    streaks.step(1 / 60, 70);
    streaks.renderAt(center);
    expect(streaks.lines.visible).toBe(false);
    expect(attr.version).toBe(activeVersion);
    streaks.setPreferences('high', false);
    expect(streaks.lines.visible).toBe(true);
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
