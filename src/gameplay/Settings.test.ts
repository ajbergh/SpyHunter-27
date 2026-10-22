import { describe, expect, it } from 'vitest';
import {
  parsePreferences, DEFAULT_PREFERENCES, assignBinding, DEFAULT_BINDINGS,
  assignGamepadBinding, DEFAULT_GAMEPAD_BINDINGS,
} from './Settings';

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
    expect(parsePreferences({ highContrast: true }).highContrast).toBe(true);
  });
  it('accepts remaps and prevents duplicate or unusable keycodes', () => {
    const changed = assignBinding(DEFAULT_BINDINGS, 'fire', 'KeyZ');
    expect(changed?.fire).toBe('KeyZ');
    expect(assignBinding(DEFAULT_BINDINGS, 'fire', 'KeyW')).toBeNull();
    expect(assignBinding(DEFAULT_BINDINGS, 'fire', 'KeyG')).toBeNull();
    expect(assignBinding(DEFAULT_BINDINGS, 'gear', 'KeyZ')?.gear).toBe('KeyZ');
    expect(assignBinding(DEFAULT_BINDINGS, 'fire', 'Escape')).toBeNull();
    expect(assignBinding(DEFAULT_BINDINGS, 'fire', 'Delete')).toBeNull();
    expect(assignBinding(DEFAULT_BINDINGS, 'fire', 'KeyM')).toBeNull();
  });
  it('safely validates persisted bindings while maintaining arrow fallbacks', () => {
    const preferences = parsePreferences({
      bindings: { fire: 'KeyZ', missile: 'KeyW', pause: '<script>' },
    });
    expect(preferences.bindings.fire).toBe('KeyZ');
    expect(preferences.bindings.missile).toBe('KeyQ');
    expect(preferences.bindings.pause).toBe('KeyP');
    expect(preferences.bindings.gear).toBe('KeyG');
  });
  it('validates Gamepad API standard button mappings and blocks duplicate actions', () => {
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', 14)?.fire).toBe(14);
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', 1)).toBeNull();
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'gear', 5)?.gear).toBe(5);
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', 5)).toBeNull();
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', -1)).toBeNull();
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', 22)).toBeNull();
    expect(assignGamepadBinding(DEFAULT_GAMEPAD_BINDINGS, 'fire', 4.5)).toBeNull();
  });
  it('loads and safely rejects malformed persisted gamepad controls', () => {
    const p = parsePreferences({ gamepadBindings: { fire: 12, missile: 12, oil: -4 } });
    expect(p.gamepadBindings.fire).toBe(12);
    expect(p.gamepadBindings.missile).toBe(1);
    expect(p.gamepadBindings.oil).toBe(2);
    expect(p.gamepadBindings.gear).toBe(5);
  });

});
