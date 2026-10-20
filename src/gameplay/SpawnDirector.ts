import type { TrafficVehicle } from '../entities/Traffic';

export const LANES = [-6.4, 0, 6.4] as const;

/** Keep the spawn horizon clear and avoid simultaneously blocking every route. */
export function selectSpawnLane(
  existing: ReadonlyArray<Pick<TrafficVehicle, 'x' | 'z'>>,
  spawnZ: number,
  random: () => number,
): number | null {
  const free = LANES.filter((lane) => !existing.some((car) =>
    Math.abs(car.z - spawnZ) < 15 && Math.abs(car.x - lane) < 3.3));
  if (free.length === 0) return null;
  return free[Math.min(free.length - 1, Math.floor(random() * free.length))];
}
