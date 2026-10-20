import { describe, expect, it } from 'vitest';
import { GAME_MODES, isGameMode } from './GameModes';

describe('arcade game modes', () => {
  it('exposes three distinct gameplay configurations', () => {
    expect(GAME_MODES.modern.lives).toBeGreaterThan(GAME_MODES.classic.lives);
    expect(GAME_MODES.endless.spawnScale).toBeLessThan(GAME_MODES.classic.spawnScale);
    expect(isGameMode('classic')).toBe(true);
    expect(isGameMode('unknown')).toBe(false);
  });
});
