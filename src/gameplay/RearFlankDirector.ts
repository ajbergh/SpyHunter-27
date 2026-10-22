import { LANES } from './SpawnDirector';

/** Read-only positions; no randomness so pursuit timing is replay deterministic. */
export interface FlankTraffic {
  readonly x: number;
  readonly z: number;
  readonly hp: number;
  readonly role: string;
}
export interface FlankTarget {
  readonly targetX: number;
}

/**
 * A rear attacker begins an obvious, committed overtake in an empty adjacent
 * road lane while it is still safely behind the interceptor. Keep the
 * interceptor's nearest lane free. A busy or divided road cancels the flank
 * rather than forcing an unavoidable side swipe.
 */
export function planRearFlank(
  traffic: readonly FlankTraffic[],
  pursuer: FlankTraffic,
  playerX: number,
  playerZ: number,
  suppress = false,
): FlankTarget | null {
  const gap = pursuer.z - playerZ;
  if (suppress || pursuer.hp <= 0 || pursuer.role !== 'rear-pursuer' ||
      gap < 9 || gap > 39) return null;

  const playerLane = [...LANES].sort((a, b) =>
    Math.abs(a - playerX) - Math.abs(b - playerX))[0];
  // Prefer the nearest side lane to the pursuing vehicle. A tie chooses left
  // deterministically; the pass stays legible rather than chasing player input.
  const candidateLanes = LANES.filter(lane => lane !== playerLane)
    .sort((a, b) => Math.abs(a - pursuer.x) - Math.abs(b - pursuer.x));
  const lane = candidateLanes.find(targetX => !traffic.some(car =>
    car !== pursuer && car.hp > 0 &&
    Math.abs(car.x - targetX) < 3.3 &&
    car.z > playerZ - 50 && car.z < pursuer.z + 13));
  return lane === undefined ? null : { targetX: lane };
}
