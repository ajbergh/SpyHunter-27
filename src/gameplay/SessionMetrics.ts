/** Session summary formatters; no browser APIs or rendering dependencies. */
export function accuracyPercent(shotsFired: number, shotsHit: number): number {
  if (!Number.isFinite(shotsFired) || shotsFired <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(shotsHit / shotsFired * 100)));
}
export function formatMissionTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' +
    String(seconds % 60).padStart(2, '0');
}
export function formatMissionDistance(distance: number): string {
  return (Math.max(0, distance) / 1000).toFixed(2) + ' KM';
}
