import { describe, expect, it } from 'vitest';
import { parsePreferences, DEFAULT_PREFERENCES } from './Settings';

describe('durable graphics and audio preferences', () => {
  it('supplies safe defaults for missing data', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });
  it('rejects invalid quality and clamps volume ranges', () => {
    const p = parsePreferences({ quality: 'ultra', effectsVolume: 99, musicVolume: -2, showFps: true });
    expect(p.quality).toBe('medium');
    expect(p.effectsVolume).toBe(1);
    expect(p.musicVolume).toBe(0);
    expect(p.showFps).toBe(true);
  });
});
