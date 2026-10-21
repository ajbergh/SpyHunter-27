import { LANES, selectSpawnLane } from './SpawnDirector';
import type { TrafficVehicle } from '../entities/Traffic';
import type { RouteSide } from './RouteDirector';

export interface EncounterSpawn {
  x: number;
  z: number;
  hostile: boolean;
  variant: number;
  oncoming?: boolean;
}
export type Encounter = { type: 'traffic' | 'pursuit-pair'; spawns: EncounterSpawn[] };

/**
 * Preset encounter patterns create deliberate rhythm without blocking every lane.
 * At most two vehicles appear per wave, always in separate lanes, with 12 units
 * of longitudinal separation and a reserved third escape lane.
 */
export function planEncounter(
  existing: ReadonlyArray<Pick<TrafficVehicle, 'x' | 'z'>>,
  distance: number,
  random: () => number,
  route: RouteSide | null = null,
  laneOptions: readonly number[] = LANES,
): Encounter {
  const startZ = -90;
  const first = selectSpawnLane(existing, startZ, random, laneOptions);
  if (first === null) return { type: 'traffic', spawns: [] };

  const hostile = random() < (route === 'left' ? 0.35 : route === 'right' ? 0.9 : 0.66);
  const variantRoll = random();
  const variant = hostile
    ? variantRoll < 0.11 ? 6 : variantRoll < 0.27 ? 4 : variantRoll < 0.44 ? 3 : variantRoll < 0.6 ? 2 : variantRoll < 0.76 ? 1 : 0
    : variantRoll < 0.08 ? 4 : variantRoll < 0.17 ? 2 : 0;
  const pairAllowed = hostile && distance > 420 && route !== 'left' &&
    random() < (route === 'right' ? 0.45 : 0.25);
  // Once combat escalates, some single opponents come down the road facing
  // the interceptor. Never stack a head-on rush with a pincer or safe left route.
  const oncoming = hostile && distance > 350 && route !== 'left' &&
    !pairAllowed && random() > 0.78;
  const firstSpawn: EncounterSpawn = {
    x: first, z: startZ, hostile,
    variant: oncoming ? (variant === 3 ? 3 : 0) : variant,
    oncoming,
  };
  if (!pairAllowed) return { type: 'traffic', spawns: [firstSpawn] };

  const available = laneOptions.filter((lane) => lane !== first &&
    !existing.some((car) => Math.abs(car.z - (startZ - 12)) < 15 && Math.abs(car.x - lane) < 3.3));
  if (available.length === 0) return { type: 'traffic', spawns: [firstSpawn] };

  const second = available[Math.min(available.length - 1, Math.floor(random() * available.length))];
  const reinforcement: EncounterSpawn = {
    x: second, z: startZ - 12, hostile: true,
    variant: random() < 0.35 ? 6 : random() < 0.6 ? 4 : 0,
  };
  return { type: 'pursuit-pair', spawns: [firstSpawn, reinforcement] };
}
