import { biomeAt } from './WorldPlan';

/** Two navigable branches divide around a center barrier, then rejoin. */
export const SPLIT_PERIOD = 2200;
export const SPLIT_START = 550;
export const SPLIT_END = 790;
const RAMP = 55;
const MAX_HALF_GAP = 2.65;

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/** World-relative divider half-width; zero outside divided-road encounters. */
export function splitMedianHalfWidth(distance: number): number {
  if (biomeAt(distance) === 'water') return 0;
  const phase = ((distance % SPLIT_PERIOD) + SPLIT_PERIOD) % SPLIT_PERIOD;
  if (phase < SPLIT_START || phase > SPLIT_END) return 0;
  const expand = smoothstep((phase - SPLIT_START) / RAMP);
  const contract = smoothstep((SPLIT_END - phase) / RAMP);
  return MAX_HALF_GAP * Math.min(expand, contract);
}

export function splitDangerous(distance: number, laneX: number, halfWidth = 1.03): boolean {
  const gap = splitMedianHalfWidth(distance);
  return gap > 1.15 && Math.abs(laneX) < gap + halfWidth - 0.18;
}

export function upcomingSplit(distance: number): number | null {
  const next = Math.floor(Math.max(0, distance) / SPLIT_PERIOD) * SPLIT_PERIOD + SPLIT_START;
  if (biomeAt(next) === 'water') return null;
  const meters = next - distance;
  return meters > 0 && meters <= 110 ? meters : null;
}

export function escapeFromMedian(laneX: number, distance: number, halfWidth = 1.03): number {
  const gap = splitMedianHalfWidth(distance);
  const sign = laneX < 0 ? -1 : 1;
  return sign * Math.min(8.25, gap + halfWidth + 0.35);
}
