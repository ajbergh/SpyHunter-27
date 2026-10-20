/** Stable UTC challenges; gameplay PRNG is independent of Math.random. */
export function challengeDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function challengeSeed(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid daily challenge date');
  let hash = 2166136261;
  for (const char of day) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailyRecordKey(day: string): string {
  return 'spyhunter27-daily-' + day;
}

export function bestDailyScore(existing: number, score: number): number {
  return Math.max(Number.isFinite(existing) ? Math.max(0, Math.floor(existing)) : 0,
    Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0);
}
