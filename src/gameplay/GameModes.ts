export const GAME_MODES = {
  classic: { label: 'Classic Arcade', description: 'Three lives. Fast enemies. Every impact counts.', lives: 3, spawnScale: 0.87, speedScale: 1 },
  modern: { label: 'Modern Arcade', description: 'Extra protection and more room to learn.', lives: 5, spawnScale: 1.2, speedScale: 0.92 },
  endless: { label: 'Endless Pursuit', description: 'Unrelenting pressure and an escalating encounter rate.', lives: 3, spawnScale: 0.76, speedScale: 1.08 },
  daily: { label: 'Daily Challenge', description: 'A shared UTC encounter seed. Beat your best score today.', lives: 3, spawnScale: 0.9, speedScale: 1 },
} as const;

export type GameMode = keyof typeof GAME_MODES;
export const isGameMode = (mode: string): mode is GameMode => mode in GAME_MODES;
