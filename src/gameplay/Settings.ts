export type Quality = 'low' | 'medium' | 'high';
export interface GamePreferences {
  quality: Quality;
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  showFps: boolean;
}
export const DEFAULT_PREFERENCES: GamePreferences = {
  quality: 'medium', effectsVolume: 0.7, musicVolume: 0.45,
  reducedMotion: false, showFps: false,
};
const KEY = 'spyhunter27-settings';
const isQuality = (value: unknown): value is Quality =>
  value === 'low' || value === 'medium' || value === 'high';
const volume = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
export function parsePreferences(input: unknown): GamePreferences {
  const obj = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    quality: isQuality(obj.quality) ? obj.quality : DEFAULT_PREFERENCES.quality,
    effectsVolume: volume(obj.effectsVolume, DEFAULT_PREFERENCES.effectsVolume),
    musicVolume: volume(obj.musicVolume, DEFAULT_PREFERENCES.musicVolume),
    reducedMotion: typeof obj.reducedMotion === 'boolean' ? obj.reducedMotion : DEFAULT_PREFERENCES.reducedMotion,
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
