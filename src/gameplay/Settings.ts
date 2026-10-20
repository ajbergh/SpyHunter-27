export type Quality = 'low' | 'medium' | 'high';

export const BINDING_ACTIONS = [
  'left', 'right', 'throttle', 'brake', 'fire', 'missile', 'oil', 'smoke', 'van', 'pause',
] as const;
export type BindingAction = typeof BINDING_ACTIONS[number];
export type KeyBindings = Record<BindingAction, string>;
export const DEFAULT_BINDINGS: KeyBindings = {
  left: 'KeyA', right: 'KeyD', throttle: 'KeyW', brake: 'KeyS', fire: 'Space',
  missile: 'KeyQ', oil: 'KeyE', smoke: 'KeyR', van: 'KeyF', pause: 'KeyP',
};
/** Arrow keys and Escape stay available as accessibility fallbacks. */
export function validBindingCode(code: unknown): code is string {
  return typeof code === 'string' && code !== 'KeyM' && /^(Key[A-Z]|Digit[0-9]|Space|ShiftLeft|ShiftRight)$/.test(code);
}
export function assignBinding(
  bindings: KeyBindings, action: BindingAction, code: string,
): KeyBindings | null {
  if (!validBindingCode(code)) return null;
  if (BINDING_ACTIONS.some((other) => other !== action && bindings[other] === code)) return null;
  return { ...bindings, [action]: code };
}
export interface GamePreferences {
  quality: Quality;
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  highContrast: boolean;
  showFps: boolean;
  bindings: KeyBindings;
}
export const DEFAULT_PREFERENCES: GamePreferences = {
  quality: 'medium', effectsVolume: 0.7, musicVolume: 0.45,
  reducedMotion: false, highContrast: false, showFps: false, bindings: { ...DEFAULT_BINDINGS },
};
const KEY = 'spyhunter27-settings';
const isQuality = (value: unknown): value is Quality =>
  value === 'low' || value === 'medium' || value === 'high';
const volume = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
export function parsePreferences(input: unknown): GamePreferences {
  const obj = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const stored = obj.bindings && typeof obj.bindings === 'object'
    ? obj.bindings as Record<string, unknown> : {};
  const bindings: KeyBindings = { ...DEFAULT_BINDINGS };
  for (const action of BINDING_ACTIONS) {
    const code = stored[action];
    if (validBindingCode(code)) {
      const assigned = assignBinding(bindings, action, code);
      if (assigned) Object.assign(bindings, assigned);
    }
  }
  return {
    bindings,
    quality: isQuality(obj.quality) ? obj.quality : DEFAULT_PREFERENCES.quality,
    effectsVolume: volume(obj.effectsVolume, DEFAULT_PREFERENCES.effectsVolume),
    musicVolume: volume(obj.musicVolume, DEFAULT_PREFERENCES.musicVolume),
    reducedMotion: typeof obj.reducedMotion === 'boolean' ? obj.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
    highContrast: typeof obj.highContrast === 'boolean' ? obj.highContrast : DEFAULT_PREFERENCES.highContrast,
    showFps: typeof obj.showFps === 'boolean' ? obj.showFps : DEFAULT_PREFERENCES.showFps,
  };
}
export function loadPreferences(): GamePreferences {
  try { return parsePreferences(JSON.parse(localStorage.getItem(KEY) ?? '{}')); }
  catch { return { ...DEFAULT_PREFERENCES }; }
}
export function savePreferences(settings: GamePreferences): void {
  try { localStorage.setItem(KEY, JSON.stringify(parsePreferences(settings))); }
  catch { /* Storage permissions may be disabled. */ }
}
