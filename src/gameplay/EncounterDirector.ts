import { LANES, selectSpawnLane } from './SpawnDirector';
import type { TrafficVehicle } from '../entities/Traffic';

export interface EncounterSpawn {
  x: number;
  z: number;
  hostile: boolean;
  variant: number;
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
): Encounter {
  const startZ = -90;
  const first = selectSpawnLane(existing, startZ, random);
  if (first === null) return { type: 'traffic', spawns: [] };

  const hostile = random() < 0.66;
  const variantRoll = random();
  const variant = hostile
    ? variantRoll < 0.16 ? 4 : variantRoll < 0.34 ? 3 : variantRoll < 0.53 ? 2 : variantRoll < 0.72 ? 1 : 0
    : variantRoll < 0.08 ? 4 : variantRoll < 0.17 ? 2 : 0;
  const firstSpawn: EncounterSpawn = { x: first, z: startZ, hostile, variant };

  const pairAllowed = hostile && distance > 420 && random() < 0.25;
  if (!pairAllowed) return { type: 'traffic', spawns: [firstSpawn] };

  const available = LANES.filter((lane) => lane !== first &&
    !existing.some((car) => Math.abs(car.z - (startZ - 12)) < 15 && Math.abs(car.x - lane) < 3.3));
  if (available.length === 0) return { type: 'traffic', spawns: [firstSpawn] };

  const second = available[Math.min(available.length - 1, Math.floor(random() * available.length))];
  const reinforcement: EncounterSpawn = {
    x: second, z: startZ - 12, hostile: true,
    variant: random() < 0.55 ? 4 : 0,
  };
  return { type: 'pursuit-pair', spawns: [firstSpawn, reinforcement] };
}
